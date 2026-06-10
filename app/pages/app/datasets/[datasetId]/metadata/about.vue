<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import LANGUAGES_JSON from "@/assets/data/languages.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as {
  datasetId: string;
};

const languageOptions = LANGUAGES_JSON.map((language) => ({
  label: language.name,
  value: language.alpha2,
}));

const saveLoading = ref(false);
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  acknowledgement: z.string(),
  format: z.array(z.string()),
  labelingMethod: z.string(),
  language: z.string(),
  resourceType: z.string(),
  resourceTypeName: z.string(),
  size: z.array(z.string()),
  standardsFollowed: z.string(),
  validationInfo: z.string(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  acknowledgement: "",
  format: [],
  labelingMethod: "",
  language: "",
  resourceType: "",
  resourceTypeName: "",
  size: [],
  standardsFollowed: "",
  validationInfo: "",
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/metadata/about`,
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

  state.acknowledgement = data.value.DatasetOther?.acknowledgement ?? "";
  state.format = data.value.DatasetOther?.format ?? [];
  state.labelingMethod = data.value.DatasetOther?.labelingMethod ?? "";
  state.language = data.value.DatasetOther?.language ?? "";
  state.resourceType = data.value.DatasetOther?.resourceType ?? "";
  state.resourceTypeName = data.value.DatasetOther?.resourceTypeName ?? "";
  state.size = data.value.DatasetOther?.size ?? [];
  state.standardsFollowed = data.value.DatasetOther?.standardsFollowed ?? "";
  state.validationInfo = data.value.DatasetOther?.validationInfo ?? "";

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

  if (!state.resourceTypeName) {
    errors.push({
      name: "resourceTypeName",
      message: "Resource type name is required.",
    });
  }

  if (!state.resourceType) {
    errors.push({
      name: "resourceType",
      message: "Resource type is required.",
    });
  }

  if (!state.language) {
    errors.push({
      name: "language",
      message: "Language is required.",
    });
  }

  const seenSizes = new Set();
  state.size.forEach((size: string, index: number) => {
    if (seenSizes.has(size.trim().toLowerCase())) {
      errors.push({
        name: `size-${index}`,
        message: "Duplicate size value.",
      });
    } else {
      seenSizes.add(size.trim().toLowerCase());
    }
  });

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    acknowledgement: formData.acknowledgement,
    format: formData.format.filter((format) => format !== ""),
    labelingMethod: formData.labelingMethod,
    language: formData.language,
    resourceType: formData.resourceType,
    resourceTypeName: formData.resourceTypeName,
    size: formData.size.filter((size) => size !== ""),
    standardsFollowed: formData.standardsFollowed,
    validationInfo: formData.validationInfo,
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/metadata/about`, {
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
      description: "Could not sync your updates to the server.",
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
            label: 'About',
            to: `/app/datasets/${datasetId}/metadata/about`,
          },
        ]"
      />

      <UForm
        id="metadata-about-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">About</h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Please provide some basic information about the dataset.
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Resource Type
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                The recommended content is a single term of some detail about
                the domain or content of the dataset so that a pair can be
                formed with the type subproperty. For example, a resource name
                of `Diabetes` yields `Diabetes dataset`.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="Name" name="resourceTypeName" required>
                <UInput
                  v-model="state.resourceTypeName"
                  class="w-full"
                  placeholder="Enter resource type name"
                />
              </UFormField>

              <UFormField label="Type" name="resourceType" required>
                <UInput
                  v-model="state.resourceType"
                  class="w-full"
                  placeholder="Dataset"
                  :disabled="true"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Language
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                The primary language of the dataset.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField
                label="What is the language?"
                name="language"
                required
              >
                <USelect
                  v-model="state.language"
                  class="w-full"
                  placeholder="Select language"
                  :items="languageOptions"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Size
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Size (e.g., bytes, pages, inches, etc.) or duration (extent),
                e.g., hours, minutes, days, etc., of a resource
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="Size" name="size">
                <div v-if="state.size.length > 0">
                  <div
                    v-for="(size, index) in state.size"
                    :key="index"
                    class="mb-2 flex gap-2"
                  >
                    <UFormField
                      class="w-full"
                      :name="`size-${index}`"
                      label=""
                      required
                    >
                      <UInput
                        v-model="state.size[index]"
                        placeholder="45 minutes"
                      />
                    </UFormField>

                    <UButton
                      size="sm"
                      color="error"
                      variant="outline"
                      icon="i-lucide-trash"
                      @click="state.size.splice(index, 1)"
                    />

                    <UButton
                      size="sm"
                      color="success"
                      variant="outline"
                      icon="i-lucide-plus"
                      @click="state.size.splice(index + 1, 0, '')"
                    />
                  </div>
                </div>

                <div v-else>
                  <UButton
                    size="sm"
                    class="w-full"
                    color="success"
                    variant="outline"
                    label="Add Size"
                    icon="i-lucide-plus"
                    @click="state.size.push('')"
                  />
                </div>
              </UFormField>
            </div>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Format
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Technical format of the data files in the dataset. Use file
                extension or MIME type where possible, e.g., PDF, XML, MPG or
                application/pdf, text/xml, video/mpeg.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="" name="format">
                <div v-if="state.format.length > 0">
                  <div
                    v-for="(format, index) in state.format"
                    :key="index"
                    class="mb-2 flex gap-2"
                  >
                    <UInput
                      v-model="state.format[index]"
                      class="w-full"
                      placeholder="CSV"
                    />

                    <UButton
                      size="sm"
                      color="error"
                      variant="outline"
                      icon="i-lucide-trash"
                      @click="state.format.splice(index, 1)"
                    />

                    <UButton
                      size="sm"
                      color="success"
                      variant="outline"
                      icon="i-lucide-plus"
                      @click="state.format.splice(index + 1, 0, '')"
                    />
                  </div>
                </div>

                <div v-else>
                  <UButton
                    size="sm"
                    class="w-full"
                    color="success"
                    variant="outline"
                    label="Add Format"
                    icon="i-lucide-plus"
                    @click="state.format.push('')"
                  />
                </div>
              </UFormField>
            </div>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Standards Followed
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Mention the standards followed to structure the dataset, format
                the data files, etc. Make sure to include identifiers of the
                standards when available and/or link to the associated
                documentation.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="" name="standardsFollowed">
                <UTextarea
                  v-model="state.standardsFollowed"
                  class="w-full"
                  placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos."
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Acknowledgement
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Brief description of how to acknowledge the dataset, in APA
                format (refer to the ACKNOWLEDGEMENT.txt file for additional
                details).
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="" name="acknowledgement">
                <UTextarea
                  v-model="state.acknowledgement"
                  class="w-full"
                  placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos."
                />
              </UFormField>
            </div>
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pt-4 dark:from-gray-950">
      <UButton
        form="metadata-about-form"
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
            <UButton color="neutral" label="Stay on Page" @click="cancelLeave" />
            <UButton color="error" label="Discard Changes" @click="confirmLeave" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>