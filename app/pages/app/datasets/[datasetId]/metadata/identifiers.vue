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
const initialRawData = ref<string>("");

// Keep track of touched/blurred fields to show inline errors on blur
const touchedFields = reactive<Record<string, boolean>>({});

const schema = z.object({
  secondaryIdentifiers: z.array(
    z.object({
      id: z.string(),
      deleted: z.boolean(),
      identifier: z.string(),
      local: z.boolean(),
      type: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  secondaryIdentifiers: [],
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/metadata/identifiers`,
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

  const formattedIdentifiers = data.value.DatasetAlternateIdentifier.map(
    (item: any) => ({
      id: item.id,
      deleted: false,
      identifier: item.identifier,
      local: false,
      type: item.type,
    }),
  );

  state.secondaryIdentifiers = formattedIdentifiers;
  
  initialRawData.value = JSON.stringify(formattedIdentifiers);
}

const isDirty = computed(() => {
  return JSON.stringify(state.secondaryIdentifiers) !== initialRawData.value;
});

const { 
  showLeaveModal, 
  confirmLeave, 
  cancelLeave 
} = useUnsavedChangesGuard({ isDirty, isSubmitting });

const addSecondaryIdentifier = () => {
  state.secondaryIdentifiers.push({
    id: nanoid(),
    deleted: false,
    identifier: "",
    local: true,
    type: "",
  });
};

const removeSecondaryIdentifier = (index: number) => {
  const secondaryIdentifier = state.secondaryIdentifiers[index];
  if (!secondaryIdentifier) {
    return;
  }

  if (secondaryIdentifier.local) {
    state.secondaryIdentifiers.splice(index, 1);
  } else {
    secondaryIdentifier.deleted = true;
  }
};

// Helper to check format based on identifier type
const getFormatError = (identifier: string, type: string): string | null => {
  if (!identifier?.trim()) return null;
  const cleanType = type?.trim().toUpperCase();

  if (cleanType === "DOI") {
    // Basic DOI regex pattern check (e.g. 10.xxxx/...)
    const doiRegex = /^10.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
    if (!doiRegex.test(identifier.trim())) {
      return "Invalid DOI format (e.g., 10.1000/182)";
    }
  }
  // Add other type-specific validations here if needed (e.g. URL, RRID, etc.)

  return null;
};

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  const activeSecondaryIdentifiers =
    state.secondaryIdentifiers?.filter((item: any) => !item.deleted) ?? [];

  if (activeSecondaryIdentifiers.length === 0) {
    errors.push({
      name: "secondaryIdentifiers",
      message: "Please add at least one secondary identifier",
    });
  } else {
    const seenIdentifiers = new Set<string>();
    activeSecondaryIdentifiers.forEach((item: any, index: number) => {
      const key = `${item.identifier?.trim().toLowerCase()}|${item.type?.trim().toLowerCase()}`;
      if (seenIdentifiers.has(key)) {
        errors.push({
          name: `secondary-identifier-${index}`,
          message: "Duplicate identifier with same value and type.",
        });
      }
      seenIdentifiers.add(key);
    });

    state.secondaryIdentifiers.forEach((item: any, index: number) => {
      if (item.deleted) return;

      const identifierKey = `secondary-identifier-${index}`;
      const typeKey = `secondary-type-${index}`;

      // Only evaluate format rules if field has been touched or form is submitting
      const shouldCheckFormat = touchedFields[identifierKey] || isSubmitting.value;

      if (!item.identifier?.trim()) {
        if (shouldCheckFormat) {
          errors.push({
            name: identifierKey,
            message: "Identifier value is required.",
          });
        }
      } else if (shouldCheckFormat) {
        const formatErr = getFormatError(item.identifier, item.type);
        if (formatErr) {
          errors.push({
            name: identifierKey,
            message: formatErr,
          });
        }
      }

      if (!item.type?.trim() && (touchedFields[typeKey] || isSubmitting.value)) {
        errors.push({
          name: typeKey,
          message: "Identifier type is required.",
        });
      }
    });
  }

  return errors;
};

const handleBlur = (fieldKey: string) => {
  touchedFields[fieldKey] = true;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  isSubmitting.value = true;
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    DatasetAlternateIdentifier: formData.secondaryIdentifiers.map(
      (secondaryIdentifier: any) => {
        const d = { ...secondaryIdentifier };

        if (d.local) {
          delete d.id;
        }
        if (!d.deleted) {
          delete d.deleted;
        }

        return d;
      },
    ),
  };

  await $fetch(`/api/datasets/${datasetId}/metadata/identifiers`, {
    body: b,
    method: "PUT",
  })
    .then((res) => {
      console.log(res);

      toast.add({
        title: "Success",
        color: "success",
        description: "The form has been submitted.",
      });

      window.location.reload();
    })
    .catch((err) => {
      console.log(err);

      toast.add({
        title: "Error",
        color: "error",
        description: "The form submission encountered an error.",
      });
      isSubmitting.value = false;
    })
    .finally(() => {
      saveLoading.value = false;
    });
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
            label: 'Identifiers',
            to: `/app/datasets/${datasetId}/metadata/identifiers`,
          },
        ]"
      />

      <UForm
        id="metadata-identifiers-form"
        :validate="validate"
        :state="state"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-col gap-6">
          <div
            class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
          >
            <div class="flex w-full items-center justify-between gap-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Identifiers
              </h1>
            </div>

            <p class="text-gray-500 dark:text-gray-400">
              Some basic information about the dataset is displayed here.
            </p>
          </div>

          <div
            class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
          >
            <div class="flex w-full flex-col gap-4">
              <div class="flex w-full flex-col">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                  Primary Identifiers
                </h2>

                <p class="text-gray-500 dark:text-gray-400">
                  The primary identifier for your dataset is generated
                  automatically when you publish a version of your dataset. You
                  can find the identifier for the latest published version of your
                  dataset on the
                  <NuxtLink
                    :to="`/app/datasets/${datasetId}`"
                    class="text-blue-500"
                  >
                    dataset overview
                  </NuxtLink>
                  page.
                </p>
              </div>
            </div>
          </div>

          <div
            class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
          >
            <div class="flex w-full flex-col gap-4">
              <div class="flex w-full flex-col">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                  Secondary Identifiers
                </h2>

                <p class="text-gray-500 dark:text-gray-400">
                  Please add some secondary identifiers that describe the dataset.
                </p>
              </div>

              <UFormField name="secondaryIdentifiers">
                <CardCollapsible
                  v-for="(item, index) in state.secondaryIdentifiers"
                  v-show="!item.deleted"
                  :key="item.id"
                  class="my-1 shadow-none"
                  :title="item.identifier || `Secondary Identifier ${index + 1}`"
                  bordered
                >
                  <template #header-extra>
                    <UButton
                      icon="i-lucide-trash"
                      label="Remove secondary identifier"
                      variant="soft"
                      color="error"
                      @click="removeSecondaryIdentifier(index)"
                    />
                  </template>

                  <div class="flex flex-col gap-3">
                    <UFormField
                      :name="`secondary-identifier-${index}`"
                      label="Identifier"
                      required
                    >
                      <UInput
                        v-model="item.identifier"
                        placeholder="10.1000/182"
                        @blur="handleBlur(`secondary-identifier-${index}`)"
                      />
                    </UFormField>

                    <UFormField
                      :name="`secondary-type-${index}`"
                      label="Type"
                      required
                    >
                      <USelect
                        v-model="item.type"
                        class="w-full"
                        placeholder="DOI"
                        :items="FORM_JSON.datasetIdentifierTypeOptions"
                        @blur="handleBlur(`secondary-type-${index}`)"
                        @change="handleBlur(`secondary-identifier-${index}`)"
                      />
                    </UFormField>
                  </div>
                </CardCollapsible>
              </UFormField>

              <UButton
                icon="i-lucide-plus"
                variant="outline"
                color="primary"
                label="Add Secondary Identifier"
                @click="addSecondaryIdentifier"
              />
            </div>
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-4">
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
            Are you sure you want to leave this page? Any modifications made to your secondary identifiers will be permanently discarded.
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