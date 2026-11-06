<script setup lang="ts">
import * as z from "zod";
import { nanoid } from "nanoid";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();
const { datasetId } = route.params as { datasetId: string };

const saveLoading = ref(false);
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  collaborators: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      identifier: z.string(),
    }),
  ),
  leadSponsorIdentifier: z.string(),
  leadSponsorName: z.string(),
  responsiblePartyInvestigatorAffiliationIdentifier: z.string(),
  responsiblePartyInvestigatorAffiliationName: z.string(),
  responsiblePartyInvestigatorFamilyName: z.string(),
  responsiblePartyInvestigatorGivenName: z.string(),
  responsiblePartyInvestigatorIdentifierValue: z.string(),
  responsiblePartyInvestigatorTitle: z.string(),
  responsiblePartyType: z.string(),
  studyCentralContacts: z.array(
    z.object({
      id: z.string(),
      affiliation: z.string(),
      affiliationIdentifier: z.string(),
      degree: z.string(),
      deleted: z.boolean(),
      emailAddress: z.string(),
      familyName: z.string(),
      givenName: z.string(),
      identifier: z.string(),
      local: z.boolean(),
      phone: z.string(),
      phoneExt: z.string(),
    }),
  ),
  studyOverallOfficials: z.array(
    z.object({
      id: z.string(),
      affiliation: z.string(),
      affiliationIdentifier: z.string(),
      degree: z.string(),
      deleted: z.boolean(),
      familyName: z.string(),
      givenName: z.string(),
      identifier: z.string(),
      local: z.boolean(),
      role: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  collaborators: [],
  leadSponsorIdentifier: "",
  leadSponsorName: "",
  responsiblePartyInvestigatorAffiliationIdentifier: "",
  responsiblePartyInvestigatorAffiliationName: "",
  responsiblePartyInvestigatorFamilyName: "",
  responsiblePartyInvestigatorGivenName: "",
  responsiblePartyInvestigatorIdentifierValue: "",
  responsiblePartyInvestigatorTitle: "",
  responsiblePartyType: "",
  studyCentralContacts: [],
  studyOverallOfficials: [],
});

const { data, error, refresh } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/team-contacts`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

// Fills the form from the fetched data, on page load and again after each save.
const loadFormState = () => {
  if (!data.value) return;

  const sponsors = data.value.StudySponsors;

  state.collaborators = data.value.StudyCollaborators.map((c: any) => ({
    id: c.id,
    name: c.name,
    identifier: c.identifier,
  }));
  state.leadSponsorIdentifier = sponsors?.leadSponsorIdentifier || "";
  state.leadSponsorName = sponsors?.leadSponsorName || "";
  state.responsiblePartyInvestigatorAffiliationIdentifier =
    sponsors?.responsiblePartyInvestigatorAffiliationIdentifier || "";
  state.responsiblePartyInvestigatorAffiliationName =
    sponsors?.responsiblePartyInvestigatorAffiliationName || "";
  state.responsiblePartyInvestigatorFamilyName =
    sponsors?.responsiblePartyInvestigatorFamilyName || "";
  state.responsiblePartyInvestigatorGivenName =
    sponsors?.responsiblePartyInvestigatorGivenName || "";
  state.responsiblePartyInvestigatorIdentifierValue =
    sponsors?.responsiblePartyInvestigatorIdentifierValue || "";
  state.responsiblePartyInvestigatorTitle =
    sponsors?.responsiblePartyInvestigatorTitle || "";
  state.responsiblePartyType = sponsors?.responsiblePartyType || "";
  state.studyCentralContacts = data.value.StudyCentralContact.map(
    (contact: any) => ({
      id: contact.id,
      affiliation: contact.affiliation,
      affiliationIdentifier: contact.affiliationIdentifier,
      degree: contact.degree,
      deleted: false,
      emailAddress: contact.emailAddress,
      familyName: contact.familyName,
      givenName: contact.givenName,
      identifier: contact.identifier,
      local: false,
      phone: contact.phone,
      phoneExt: contact.phoneExt,
    }),
  );
  state.studyOverallOfficials = data.value.StudyOverallOfficials.map(
    (official: any) => ({
      id: official.id,
      affiliation: official.affiliation,
      affiliationIdentifier: official.affiliationIdentifier,
      degree: official.degree,
      deleted: false,
      familyName: official.familyName,
      givenName: official.givenName,
      identifier: official.identifier,
      local: false,
      role: official.role,
    }),
  );
};

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  loadFormState();
  originalStateString.value = JSON.stringify(state);
}

const isDirty = computed(() => {
  return JSON.stringify(state) !== originalStateString.value;
});

const { showLeaveModal, confirmLeave, cancelLeave } = useUnsavedChangesGuard({
  isDirty,
  isSubmitting,
});

const isInvestigatorParty = (type: string) =>
  ["Sponsor-Investigator", "Principal Investigator"].includes(type);

// New rows can simply be dropped, but saved rows are flagged so the server deletes them.
const removeRow = (rows: { deleted: boolean; local: boolean }[], i: number) => {
  const row = rows[i];
  if (!row) return;

  if (row.local) {
    rows.splice(i, 1);
  } else {
    row.deleted = true;
  }
};

// Each person here has one affiliation, so only the first current one from ORCID is used.
const applyOrcidProfile = (
  person: Pick<
    Schema["studyOverallOfficials"][number],
    "affiliation" | "affiliationIdentifier" | "familyName" | "givenName"
  >,
  profile: OrcidProfile,
) => {
  person.givenName = profile.givenName || person.givenName;
  person.familyName = profile.familyName || person.familyName;

  const [current] = profile.affiliations;

  if (current) {
    person.affiliation = current.affiliation;
    person.affiliationIdentifier = normalizeROR(current.identifier);
  }
};

const applyOrcidProfileToResponsibleParty = (profile: OrcidProfile) => {
  const person = {
    affiliation: state.responsiblePartyInvestigatorAffiliationName,
    affiliationIdentifier:
      state.responsiblePartyInvestigatorAffiliationIdentifier,
    familyName: state.responsiblePartyInvestigatorFamilyName,
    givenName: state.responsiblePartyInvestigatorGivenName,
  };

  applyOrcidProfile(person, profile);

  state.responsiblePartyInvestigatorAffiliationName = person.affiliation;
  state.responsiblePartyInvestigatorAffiliationIdentifier =
    person.affiliationIdentifier;
  state.responsiblePartyInvestigatorFamilyName = person.familyName;
  state.responsiblePartyInvestigatorGivenName = person.givenName;
};

const addContact = () => {
  state.studyCentralContacts.push({
    id: nanoid(),
    affiliation: "",
    affiliationIdentifier: "",
    degree: "",
    deleted: false,
    emailAddress: "",
    familyName: "",
    givenName: "",
    identifier: "",
    local: true,
    phone: "",
    phoneExt: "",
  });
};

const addOfficial = () => {
  state.studyOverallOfficials.push({
    id: nanoid(),
    affiliation: "",
    affiliationIdentifier: "",
    degree: "",
    deleted: false,
    familyName: "",
    givenName: "",
    identifier: "",
    local: true,
    role: "",
  });
};

const addCollaborator = () => {
  state.collaborators.push({
    id: nanoid(),
    name: "",
    identifier: "",
  });
};

const validateRor = (errors: FormError[], name: string, value: string) => {
  const ror = normalizeROR(value);

  if (ror && !isValidRORValue(ror)) {
    errors.push({ name, message: "Enter a valid ROR ID or ROR URL" });
  }
};

const validateOrcid = (errors: FormError[], name: string, value: string) => {
  const orcid = normalizeORCID(value);

  if (orcid && !isValidORCIDValue(orcid)) {
    errors.push({ name, message: "Enter a valid ORCID iD or ORCID URL" });
  }
};

const validateSponsors = (state: any, errors: FormError[]) => {
  if (!state.responsiblePartyType?.trim()) {
    errors.push({
      name: "responsiblePartyType",
      message: "Responsible party type is required",
    });
  }

  if (!state.leadSponsorName?.trim()) {
    errors.push({
      name: "leadSponsorName",
      message: "Lead sponsor name is required",
    });
  }

  validateRor(errors, "leadSponsorIdentifier", state.leadSponsorIdentifier);

  if (isInvestigatorParty(state.responsiblePartyType)) {
    if (!state.responsiblePartyInvestigatorGivenName?.trim()) {
      errors.push({
        name: "responsiblePartyGivenName",
        message: "Given name is required",
      });
    }
    if (!state.responsiblePartyInvestigatorFamilyName?.trim()) {
      errors.push({
        name: "responsiblePartyFamilyName",
        message: "Family name is required",
      });
    }
    if (!state.responsiblePartyInvestigatorTitle?.trim()) {
      errors.push({
        name: "responsiblePartyTitle",
        message: "Title is required",
      });
    }
    if (!state.responsiblePartyInvestigatorAffiliationName?.trim()) {
      errors.push({
        name: "responsiblePartyAffiliation",
        message: "Affiliation Name is required",
      });
    }
    if (!state.responsiblePartyInvestigatorAffiliationIdentifier?.trim()) {
      errors.push({
        name: "responsiblePartyAffiliationId",
        message: "Affiliation Identifier is required",
      });
    }
  }

  validateRor(
    errors,
    "responsiblePartyAffiliationId",
    state.responsiblePartyInvestigatorAffiliationIdentifier,
  );
  validateOrcid(
    errors,
    "responsiblePartyOrcid",
    state.responsiblePartyInvestigatorIdentifierValue,
  );
};

const validateContacts = (state: any, errors: FormError[]) => {
  const activeContacts = state.studyCentralContacts.filter(
    (contact: any) => !contact.deleted,
  );

  if (activeContacts.length === 0) {
    errors.push({
      name: "studyCentralContacts",
      message: "At least one central contact is required",
    });
  }

  const seen = new Set<string>();

  // Field names use the index in state, which is what the template renders from.
  state.studyCentralContacts.forEach((contact: any, index: number) => {
    if (contact.deleted) return;

    const key = `${contact.givenName?.trim().toLowerCase()}|${contact.familyName?.trim().toLowerCase()}|${contact.emailAddress?.trim().toLowerCase()}`;
    if (seen.has(key)) {
      errors.push({
        name: `contact-givenName-${index}`,
        message:
          "Duplicate central contact with same given name, family name, and email address",
      });
    }
    seen.add(key);

    if (contact.givenName.trim() === "") {
      errors.push({
        name: `contact-givenName-${index}`,
        message: "Given name is required",
      });
    }

    if (contact.familyName.trim() === "") {
      errors.push({
        name: `contact-familyName-${index}`,
        message: "Family name is required",
      });
    }

    if (contact.affiliation.trim() === "") {
      errors.push({
        name: `contact-affiliation-${index}`,
        message: "Affiliation is required",
      });
    }

    if (contact.emailAddress.trim() === "") {
      errors.push({
        name: `contact-emailAddress-${index}`,
        message: "Email address is required",
      });
    } else if (!isValidEmail(contact.emailAddress)) {
      errors.push({
        name: `contact-emailAddress-${index}`,
        message: "Email address is not valid",
      });
    }

    validateRor(
      errors,
      `contact-affiliationIdentifier-${index}`,
      contact.affiliationIdentifier,
    );
    validateOrcid(errors, `contact-identifier-${index}`, contact.identifier);
  });
};

const validateOfficials = (state: any, errors: FormError[]) => {
  const enumValues = FORM_JSON.studyMetadataContactsOverallOfficialRole.map(
    (option) => option.value,
  );

  const seen = new Set<string>();

  // Field names use the index in state, which is what the template renders from.
  state.studyOverallOfficials.forEach((official: any, index: number) => {
    if (official.deleted) return;

    const key = `${official.givenName?.trim().toLowerCase()}|${official.familyName?.trim().toLowerCase()}|${official.role?.trim().toLowerCase()}`;
    if (seen.has(key)) {
      errors.push({
        name: `official-givenName-${index}`,
        message:
          "Duplicate official with same given name, family name, and role",
      });
    }
    seen.add(key);

    if (official.givenName.trim() === "") {
      errors.push({
        name: `official-givenName-${index}`,
        message: "Given name is required",
      });
    }

    if (official.familyName.trim() === "") {
      errors.push({
        name: `official-familyName-${index}`,
        message: "Family name is required",
      });
    }

    if (official.affiliation.trim() === "") {
      errors.push({
        name: `official-affiliation-${index}`,
        message: "Affiliation is required",
      });
    }

    validateRor(
      errors,
      `official-affiliationIdentifier-${index}`,
      official.affiliationIdentifier,
    );
    validateOrcid(errors, `official-identifier-${index}`, official.identifier);

    if (official.role.trim() === "") {
      errors.push({
        name: `official-role-${index}`,
        message: "Role is required",
      });
    } else if (!enumValues.includes(official.role.trim())) {
      errors.push({
        name: `official-role-${index}`,
        message: `Role must be one of the following: ${enumValues.join(", ")}`,
      });
    }
  });
};

const validateCollaborators = (state: any, errors: FormError[]) => {
  const seen = new Set<string>();

  state.collaborators.forEach((c: any, index: number) => {
    const key = `${c.name?.trim().toLowerCase()}|${normalizeROR(c.identifier)}`;
    if (seen.has(key)) {
      errors.push({
        name: `collaborator-name-${index}`,
        message: "Duplicate collaborator with same name and identifier",
      });
    }
    seen.add(key);

    if (!c.name?.trim()) {
      errors.push({
        name: `collaborator-name-${index}`,
        message: "Collaborator name is required",
      });
    }

    validateRor(errors, `collaborator-identifier-${index}`, c.identifier);
  });
};

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  validateSponsors(state, errors);
  validateContacts(state, errors);
  validateOfficials(state, errors);
  validateCollaborators(state, errors);

  return errors;
};

// The form only collects the ORCID and ROR IDs; the API also expects their schemes and scheme URIs.
const toRorFields = (value: string) => {
  const ror = normalizeROR(value);

  return {
    identifier: ror,
    scheme: ror ? "ROR" : "",
    schemeUri: ror ? "https://ror.org" : "",
  };
};

// Prepares a contact or official for the API: new rows have no id, and only removed rows carry `deleted`.
const toPersonRow = (person: any) => {
  const ror = toRorFields(person.affiliationIdentifier);
  const orcid = normalizeORCID(person.identifier);

  const row = {
    ...person,
    affiliationIdentifier: ror.identifier,
    affiliationIdentifierScheme: ror.scheme,
    affiliationIdentifierSchemeUri: ror.schemeUri,
    identifier: orcid,
    identifierScheme: orcid ? "ORCID" : "",
    identifierSchemeUri: orcid ? "https://orcid.org" : "",
  };

  if (row.local) delete row.id;
  if (!row.deleted) delete row.deleted;

  return row;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const { studyCentralContacts, ...formData } = event.data;

  const leadSponsor = toRorFields(formData.leadSponsorIdentifier);
  const affiliation = toRorFields(
    formData.responsiblePartyInvestigatorAffiliationIdentifier,
  );
  const orcid = normalizeORCID(
    formData.responsiblePartyInvestigatorIdentifierValue,
  );

  const body = {
    ...formData,
    collaborators: formData.collaborators.map((collaborator) => ({
      ...collaborator,
      ...toRorFields(collaborator.identifier),
    })),
    leadSponsorIdentifier: leadSponsor.identifier,
    leadSponsorIdentifierScheme: leadSponsor.scheme,
    leadSponsorIdentifierSchemeUri: leadSponsor.schemeUri,
    responsiblePartyInvestigatorAffiliationIdentifier: affiliation.identifier,
    responsiblePartyInvestigatorAffiliationIdentifierScheme: affiliation.scheme,
    responsiblePartyInvestigatorAffiliationIdentifierSchemeUri:
      affiliation.schemeUri,
    responsiblePartyInvestigatorIdentifierScheme: orcid ? "ORCID" : "",
    responsiblePartyInvestigatorIdentifierValue: orcid,
    studyContacts: studyCentralContacts.map(toPersonRow),
    studyOverallOfficials: formData.studyOverallOfficials.map(toPersonRow),
  };

  try {
    await $fetch(`/api/datasets/${datasetId}/study/metadata/team-contacts`, {
      body,
      method: "PUT",
    });

    // Reload so new rows get their real ids and removed rows drop out of the form.
    await refresh();
    if (!error.value) loadFormState();
    originalStateString.value = JSON.stringify(state);

    toast.add({
      title: "Success",
      color: "success",
      description: "The form has been submitted.",
    });
  } catch (err) {
    console.error(err);
    toast.add({
      title: "Error",
      color: "error",
      description: "An error occurred while submitting the form.",
    });
  } finally {
    saveLoading.value = false;
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="relative flex h-[calc(100vh-6rem)] flex-col overflow-hidden">
    <div class="flex-1 space-y-6 overflow-y-auto p-4 pb-28">
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: data?.title, to: `/app/datasets/${datasetId}` },
          {
            label: 'Study Metadata',
          },
          {
            label: 'Team & Contacts',
            to: `/app/datasets/${datasetId}/study/metadata/team-contacts`,
          },
        ]"
      />

      <UForm
        id="study-metadata-team-contacts-form"
        :state="state"
        :validate="validate"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Team &amp; Contacts
            </h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Identify the people and organizations responsible for this study,
            and who to contact about it.
          </p>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Responsible Party
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Provide information about the individual or entity responsible
                for the study.
              </p>
            </div>

            <UFormField
              name="responsiblePartyType"
              label="Responsible Party Type"
              required
              class="w-full"
            >
              <USelect
                v-model="state.responsiblePartyType"
                class="w-full"
                placeholder="Principal Investigator"
                :items="
                  FORM_JSON.studyMetadataSponsorsResponsiblePartyTypeOptions
                "
              />
            </UFormField>

            <UFormField
              label="ORCID"
              name="responsiblePartyOrcid"
              help="Enter the ORCID iD or paste the full ORCID URL."
              class="w-full"
            >
              <div class="flex items-start gap-2">
                <UInput
                  v-model="state.responsiblePartyInvestigatorIdentifierValue"
                  placeholder="0000-0000-0000-0000 or https://orcid.org/0000-0000-0000-0000"
                  class="w-full"
                  @blur="
                    state.responsiblePartyInvestigatorIdentifierValue =
                      normalizeORCID(
                        state.responsiblePartyInvestigatorIdentifierValue,
                      )
                  "
                />

                <MetadataOrcidLookupButton
                  :orcid="state.responsiblePartyInvestigatorIdentifierValue"
                  @found="applyOrcidProfileToResponsibleParty"
                />
              </div>
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField
                label="Given Name"
                name="responsiblePartyGivenName"
                class="w-full"
                :required="isInvestigatorParty(state.responsiblePartyType)"
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorGivenName"
                  placeholder="Carolyn"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Family Name"
                name="responsiblePartyFamilyName"
                class="w-full"
                :required="isInvestigatorParty(state.responsiblePartyType)"
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorFamilyName"
                  placeholder="Bertozzi"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField
              label="Title"
              name="responsiblePartyTitle"
              class="w-full"
              :required="isInvestigatorParty(state.responsiblePartyType)"
            >
              <UInput
                v-model="state.responsiblePartyInvestigatorTitle"
                placeholder="Professor of Chemistry"
                class="w-full"
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField
                label="Affiliation"
                name="responsiblePartyAffiliation"
                class="w-full"
                :required="isInvestigatorParty(state.responsiblePartyType)"
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorAffiliationName"
                  placeholder="Stanford University"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="ROR"
                name="responsiblePartyAffiliationId"
                hint="ID or URL"
                class="w-full"
                :required="isInvestigatorParty(state.responsiblePartyType)"
              >
                <UInput
                  v-model="
                    state.responsiblePartyInvestigatorAffiliationIdentifier
                  "
                  placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                  class="w-full"
                  @blur="
                    state.responsiblePartyInvestigatorAffiliationIdentifier =
                      normalizeROR(
                        state.responsiblePartyInvestigatorAffiliationIdentifier,
                      )
                  "
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Lead Sponsor
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Provide information about the primary organization overseeing
                the study.
              </p>
            </div>

            <UFormField
              label="Name"
              name="leadSponsorName"
              class="w-full"
              required
            >
              <UInput
                v-model="state.leadSponsorName"
                placeholder="National Institutes of Health"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="ROR"
              name="leadSponsorIdentifier"
              help="Enter the ROR ID or paste the full ROR URL."
              class="w-full"
            >
              <UInput
                v-model="state.leadSponsorIdentifier"
                placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                class="w-full"
                @blur="
                  state.leadSponsorIdentifier = normalizeROR(
                    state.leadSponsorIdentifier,
                  )
                "
              />
            </UFormField>

            <MetadataOrganizationPrefill
              :current="{
                identifier: state.leadSponsorIdentifier,
                name: state.leadSponsorName,
              }"
              :source="data?.DatasetManagingOrganization"
              source-label="dataset managing organization"
              @prefill="
                state.leadSponsorIdentifier = $event.identifier;
                state.leadSponsorName = $event.name;
              "
            />
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Central Contacts
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Add the people to contact with questions about this study.
              </p>
            </div>

            <UFormField name="studyCentralContacts">
              <CardCollapsible
                v-for="(item, index) in state.studyCentralContacts"
                v-show="!item.deleted"
                :key="item.id"
                class="my-2 shadow-none"
                :title="
                  item.givenName
                    ? `${item.givenName} ${item.familyName}`
                    : `Central Contact ${index + 1}`
                "
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove Contact"
                    variant="soft"
                    color="error"
                    @click="removeRow(state.studyCentralContacts, index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-4 p-1">
                  <UFormField
                    label="ORCID"
                    :name="`contact-identifier-${index}`"
                    help="Enter the ORCID iD or paste the full ORCID URL."
                  >
                    <div class="flex items-start gap-2">
                      <UInput
                        v-model="item.identifier"
                        placeholder="0000-0000-0000-0000 or https://orcid.org/0000-0000-0000-0000"
                        class="w-full"
                        @blur="
                          item.identifier = normalizeORCID(item.identifier)
                        "
                      />

                      <MetadataOrcidLookupButton
                        :orcid="item.identifier"
                        @found="applyOrcidProfile(item, $event)"
                      />
                    </div>
                  </UFormField>

                  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <UFormField
                      label="Given Name"
                      :name="`contact-givenName-${index}`"
                      required
                    >
                      <UInput v-model="item.givenName" placeholder="Drew" />
                    </UFormField>

                    <UFormField
                      label="Family Name"
                      :name="`contact-familyName-${index}`"
                      required
                    >
                      <UInput
                        v-model="item.familyName"
                        placeholder="Weissman"
                      />
                    </UFormField>

                    <UFormField
                      label="Degree"
                      :name="`contact-degree-${index}`"
                    >
                      <UInput v-model="item.degree" placeholder="PhD, MD" />
                    </UFormField>
                  </div>

                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UFormField
                      label="Affiliation"
                      :name="`contact-affiliation-${index}`"
                      class="w-full"
                      required
                    >
                      <UInput
                        v-model="item.affiliation"
                        placeholder="University of Pennsylvania"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="ROR"
                      :name="`contact-affiliationIdentifier-${index}`"
                      class="w-full"
                      hint="ID or URL"
                    >
                      <UInput
                        v-model="item.affiliationIdentifier"
                        placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                        class="w-full"
                        @blur="
                          item.affiliationIdentifier = normalizeROR(
                            item.affiliationIdentifier,
                          )
                        "
                      />
                    </UFormField>
                  </div>

                  <UFormField
                    label="Email Address"
                    :name="`contact-emailAddress-${index}`"
                    required
                  >
                    <UInput
                      v-model="item.emailAddress"
                      type="email"
                      placeholder="james.smith@example.com"
                      class="w-full"
                    />
                  </UFormField>

                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UFormField
                      label="Phone Number"
                      :name="`contact-phone-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.phone"
                        placeholder="+1 (555) 000-0000"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Extension"
                      :name="`contact-phoneExt-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.phoneExt"
                        placeholder="123"
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Central Contact"
              class="mt-2"
              @click="addContact"
            />
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Overall Officials
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Optionally, add the principal investigators and other people who
                oversee the study.
              </p>
            </div>

            <UFormField name="studyOverallOfficials">
              <CardCollapsible
                v-for="(item, index) in state.studyOverallOfficials"
                v-show="!item.deleted"
                :key="item.id"
                class="my-2 shadow-none"
                :title="
                  item.givenName
                    ? `${item.givenName} ${item.familyName}`
                    : `Overall Official ${index + 1}`
                "
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove Official"
                    variant="soft"
                    color="error"
                    @click="removeRow(state.studyOverallOfficials, index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-4 p-1">
                  <UFormField
                    label="ORCID"
                    :name="`official-identifier-${index}`"
                    help="Enter the ORCID iD or paste the full ORCID URL."
                  >
                    <div class="flex items-start gap-2">
                      <UInput
                        v-model="item.identifier"
                        placeholder="0000-0000-0000-0000 or https://orcid.org/0000-0000-0000-0000"
                        class="w-full"
                        @blur="
                          item.identifier = normalizeORCID(item.identifier)
                        "
                      />

                      <MetadataOrcidLookupButton
                        :orcid="item.identifier"
                        @found="applyOrcidProfile(item, $event)"
                      />
                    </div>
                  </UFormField>

                  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <UFormField
                      label="Given Name"
                      :name="`official-givenName-${index}`"
                      required
                    >
                      <UInput v-model="item.givenName" placeholder="Emery" />
                    </UFormField>

                    <UFormField
                      label="Family Name"
                      :name="`official-familyName-${index}`"
                      required
                    >
                      <UInput v-model="item.familyName" placeholder="Brown" />
                    </UFormField>

                    <UFormField
                      label="Degree"
                      :name="`official-degree-${index}`"
                    >
                      <UInput v-model="item.degree" placeholder="MD, PhD" />
                    </UFormField>
                  </div>

                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UFormField
                      label="Affiliation"
                      :name="`official-affiliation-${index}`"
                      class="w-full"
                      required
                    >
                      <UInput
                        v-model="item.affiliation"
                        placeholder="Massachusetts Institute of Technology"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="ROR"
                      :name="`official-affiliationIdentifier-${index}`"
                      class="w-full"
                      hint="ID or URL"
                    >
                      <UInput
                        v-model="item.affiliationIdentifier"
                        placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                        class="w-full"
                        @blur="
                          item.affiliationIdentifier = normalizeROR(
                            item.affiliationIdentifier,
                          )
                        "
                      />
                    </UFormField>
                  </div>

                  <UFormField
                    label="Official Protocol Role"
                    :name="`official-role-${index}`"
                    required
                  >
                    <USelect
                      v-model="item.role"
                      class="w-full"
                      placeholder="Study Principal Investigator"
                      :items="
                        FORM_JSON.studyMetadataContactsOverallOfficialRole
                      "
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Overall Official"
              class="mt-2"
              @click="addOfficial"
            />
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Collaborators
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Optionally, add the organizations collaborating on the study.
              </p>
            </div>

            <UFormField name="collaborators">
              <CardCollapsible
                v-for="(item, index) in state.collaborators"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.name || `Collaborator ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove collaborator"
                    variant="soft"
                    color="error"
                    @click="state.collaborators.splice(index, 1)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField
                    :name="`collaborator-name-${index}`"
                    label="Name"
                    required
                  >
                    <UInput
                      v-model="item.name"
                      placeholder="Stanford University"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="ROR"
                    :name="`collaborator-identifier-${index}`"
                    help="Enter the ROR ID or paste the full ROR URL."
                  >
                    <UInput
                      v-model="item.identifier"
                      placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                      class="w-full"
                      @blur="item.identifier = normalizeROR(item.identifier)"
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Collaborator"
              @click="addCollaborator"
            />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute right-0 bottom-0 left-0 z-10 px-6 pt-4 pb-6">
      <UButton
        form="study-metadata-team-contacts-form"
        type="submit"
        :disabled="saveLoading"
        :loading="saveLoading"
        class="w-full"
        size="xl"
        label="Save Metadata"
        icon="i-lucide-save"
      />
    </div>

    <UModal
      v-model:open="showLeaveModal"
      title="Unsaved changes"
      :prevent-close="true"
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to leave this page? Any modifications made to
            your fields will be permanently discarded.
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <UButton
              color="error"
              label="Discard Changes"
              @click="confirmLeave"
            />
            <UButton
              color="neutral"
              label="Stay on Page"
              @click="cancelLeave"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
