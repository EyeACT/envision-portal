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
      scheme: z.string().optional(),
      schemeUri: z.string().optional(),
    }),
  ),
  leadSponsorIdentifier: z.string(),
  leadSponsorIdentifierScheme: z.string(),
  leadSponsorIdentifierSchemeUri: z.string(),
  leadSponsorName: z.string().min(1, "Lead sponsor name is required"),
  responsiblePartyInvestigatorAffiliationIdentifier: z.string(),
  responsiblePartyInvestigatorAffiliationIdentifierScheme: z.string(),
  responsiblePartyInvestigatorAffiliationIdentifierSchemeUri: z.string(),
  responsiblePartyInvestigatorAffiliationName: z.string(),
  responsiblePartyInvestigatorFamilyName: z.string(),
  responsiblePartyInvestigatorGivenName: z.string(),
  responsiblePartyInvestigatorIdentifierScheme: z.string(),
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
      scheme: c.scheme || "",
      schemeUri: c.schemeUri || "",
    }));
  } else {
    state.collaborators = [];
  }

  state.leadSponsorIdentifier = data.value.StudySponsors?.leadSponsorIdentifier || "";
  state.leadSponsorIdentifierScheme = data.value.StudySponsors?.leadSponsorIdentifierScheme || "";
  state.leadSponsorIdentifierSchemeUri = data.value.StudySponsors?.leadSponsorIdentifierSchemeUri || "";
  state.leadSponsorName = data.value.StudySponsors?.leadSponsorName || "";
  state.responsiblePartyType = data.value.StudySponsors?.responsiblePartyType || "";
  state.responsiblePartyInvestigatorGivenName = data.value.StudySponsors?.responsiblePartyInvestigatorGivenName || "";
  state.responsiblePartyInvestigatorFamilyName = data.value.StudySponsors?.responsiblePartyInvestigatorFamilyName || "";
  state.responsiblePartyInvestigatorTitle = data.value.StudySponsors?.responsiblePartyInvestigatorTitle || "";
  state.responsiblePartyInvestigatorAffiliationName = data.value.StudySponsors?.responsiblePartyInvestigatorAffiliationName || "";
  state.responsiblePartyInvestigatorAffiliationIdentifier = data.value.StudySponsors?.responsiblePartyInvestigatorAffiliationIdentifier || "";
  state.responsiblePartyInvestigatorAffiliationIdentifierScheme = data.value.StudySponsors?.responsiblePartyInvestigatorAffiliationIdentifierScheme || "";
  state.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri = data.value.StudySponsors?.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri || "";
  state.responsiblePartyInvestigatorIdentifierScheme = data.value.StudySponsors?.responsiblePartyInvestigatorIdentifierScheme || "";
  state.responsiblePartyInvestigatorIdentifierValue = data.value.StudySponsors?.responsiblePartyInvestigatorIdentifierValue || "";
  
  originalStateString.value = JSON.stringify(state);
}

const isDirty = computed(() => {
  return JSON.stringify(state) !== originalStateString.value;
});

