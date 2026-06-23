<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import * as z from "zod";
import { nanoid } from "nanoid";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";
import {
  isValidORCIDValue,
  isValidRORValue,
  isValidUrl,
} from "~/utils/validations";

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
  studyOverallOfficials: z.array(
    z.object({
      id: z.string(),
      affiliation: z.string(),
      affiliationIdentifier: z.string(),
      affiliationIdentifierScheme: z.string(),
      affiliationIdentifierSchemeUri: z.string(),
      degree: z.string(),
      deleted: z.boolean(),
      familyName: z.string(),
      givenName: z.string(),
      identifier: z.string(),
      identifierScheme: z.string(),
      identifierSchemeUri: z.string(),
      local: z.boolean(),
      role: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  studyOverallOfficials: [],
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/officials`,
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
  useSeoMeta({
    title: data.value.title,
  });

  state.studyOverallOfficials = data.value.StudyOverallOfficials.map(
    (official: any) => ({
      ...official,
      deleted: false,
      local: false,
    }),
  );

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

const addOfficial = () => {
  state.studyOverallOfficials.push({
    id: nanoid(),
    affiliation: "",
    affiliationIdentifier: "",
    affiliationIdentifierScheme: "",
    affiliationIdentifierSchemeUri: "",
    degree: "",
    deleted: false,
    familyName: "",
    givenName: "",
    identifier: "",
    identifierScheme: "",
    identifierSchemeUri: "",
    local: true,
    role: "",
  });
};

const removeOfficial = (index: number) => {
  const official = state.studyOverallOfficials[index];

  if (official?.local) {
    state.studyOverallOfficials.splice(index, 1);
  } else {
    official!.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors: FormError<string>[] = [];
  const enumValues = FORM_JSON.studyMetadataContactsOverallOfficialRole.map(
    (option) => option.value,
  );

  const activeOfficials = state.studyOverallOfficials.filter(
    (official: any) => !official.deleted,
  );

  if (activeOfficials.length > 0) {
    const seen = new Set<string>();
    activeOfficials.forEach((official: any, index: number) => {
      const key = `${official.givenName?.trim().toLowerCase()}|${official.familyName?.trim().toLowerCase()}|${official.role?.trim().toLowerCase()}`;
      if (seen.has(key)) {
        errors.push({
          name: `givenName-${index}`,
          message: "Duplicate official with same given name, family name, and role",
        });
      }
      seen.add(key);
    });

    activeOfficials.forEach((official: any, index: number) => {
      if (official.givenName.trim() === "") {
        errors.push({
          name: `givenName-${index}`,
          message: "Given name is required",
        });
      }

      if (official.familyName.trim() === "") {
        errors.push({
          name: `familyName-${index}`,
          message: "Family name is required",
        });
      }

      if (official.affiliation.trim() === "") {
        errors.push({
          name: `affiliation-${index}`,
          message: "Affiliation is required",
        });
      }

      if (
        (official.affiliationIdentifier.trim() !== "" && official.affiliationIdentifierScheme.trim() === "") ||
        (official.affiliationIdentifier.trim() === "" && official.affiliationIdentifierScheme.trim() !== "")
      ) {
        errors.push(
          {
            name: `affiliationIdentifier-${index}`,
            message: "Affiliation identifier and scheme must be provided together",
          },
          {
            name: `affiliationIdentifierScheme-${index}`,
            message: "Affiliation identifier and scheme must be provided together",
          }
        );
      }

      if (
        official.affiliationIdentifier &&
        official.affiliationIdentifierScheme?.toUpperCase() === "ORCID" &&
        !isValidORCIDValue(official.affiliationIdentifier)
      ) {
        errors.push({
          name: `affiliationIdentifier-${index}`,
          message: "Affiliation identifier must be a valid ORCID",
        });
      }
      if (
        official.affiliationIdentifier &&
        official.affiliationIdentifierScheme?.toUpperCase() === "ROR" &&
        !isValidRORValue(official.affiliationIdentifier)
      ) {
        errors.push({
          name: `affiliationIdentifier-${index}`,
          message: "Affiliation identifier must be a valid ROR",
        });
      }

      if (
        official.affiliationIdentifierSchemeUri.trim() !== "" &&
        !isValidUrl(official.affiliationIdentifierSchemeUri)
      ) {
        errors.push({
          name: `affiliationIdentifierSchemeUri-${index}`,
          message: "Affiliation identifier scheme URI must be a valid URI",
        });
      }

      if (
        (official.identifier.trim() !== "" && official.identifierScheme.trim() === "") ||
        (official.identifier.trim() === "" && official.identifierScheme.trim() !== "")
      ) {
        errors.push(
          {
            name: `identifier-${index}`,
            message: "Identifier and Identifier scheme must be provided together",
          },
          {
            name: `identifierScheme-${index}`,
            message: "Identifier and Identifier scheme must be provided together",
          }
        );
      }

      if (
        official.identifier &&
        official.identifierScheme?.toUpperCase() === "ORCID" &&
        !isValidORCIDValue(official.identifier)
      ) {
        errors.push({
          name: `identifier-${index}`,
          message: "Identifier must be a valid ORCID",
        });
      }

      if (
        official.identifier &&
        official.identifierScheme?.toUpperCase() === "ROR" &&
        !isValidRORValue(official.identifier)
      ) {
        errors.push({
          name: `identifier-${index}`,
          message: "Identifier must be a valid ROR",
        });
      }

      if (
        official.identifierSchemeUri &&
        !isValidUrl(official.identifierSchemeUri)
      ) {
        errors.push({
          name: `identifierSchemeUri-${index}`,
          message: "Identifier scheme URI must be a valid URL",
        });
      }

      if (
        official.role.trim() !== "" &&
        !enumValues.includes(official.role.trim())
      ) {
        errors.push({
          name: `role-${index}`,
          message: `Role must be one of the following: ${enumValues.join(", ")}`,
        });
      }

      if (official.role.trim() === "") {
        errors.push({
          name: `role-${index}`,
          message: "Role is required",
        });
      }
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    studyOverallOfficials: formData.studyOverallOfficials.map(
      (official: any) => {
        const s = { ...official };

        if (s.local) {
          delete s.id;
        }
        if (!s.deleted) {
          delete s.deleted;
        }

        return s;
      },
    ),
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/study/metadata/officials`, {
      body: b,
      method: "PUT",
    });
    console.log(res);

    toast.add({
      title: "Success",
      color: "success",
      description: "The form has been submitted.",
    });

    originalStateString.value = JSON.stringify(state);
  } catch (err) {
    console.log(err);

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
            label: 'Overall Officials',
            to: `/app/datasets/${datasetId}/study/metadata/officials`,
          },
        ]"
      />

      <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Overall Officials
          </h1>
        </div>
        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
        </p>
      </div>

      <UForm
        id="study-metadata-officials-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Study Governance Officials & Directors
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Register oversight personnel, scientific leaders, principal investigators, and authorization leads tied to managing execution milestones.
              </p>
            </div>

            <UFormField name="studyOverallOfficials">
              <CardCollapsible
                v-for="(item, index) in state.studyOverallOfficials"
                v-show="!item.deleted"
                :key="item.id"
                class="my-2 shadow-none"
                :title="item.givenName ? `${item.givenName} ${item.familyName}` : `Overall Official ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove Official"
                    variant="soft"
                    color="error"
                    @click="removeOfficial(index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-4 p-1">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UFormField label="Given Name" :name="`givenName-${index}`" required>
                      <UInput v-model="item.givenName" placeholder="James" />
                    </UFormField>

                    <UFormField label="Family Name" :name="`familyName-${index}`" required>
                      <UInput v-model="item.familyName" placeholder="Smith" />
                    </UFormField>

                    <UFormField label="Degree" :name="`degree-${index}`">
                      <UInput v-model="item.degree" placeholder="e.g., PhD, MD, ScD" />
                    </UFormField>
                  </div>

                  <UFormField label="Affiliation" :name="`affiliation-${index}`" required>
                    <UInput
                      v-model="item.affiliation"
                      placeholder="University of California, San Francisco"
                    />
                  </UFormField>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UFormField
                      label="Affiliation Identifier"
                      :name="`affiliationIdentifier-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.affiliationIdentifier"
                        placeholder="e.g., ror-id-5678"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Affiliation Scheme"
                      class="w-full"
                      :name="`affiliationIdentifierScheme-${index}`"
                    >
                      <UInput
                        v-model="item.affiliationIdentifierScheme"
                        placeholder="e.g., ROR"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Affiliation Scheme URI"
                      class="w-full"
                      :name="`affiliationIdentifierSchemeUri-${index}`"
                    >
                      <UInput
                        v-model="item.affiliationIdentifierSchemeUri"
                        placeholder="https://ror.org"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField label="Official Protocol Role" :name="`role-${index}`" required>
                    <USelect
                      v-model="item.role"
                      class="w-full"
                      placeholder="Select authority designation"
                      :items="FORM_JSON.studyMetadataContactsOverallOfficialRole"
                    />
                  </UFormField>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UFormField
                      label="Personal Identifier"
                      :name="`identifier-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifier"
                        placeholder="0000-0000-0000-0000"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Identifier Scheme"
                      :name="`identifierScheme-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifierScheme"
                        placeholder="e.g., ORCID"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Identifier Scheme URI"
                      :name="`identifierSchemeUri-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifierSchemeUri"
                        placeholder="https://orcid.org"
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
              label="Add New Overall Official"
              class="mt-2"
              @click="addOfficial"
            />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-4">
      <UButton
        form="study-metadata-officials-form"
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
            Are you sure you want to leave this page? Any modifications made to your registered oversight officials structural mapping lines will be permanently discarded.
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