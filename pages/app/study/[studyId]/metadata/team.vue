<script setup lang="ts">
import type { FormError } from "@nuxt/ui";
import { z } from "zod";
import FORM_JSON from "~/assets/data/form.json";

const route = useRoute();
const toast = useToast();
const { studyId } = route.params as { studyId: string };
const studyTitle = ref("");

const loading = ref(false);

const schema = z.object({
  collaborators: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      deleted: z.boolean(),
      identifier: z.string().optional(),
      scheme: z.string().optional(),
      schemeUri: z.string().optional(),
    }),
  ),
  leadSponsorIdentifier: z.string(),
  leadSponsorIdentifierScheme: z.string(),
  leadSponsorIdentifierSchemeUri: z.string(),
  leadSponsorName: z.string(),
  responsiblePartyInvestigatorAffiliationIdentifier: z.string(),
  responsiblePartyInvestigatorAffiliationIdentifierScheme: z.string(),
  responsiblePartyInvestigatorAffiliationIdentifierSchemeUri: z.string(),
  responsiblePartyInvestigatorAffiliationName: z.string(),
  responsiblePartyInvestigatorFamilyName: z.string(),
  responsiblePartyInvestigatorGivenName: z.string(),
  responsiblePartyInvestigatorIdentifierScheme: z.string(),
  responsiblePartyInvestigatorIdentifierValue: z.string(),
  responsiblePartyInvestigatorTitle: z.string(),
  responsiblePartyType: z.string(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  collaborators: [
    {
      id: crypto.randomUUID(),
      name: "",
      deleted: false,
      identifier: "",
      scheme: "",
      schemeUri: "",
    },
  ],
  leadSponsorIdentifier: "",
  leadSponsorIdentifierScheme: "",
  leadSponsorIdentifierSchemeUri: "",
  leadSponsorName: "",
  responsiblePartyInvestigatorAffiliationIdentifier: "",
  responsiblePartyInvestigatorAffiliationIdentifierScheme: "",
  responsiblePartyInvestigatorAffiliationIdentifierSchemeUri: "",
  responsiblePartyInvestigatorAffiliationName: "",
  responsiblePartyInvestigatorFamilyName: "",
  responsiblePartyInvestigatorGivenName: "",
  responsiblePartyInvestigatorIdentifierScheme: "",
  responsiblePartyInvestigatorIdentifierValue: "",
  responsiblePartyInvestigatorTitle: "",
  responsiblePartyType: "",
});

const visibleCollaborators = computed(() =>
  state.collaborators.filter((c) => !c.deleted),
);

function addCollaborator() {
  state.collaborators.push({
    id: crypto.randomUUID(),
    name: "",
    deleted: false,
    identifier: "",
    scheme: "",
    schemeUri: "",
  });
}

function removeCollaboratorById(id: string) {
  const collaborator = state.collaborators.find((c) => c.id === id);

  if (collaborator) {
    collaborator.deleted = true;
  }
}