const { 
  showLeaveModal, 
  confirmLeave, 
  cancelLeave 
} = useUnsavedChangesGuard({ isDirty, isSubmitting });

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
    (state.leadSponsorIdentifier.trim() !== "" && state.leadSponsorIdentifierScheme.trim() === "") ||
    (state.leadSponsorIdentifier.trim() === "" && state.leadSponsorIdentifierScheme.trim() !== "")
  ) {
    errors.push(
      { name: "leadSponsorIdentifier", message: "Identifier is required when scheme is provided" },
      { name: "leadSponsorScheme", message: "Identifier scheme is required when identifier is provided" }
    );
  }

  if (state.leadSponsorIdentifier && state.leadSponsorIdentifierScheme.toUpperCase() === "ORCID" && !isValidORCIDValue(state.leadSponsorIdentifier)) {
    errors.push({ name: "leadSponsorIdentifier", message: "Invalid ORCID value" });
  }
  if (state.leadSponsorIdentifier && state.leadSponsorIdentifierScheme.toUpperCase() === "ROR" && !isValidRORValue(state.leadSponsorIdentifier)) {
    errors.push({ name: "leadSponsorIdentifier", message: "Invalid ROR value" });
  }

  if (state.leadSponsorIdentifierSchemeUri && !isValidUrl(state.leadSponsorIdentifierSchemeUri)) {
    errors.push({ name: "leadSponsorSchemeUri", message: "Invalid URL" });
  }

  if (["Sponsor-Investigator", "Principal Investigator"].includes(state.responsiblePartyType)) {
    if (!state.responsiblePartyInvestigatorFamilyName) {
      errors.push({ name: "familyName", message: "Family name is required" });
    }
    if (!state.responsiblePartyInvestigatorAffiliationIdentifier) {
      errors.push({ name: "affiliationId", message: "Affiliation Identifier is required" });
    }
    if (!state.responsiblePartyInvestigatorAffiliationName) {
      errors.push({ name: "affiliation", message: "Affiliation Name is required" });
    }
  }

  if (
    (state.responsiblePartyInvestigatorAffiliationIdentifier !== "" && state.responsiblePartyInvestigatorAffiliationIdentifierScheme === "") ||
    (state.responsiblePartyInvestigatorAffiliationIdentifier === "" && state.responsiblePartyInvestigatorAffiliationIdentifierScheme !== "")
  ) {
    errors.push(
      { name: "affiliationId", message: "Identifier is required when scheme is provided" },
      { name: "affiliationScheme", message: "Identifier scheme is required when identifier is provided" }
    );
  }

  if (
    (state.responsiblePartyInvestigatorIdentifierValue.trim() !== "" && state.responsiblePartyInvestigatorIdentifierScheme.trim() === "") ||
    (state.responsiblePartyInvestigatorIdentifierValue.trim() === "" && state.responsiblePartyInvestigatorIdentifierScheme.trim() !== "")
  ) {
    errors.push(
      { name: "idValue", message: "Identifier scheme is required when identifier scheme is provided" },
      { name: "idScheme", message: "Identifier value is required when identifier value is provided" }
    );
  }

  if (state.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri && !isValidUrl(state.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri)) {
    errors.push({ name: "affiliationSchemeUri", message: "Invalid URL" });
  }

  if (state.responsiblePartyInvestigatorIdentifierValue && state.responsiblePartyInvestigatorIdentifierScheme.toUpperCase() === "ORCID" && !isValidORCIDValue(state.responsiblePartyInvestigatorIdentifierValue)) {
    errors.push({ name: "idValue", message: "Invalid ORCID value" });
  }
  if (state.responsiblePartyInvestigatorIdentifierValue && state.responsiblePartyInvestigatorIdentifierScheme.toUpperCase() === "ROR" && !isValidRORValue(state.responsiblePartyInvestigatorIdentifierValue)) {
    errors.push({ name: "idValue", message: "Invalid ROR value" });
  }

  if (state.responsiblePartyInvestigatorAffiliationIdentifier && state.responsiblePartyInvestigatorAffiliationIdentifierScheme.toUpperCase() === "ORCID" && !isValidORCIDValue(state.responsiblePartyInvestigatorAffiliationIdentifier)) {
    errors.push({ name: "affiliationId", message: "Invalid ORCID value" });
  }
  if (state.responsiblePartyInvestigatorAffiliationIdentifier && state.responsiblePartyInvestigatorAffiliationIdentifierScheme.toUpperCase() === "ROR" && !isValidRORValue(state.responsiblePartyInvestigatorAffiliationIdentifier)) {
    errors.push({ name: "affiliationId", message: "Invalid ROR value" });
  }

  const activeCollaborators = state.collaborators.filter((c: any) => !c.deleted);

  if (activeCollaborators.length > 0) {
    const seen = new Set<string>();
    activeCollaborators.forEach((c: any, index: number) => {
      const key = `${c.name?.trim().toLowerCase()}|${c.identifier?.trim().toLowerCase()}`;
      if (seen.has(key)) {
        errors.push({ name: `name-${index}`, message: "Duplicate collaborator with same name and identifier" });
      }
      seen.add(key);

      if (!c.name?.trim()) {
        errors.push({ name: `name-${index}`, message: `Collaborator name is required` });
      }

      if ((c.identifier.trim() !== "" && c.scheme.trim() === "") || (c.identifier.trim() === "" && c.scheme.trim() !== "")) {
        errors.push(
          { name: `identifier-${index}`, message: "Identifier and Identifier scheme must be provided together" },
          { name: `identifierScheme-${index}`, message: "Identifier and Identifier scheme must be provided together" }
        );
      }

      if (c.identifier && c.scheme.toUpperCase() === "ORCID" && !isValidORCIDValue(c.identifier)) {
        errors.push({ name: `identifier-${index}`, message: "Invalid ORCID value" });
      }
      if (c.identifier && c.scheme.toUpperCase() === "ROR" && !isValidRORValue(c.identifier)) {
        errors.push({ name: `identifier-${index}`, message: "Invalid ROR value" });
      }

      if (c.schemeUri && !isValidUrl(c.schemeUri)) {
        errors.push({ name: `schemeUri-${index}`, message: "Invalid URL" });
      }
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  try {
    await $fetch(`/api/datasets/${datasetId}/study/metadata/team`, {
      body: JSON.stringify(state),
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
      description: "Failed to save sponsor data." 
    });
  } finally {
    saveLoading.value = false;
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden">
    
    <div class="flex-1 overflow-y-auto p-4 pb-28 space-y-6">
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
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Some basic information about the study is displayed here.
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">Responsible Party</h2>
              <p class="text-gray-500 dark:text-gray-400">
                Provide information about the individual or entity responsible for the study.
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
                :items="FORM_JSON.studyMetadataSponsorsResponsiblePartyTypeOptions"
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField
                label="Given Name"
                name="givenName"
                class="w-full"
                :required="['Sponsor-Investigator', 'Principal Investigator'].includes(state.responsiblePartyType)"
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorGivenName"
                  placeholder="Annie"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Family Name"
                name="familyName"
                class="w-full"
                :required="['Sponsor-Investigator', 'Principal Investigator'].includes(state.responsiblePartyType)"
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorFamilyName"
                  placeholder="Leonhart"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField
              label="Title"
              name="title"
              class="w-full"
              :required="['Sponsor-Investigator', 'Principal Investigator'].includes(state.responsiblePartyType)"
            >
              <UInput
                v-model="state.responsiblePartyInvestigatorTitle"
                placeholder="Warrior Candidate"
                class="w-full"
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField
                label="Affiliation"
                name="affiliation"
                class="w-full"
                :required="['Sponsor-Investigator', 'Principal Investigator'].includes(state.responsiblePartyType)"
              >
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
                :required="['Sponsor-Investigator', 'Principal Investigator'].includes(state.responsiblePartyType)"
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorAffiliationIdentifier"
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
                  v-model="state.responsiblePartyInvestigatorAffiliationIdentifierScheme"
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
                  v-model="state.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri"
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

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">Lead Sponsor</h2>
              <p class="text-gray-500 dark:text-gray-400">
                Provide information about the primary organization overseeing the study.
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

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">Collaborators</h2>
              <p class="text-gray-500 dark:text-gray-400">
                Add collaborators involved in the study with their identifiers and schemes.
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
                    <UInput v-model="item.scheme" placeholder="ORCID" />
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
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-4">
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
            Are you sure you want to leave this page? Any modifications made to your fields will be permanently discarded.
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <UButton color="error" label="Discard Changes" @click="confirmLeave" />
          <UButton color="neutral" label="Stay on Page" @click="cancelLeave" />  
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>