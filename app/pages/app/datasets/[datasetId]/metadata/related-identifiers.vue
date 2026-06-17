<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import { nanoid } from "nanoid";
import FORM_JSON from "~/assets/data/form.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as {
  datasetId: string;
};

const saveLoading = ref(false);
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  identifiers: z.array(
    z.object({
      id: z.string(),
      deleted: z.boolean(),
      identifier: z.string(),
      identifierType: z.string(),
      local: z.boolean(),
      relatedMetadataScheme: z.string(),
      relationType: z.string(),
      resourceType: z.string(),
      schemeType: z.string(),
      schemeUri: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  identifiers: [],
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/metadata/related-identifiers`,
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

  state.identifiers = data.value.DatasetRelatedIdentifier.map((item: any) => ({
    id: item.id,
    deleted: false,
    identifier: item.identifier,
    identifierType: item.identifierType,
    local: false,
    relatedMetadataScheme: item.relatedMetadataScheme,
    relationType: item.relationType,
    resourceType: item.resourceType,
    schemeType: item.schemeType,
    schemeUri: item.schemeUri,
  }));

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

const addIdentifier = () => {
  state.identifiers.push({
    id: nanoid(),
    deleted: false,
    identifier: "",
    identifierType: "",
    local: true,
    relatedMetadataScheme: "",
    relationType: "",
    resourceType: "",
    schemeType: "",
    schemeUri: "",
  });
};

const removeIdentifier = (index: number) => {
  const identifier = state.identifiers[index];
  if (!identifier) {
    return;
  }

  if (identifier.local) {
    state.identifiers.splice(index, 1);
  } else {
    identifier.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  const activeIdentifiers =
    state.identifiers?.filter((i: any) => !i.deleted) ?? [];

  if (activeIdentifiers.length === 0) {
    errors.push({
      name: "identifiers",
      message: "Please add at least one related identifier",
    });

    return errors;
  }

  const seenIdentifiers = new Set<string>();
  activeIdentifiers.forEach((identifier: any, index: number) => {
    const key = `${identifier.identifier?.trim().toLowerCase()}|${identifier.identifierType?.trim().toLowerCase()}|${identifier.relationType?.trim().toLowerCase()}`;
    if (seenIdentifiers.has(key)) {
      errors.push({
        name: `identifiers[${index}].identifier`,
        message: "Duplicate related identifier with same value, type, and relation.",
      });
    }
    seenIdentifiers.add(key);
  });

  activeIdentifiers.forEach((identifier: any, index: number) => {
    if (!identifier.identifier?.trim()) {
      errors.push({
        name: `identifiers[${index}].identifier`,
        message: "Identifier is required",
      });
    }

    if (!identifier.identifierType?.trim()) {
      errors.push({
        name: `identifiers[${index}].identifierType`,
        message: "Identifier type is required",
      });
    }

    if (!identifier.relationType?.trim()) {
      errors.push({
        name: `identifiers[${index}].relationType`,
        message: "Relation type is required",
      });
    }

    if (identifier.identifier?.trim()) {
      const type = identifier.identifierType?.toUpperCase();

      if (type === "ORCID" && !isValidORCIDValue(identifier.identifier)) {
        errors.push({
          name: `identifiers[${index}].identifier`,
          message: "Invalid ORCID value",
        });
      }
      if (type === "ROR" && !isValidRORValue(identifier.identifier)) {
        errors.push({
          name: `identifiers[${index}].identifier`,
          message: "Invalid ROR value",
        });
      }
    }

    if (
      identifier.relationType === "IsMetadataFor" ||
      identifier.relationType === "HasMetadata"
    ) {
      if (!identifier.relatedMetadataScheme?.trim()) {
        errors.push({
          name: `identifiers[${index}].relatedMetadataScheme`,
          message: "Related metadata scheme is required",
        });
      }

      if (!identifier.schemeType?.trim()) {
        errors.push({
          name: `identifiers[${index}].schemeType`,
          message: "Scheme type is required",
        });
      }

      if (!identifier.schemeUri?.trim()) {
        errors.push({
          name: `identifiers[${index}].schemeUri`,
          message: "Scheme URI is required",
        });
      } else if (!isValidUrl(identifier.schemeUri)) {
        errors.push({
          name: `identifiers[${index}].schemeUri`,
          message: "Scheme URI must be a valid URL",
        });
      }
    }
  });

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    relatedIdentifiers: formData.identifiers.map((identifier: any) => {
      const d = { ...identifier };

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/metadata/related-identifiers`, {
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
      description: "Failed to submit the form.",
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
            label: 'Related Identifiers',
            to: `/app/datasets/${datasetId}/metadata/related-identifiers`,
          },
        ]"
      />

      <UForm
        id="metadata-identifiers-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Related Identifiers
            </h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Some basic information about the dataset is displayed here.
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Related Identifiers
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Please add some related identifiers that describe the dataset.
              </p>
            </div>

            <UFormField name="identifiers">
              <CardCollapsible
                v-for="(item, index) in state.identifiers"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.identifier || `Related Identifier ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove secondary identifier"
                    variant="soft"
                    color="error"
                    @click="removeIdentifier(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField
                    label="Identifier"
                    :name="`identifiers[${index}].identifier`"
                    required
                  >
                    <UInput
                      v-model="item.identifier"
                      placeholder="10.1000/182"
                    />
                  </UFormField>

                  <UFormField
                    label="Identifier Type"
                    :name="`identifiers[${index}].identifierType`"
                    required
                  >
                    <USelect
                      v-model="item.identifierType"
                      class="w-full"
                      placeholder="DOI"
                      :items="FORM_JSON.datasetIdentifierTypeOptions"
                    />
                  </UFormField>

                  <UFormField
                    label="Relation Type"
                    :name="`identifiers[${index}].relationType`"
                    required
                  >
                    <USelect
                      v-model="item.relationType"
                      class="w-full"
                      placeholder="Is Part Of"
                      :items="FORM_JSON.datasetRelatedIdentifierRelationTypeOptions"
                    />
                  </UFormField>

                  <UFormField
                    label="Resource Type"
                    :name="`identifiers[${index}].resourceType`"
                  >
                    <USelect
                      v-model="item.resourceType"
                      class="w-full"
                      placeholder="Dataset"
                      :items="FORM_JSON.datasetRelatedIdentifierResourceTypeOptions"
                    />
                  </UFormField>

                  <UFormField
                    label="Related Metadata Scheme"
                    :name="`identifiers[${index}].relatedMetadataScheme`"
                    :required="item.relationType === 'IsMetadataFor' || item.relationType === 'HasMetadata'"
                  >
                    <UInput
                      v-model="item.relatedMetadataScheme"
                      class="w-full"
                      :disabled="item.relationType !== 'IsMetadataFor' && item.relationType !== 'HasMetadata'"
                      placeholder="DataCite"
                    />
                  </UFormField>

                  <UFormField
                    label="Scheme Type"
                    :name="`identifiers[${index}].schemeType`"
                    :required="item.relationType === 'IsMetadataFor' || item.relationType === 'HasMetadata'"
                  >
                    <UInput
                      v-model="item.schemeType"
                      class="w-full"
                      :disabled="item.relationType !== 'IsMetadataFor' && item.relationType !== 'HasMetadata'"
                      placeholder="DataCite"
                    />
                  </UFormField>

                  <UFormField
                    label="Scheme URI"
                    :name="`identifiers[${index}].schemeUri`"
                    :required="item.relationType === 'IsMetadataFor' || item.relationType === 'HasMetadata'"
                  >
                    <UInput
                      v-model="item.schemeUri"
                      class="w-full"
                      :disabled="item.relationType !== 'IsMetadataFor' && item.relationType !== 'HasMetadata'"
                      placeholder="https://datacite.org/schema/datacite-metadata-v4.3.xsd"
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Related Identifier"
              @click="addIdentifier"
            />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pt-4 dark:from-gray-950">
      <UButton
        form="metadata-identifiers-form"
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