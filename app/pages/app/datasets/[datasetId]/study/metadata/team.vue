<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import { z } from "zod";
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
      name: z.string().optional(),
      deleted: z.boolean(),
      identifier: z.string().optional(),
    }),
  ),
  leadSponsorIdentifier: z.string(),
  leadSponsorName: z.string().min(1, "Lead sponsor name is required"),
  responsiblePartyInvestigatorAffiliationIdentifier: z.string(),
  responsiblePartyInvestigatorAffiliationName: z.string(),
  responsiblePartyInvestigatorFamilyName: z.string(),
  responsiblePartyInvestigatorGivenName: z.string(),
  responsiblePartyInvestigatorIdentifierValue: z.string(),
  responsiblePartyInvestigatorTitle: z.string(),
  responsiblePartyType: z.string().min(1, "Responsible party type is required"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  collaborators: [
    {
      id: crypto.randomUUID(),
      name: "",
      deleted: false,
      identifier: "",
    },
  ],
  leadSponsorIdentifier: "",
  leadSponsorName: "",
  responsiblePartyInvestigatorAffiliationIdentifier: "",
  responsiblePartyInvestigatorAffiliationName: "",
  responsiblePartyInvestigatorFamilyName: "",
  responsiblePartyInvestigatorGivenName: "",
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
  });
}