const { data, error } = await useFetch(
  `/api/studies/${studyId}/metadata/team`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

if (data.value) {
  studyTitle.value = data.value?.title || "Untitled Study";
  // assign all keys except collaborators
  for (const key in state) {
    if (key === "collaborators") continue;
    if (key in data.value) {
      state[key as keyof typeof state] = (data.value as any)[key] ?? "";
    }
  }

  // assign collaborators carefully
  if (Array.isArray(data.value.StudyCollaborators)) {
    state.collaborators = data.value.StudyCollaborators.map((c: any) => ({
      id: c.id || crypto.randomUUID(),
      name: c.name || "",
      deleted: false, // default to not deleted
      identifier: c.identifier || "",
      scheme: c.scheme || "",
      schemeUri: c.schemeUri || "",
    }));
  } else {
    state.collaborators = [];
  }

  state.leadSponsorIdentifier =
    data.value.StudySponsors?.[0]?.leadSponsorIdentifier || "";
  state.leadSponsorIdentifierScheme =
    data.value.StudySponsors?.[0]?.leadSponsorIdentifierScheme || "";
  state.leadSponsorIdentifierSchemeUri =
    data.value.StudySponsors?.[0]?.leadSponsorIdentifierSchemeUri || "";
  state.leadSponsorName = data.value.StudySponsors?.[0]?.leadSponsorName || "";
  state.responsiblePartyType =
    data.value.StudySponsors?.[0]?.responsiblePartyType || "";
  state.responsiblePartyInvestigatorGivenName =
    data.value.StudySponsors?.[0]?.responsiblePartyInvestigatorGivenName || "";
  state.responsiblePartyInvestigatorFamilyName =
    data.value.StudySponsors?.[0]?.responsiblePartyInvestigatorFamilyName || "";
  state.responsiblePartyInvestigatorTitle =
    data.value.StudySponsors?.[0]?.responsiblePartyInvestigatorTitle || "";
  state.responsiblePartyInvestigatorAffiliationName =
    data.value.StudySponsors?.[0]
      ?.responsiblePartyInvestigatorAffiliationName || "";
  state.responsiblePartyInvestigatorAffiliationIdentifier =
    data.value.StudySponsors?.[0]
      ?.responsiblePartyInvestigatorAffiliationIdentifier || "";
  state.responsiblePartyInvestigatorAffiliationIdentifierScheme =
    data.value.StudySponsors?.[0]
      ?.responsiblePartyInvestigatorAffiliationIdentifierScheme || "";
  state.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri =
    data.value.StudySponsors?.[0]
      ?.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri || "";
  state.responsiblePartyInvestigatorIdentifierScheme =
    data.value.StudySponsors?.[0]
      ?.responsiblePartyInvestigatorIdentifierScheme || "";
  state.responsiblePartyInvestigatorIdentifierValue =
    data.value.StudySponsors?.[0]
      ?.responsiblePartyInvestigatorIdentifierValue || "";
  state.responsiblePartyType =
    data.value.StudySponsors?.[0]?.responsiblePartyType || "";
}

async function onSubmit() {
  if (!state.responsiblePartyType) {
    toast.add({ title: "Validation Error", description: "Type is required." });

    return;
  }

  if (!state.leadSponsorName.trim()) {
    toast.add({
      title: "Validation Error",
      description: "Lead Sponsor Name is required.",
    });

    return;
  }

  loading.value = true;

  try {
    const res = await fetch(`/api/studies/${studyId}/metadata/team`, {
      body: JSON.stringify(state),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });

    if (!res.ok) {
      throw new Error(
        `[PUT] "/api/studies/${studyId}/metadata/team": ${res.statusText}`,
      );
    }

    toast.add({
      title: "Success",
      description: "Sponsor data saved successfully.",
    });
  } catch (err) {
    console.error(err);
    toast.add({ title: "Error", description: "Failed to save sponsor data." });
  } finally {
    loading.value = false;
  }
}

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

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

  if (
    (state.leadSponsorIdentifier.trim() !== "" &&
      state.leadSponsorIdentifierScheme.trim() === "") ||
    (state.leadSponsorIdentifier.trim() === "" &&
      state.leadSponsorIdentifierScheme.trim() !== "")
  ) {
    const messages = [
      {
        name: "leadSponsorIdentifier",
        message: "Identifier is required when scheme is provided",
      },
      {
        name: "leadSponsorScheme",
        message: "Identifier scheme is required when identifier is provided",
      },
    ];

    errors.push(...messages);
  }

  if (
    (state.responsiblePartyInvestigatorAffiliationIdentifier.trim() !== "" &&
      state.responsiblePartyInvestigatorAffiliationIdentifierScheme.trim() ===
        "") ||
    (state.responsiblePartyInvestigatorAffiliationIdentifier.trim() === "" &&
      state.responsiblePartyInvestigatorAffiliationIdentifierScheme.trim() !==
        "")
  ) {
    const messages = [
      {
        name: "affiliationId",
        message: "Identifier is required when scheme is provided",
      },
      {
        name: "affiliationScheme",
        message: "Identifier scheme is required when identifier is provided",
      },
    ];

    errors.push(...messages);
  }

  state.collaborators.forEach((c: any, index: number) => {
    if (!c.deleted && !c.name?.trim()) {
      errors.push({
        name: `name-${index}`,
        message: `Collaborator name is required`,
      });
    }

    // If either official identifier or identifier scheme is provided, both must be provided
    if (
      (c.identifier.trim() !== "" && c.scheme.trim() === "") ||
      (c.identifier.trim() === "" && c.scheme.trim() !== "")
    ) {
      const messages = [
        {
          name: `identifier-${index}`,
          message: "Identifier and Identifier scheme must be provided together",
        },
        {
          name: `identifierScheme-${index}`,
          message: "Identifier and Identifier scheme must be provided together",
        },
      ];

      errors.push(...messages);
    }
  });

  return errors;
};
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: studyTitle, to: `/app/study/${studyId}` },
        {
          label: 'Metadata',
        },
        {
          label: 'Team',
          to: `/app/study/${studyId}/metadata/team`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
        </div>

        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
        </p>
      </div>

      <UForm
        :state="state"
        :validate="validate"
        class="flex flex-col gap-6"
        @submit.prevent="onSubmit"
      >
        <!-- Responsible Party Card -->
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

            <div class="flex w-full gap-4">
              <UFormField label="Given Name" name="givenName" class="w-full">
                <UInput
                  v-model="state.responsiblePartyInvestigatorGivenName"
                  placeholder="Annie"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Family Name" name="familyName" class="w-full">
                <UInput
                  v-model="state.responsiblePartyInvestigatorFamilyName"
                  placeholder="Leonhart"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Title" name="title" class="w-full">
              <UInput
                v-model="state.responsiblePartyInvestigatorTitle"
                placeholder="Warrior Candidate"
                class="w-full"
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField label="Affiliation" name="affiliation" class="w-full">
                <UInput
                  v-model="state.responsiblePartyInvestigatorAffiliationName"
                  placeholder="Marleyan Military"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Affiliation Identifier"
                name="affiliationId"
                class="w-full"
              >
                <UInput
                  v-model="
                    state.responsiblePartyInvestigatorAffiliationIdentifier
                  "
                  placeholder="0156zyn36"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="flex w-full gap-4">
              <UFormField
                label="Affiliation Identifier Scheme"
                name="affiliationScheme"
                class="w-full"
              >
                <UInput
                  v-model="
                    state.responsiblePartyInvestigatorAffiliationIdentifierScheme
                  "
                  placeholder="ROR"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Affiliation Identifier Scheme URI"
                name="affiliationSchemeUri"
                class="w-full"
              >
                <UInput
                  v-model="
                    state.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri
                  "
                  placeholder="https://ror.org"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="flex w-full gap-4">
              <UFormField
                label="Identifier Scheme"
                name="idScheme"
                class="w-full"
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorIdentifierScheme"
                  placeholder="ORCID"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Identifier Value"
                name="idValue"
                class="w-full"
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorIdentifierValue"
                  placeholder="0000-0003-2829-8032"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Lead Sponsor Card -->
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

            <UFormField name="leadSponsorName" class="w-full">
              <template #label>
                Name <span class="text-red-500">*</span>
              </template>

              <UInput
                v-model="state.leadSponsorName"
                placeholder="Willy Tybur"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Identifier"
              name="leadSponsorIdentifier"
              class="w-full"
            >
              <UInput
                v-model="state.leadSponsorIdentifier"
                placeholder="04aj4c18"
                class="w-full"
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField
                label="Identifier Scheme"
                name="leadSponsorScheme"
                class="w-full"
              >
                <UInput
                  v-model="state.leadSponsorIdentifierScheme"
                  placeholder="ROR"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Identifier Scheme URI"
                name="leadSponsorSchemeUri"
                class="w-full"
              >
                <UInput
                  v-model="state.leadSponsorIdentifierSchemeUri"
                  placeholder="https://ror.org"
                  class="w-full"
                />
              </UFormField>
            </div>
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
                Add collaborators involved in the study with their identifiers
                and schemes.
              </p>
            </div>

            <UFormField name="collaborators">
              <CardCollapsible
                v-for="(item, index) in visibleCollaborators"
                v-show="!item.deleted"
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
                    @click="() => removeCollaboratorById(item.id)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField :name="`name-${index}`" label="Name" required>
                    <UInput
                      v-model="item.name"
                      placeholder="Collaborator Name"
                    />
                  </UFormField>

                  <UFormField label="Identifier" :name="`identifier-${index}`">
                    <UInput
                      v-model="item.identifier"
                      placeholder="Identifier"
                    />
                  </UFormField>

                  <UFormField
                    label="Identifier Scheme"
                    :name="`identifierScheme-${index}`"
                  >
                    <UInput v-model="item.scheme" placeholder="Scheme" />
                  </UFormField>

                  <UFormField label="Scheme URI" :name="`schemeUri-${index}`">
                    <UInput
                      v-model="item.schemeUri"
                      placeholder="https://scheme.uri"
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

        <UButton
          type="submit"
          class="w-1/10 text-center"
          size="lg"
          label="Save Metadata"
          icon="i-lucide-save"
        />
      </UForm>
    </div>
  </div>
</template>