function removeCollaboratorById(id: string) {
  const collaborator = state.collaborators.find((c) => c.id === id);
  if (collaborator) {
    collaborator.deleted = true;
  }
}

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/team`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching dataset",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

if (data.value) {
  useSeoMeta({
    title: data.value?.title || "Untitled Study",
  });

  for (const key in state) {
    if (key === "collaborators") continue;
    if (key in data.value) {
      state[key as keyof typeof state] = (data.value as any)[key] ?? "";
    }
  }

  if (Array.isArray(data.value.StudyCollaborators)) {
    state.collaborators = data.value.StudyCollaborators.map((c: any) => ({
      id: c.id || crypto.randomUUID(),
      name: c.name || "",
      deleted: false,
      identifier: c.identifier || "",
    }));
  } else {
    state.collaborators = [];
  }

  state.leadSponsorIdentifier =
    data.value.StudySponsors?.leadSponsorIdentifier || "";
  state.leadSponsorName = data.value.StudySponsors?.leadSponsorName || "";
  state.responsiblePartyType =
    data.value.StudySponsors?.responsiblePartyType || "";
  state.responsiblePartyInvestigatorGivenName =
    data.value.StudySponsors?.responsiblePartyInvestigatorGivenName || "";
  state.responsiblePartyInvestigatorFamilyName =
    data.value.StudySponsors?.responsiblePartyInvestigatorFamilyName || "";
  state.responsiblePartyInvestigatorTitle =
    data.value.StudySponsors?.responsiblePartyInvestigatorTitle || "";
  state.responsiblePartyInvestigatorAffiliationName =
    data.value.StudySponsors?.responsiblePartyInvestigatorAffiliationName || "";
  state.responsiblePartyInvestigatorAffiliationIdentifier =
    data.value.StudySponsors
      ?.responsiblePartyInvestigatorAffiliationIdentifier || "";
  state.responsiblePartyInvestigatorIdentifierValue =
    data.value.StudySponsors?.responsiblePartyInvestigatorIdentifierValue || "";

  originalStateString.value = JSON.stringify(state);
}

const isDirty = computed(() => {
  return JSON.stringify(state) !== originalStateString.value;
});

const { showLeaveModal, confirmLeave, cancelLeave } = useUnsavedChangesGuard({
  isDirty,
  isSubmitting,
});

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  const validateRor = (name: string, value: string) => {
    const ror = normalizeROR(value);

    if (ror && !isValidRORValue(ror)) {
      errors.push({ name, message: "Enter a valid ROR ID or ROR URL" });
    }
  };

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

  validateRor("leadSponsorIdentifier", state.leadSponsorIdentifier);

  if (
    ["Sponsor-Investigator", "Principal Investigator"].includes(
      state.responsiblePartyType,
    )
  ) {
    if (!state.responsiblePartyInvestigatorFamilyName) {
      errors.push({ name: "familyName", message: "Family name is required" });
    }
    if (!state.responsiblePartyInvestigatorAffiliationIdentifier) {
      errors.push({
        name: "affiliationId",
        message: "Affiliation Identifier is required",
      });
    }
    if (!state.responsiblePartyInvestigatorAffiliationName) {
      errors.push({
        name: "affiliation",
        message: "Affiliation Name is required",
      });
    }
  }

  validateRor(
    "affiliationId",
    state.responsiblePartyInvestigatorAffiliationIdentifier,
  );

  const orcid = normalizeORCID(
    state.responsiblePartyInvestigatorIdentifierValue,
  );
  if (orcid && !isValidORCIDValue(orcid)) {
    errors.push({
      name: "idValue",
      message: "Enter a valid ORCID iD or ORCID URL",
    });
  }

  const activeCollaborators = state.collaborators.filter(
    (c: any) => !c.deleted,
  );

  if (activeCollaborators.length > 0) {
    const seen = new Set<string>();
    activeCollaborators.forEach((c: any, index: number) => {
      const key = `${c.name?.trim().toLowerCase()}|${normalizeROR(c.identifier)}`;
      if (seen.has(key)) {
        errors.push({
          name: `name-${index}`,
          message: "Duplicate collaborator with same name and identifier",
        });
      }
      seen.add(key);

      if (!c.name?.trim()) {
        errors.push({
          name: `name-${index}`,
          message: `Collaborator name is required`,
        });
      }

      validateRor(`identifier-${index}`, c.identifier);
    });
  }

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

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const leadSponsor = toRorFields(state.leadSponsorIdentifier);
  const affiliation = toRorFields(
    state.responsiblePartyInvestigatorAffiliationIdentifier,
  );
  const orcid = normalizeORCID(
    state.responsiblePartyInvestigatorIdentifierValue,
  );

  const body = {
    ...state,
    collaborators: state.collaborators.map((collaborator) => ({
      ...collaborator,
      ...toRorFields(collaborator.identifier ?? ""),
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
  };

  try {
    await $fetch(`/api/datasets/${datasetId}/study/metadata/team`, {
      body,
      method: "PUT",
    });

    toast.add({
      title: "Success",
      color: "success",
      description: "Sponsor data saved successfully.",
    });

    originalStateString.value = JSON.stringify(state);
  } catch (err) {
    console.error(err);
    toast.add({
      title: "Error",
      color: "error",
      description: "Failed to save sponsor data.",
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
            label: 'Team',
            to: `/app/datasets/${datasetId}/study/metadata/team`,
          },
        ]"
      />

      <UForm
        id="study-metadata-team-form"
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
              Team
            </h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Identify the people and organizations responsible for this study.
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

            <div class="flex w-full gap-4">
              <UFormField
                label="Given Name"
                name="givenName"
                class="w-full"
                :required="
                  ['Sponsor-Investigator', 'Principal Investigator'].includes(
                    state.responsiblePartyType,
                  )
                "
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorGivenName"
                  placeholder="Carolyn"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Family Name"
                name="familyName"
                class="w-full"
                :required="
                  ['Sponsor-Investigator', 'Principal Investigator'].includes(
                    state.responsiblePartyType,
                  )
                "
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
              name="title"
              class="w-full"
              :required="
                ['Sponsor-Investigator', 'Principal Investigator'].includes(
                  state.responsiblePartyType,
                )
              "
            >
              <UInput
                v-model="state.responsiblePartyInvestigatorTitle"
                placeholder="Professor of Chemistry"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="ORCID"
              name="idValue"
              help="Enter the ORCID iD or paste the full ORCID URL."
              class="w-full"
            >
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
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField
                label="Affiliation"
                name="affiliation"
                class="w-full"
                :required="
                  ['Sponsor-Investigator', 'Principal Investigator'].includes(
                    state.responsiblePartyType,
                  )
                "
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorAffiliationName"
                  placeholder="Stanford University"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="ROR"
                name="affiliationId"
                hint="ID or URL"
                class="w-full"
                :required="
                  ['Sponsor-Investigator', 'Principal Investigator'].includes(
                    state.responsiblePartyType,
                  )
                "
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

            <UFormField name="leadSponsorName" class="w-full">
              <template #label>
                Name <span class="text-red-500">*</span>
              </template>
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
                Add the organizations collaborating on the study.
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
                      placeholder="Stanford University"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="ROR"
                    :name="`identifier-${index}`"
                    help="Enter the ROR ID or paste the full ROR URL."
                  >
                    <UInput
                      v-model="item.identifier"
                      placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                      class="w-full"
                      @blur="
                        item.identifier = normalizeROR(item.identifier ?? '')
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
              label="Add Collaborator"
              @click="addCollaborator"
            />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute right-0 bottom-0 left-0 z-10 px-6 pt-4 pb-6">
      <UButton
        form="study-metadata-team-form"
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
