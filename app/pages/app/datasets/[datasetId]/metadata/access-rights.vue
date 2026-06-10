<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";
import licensesJSON from "~/assets/data/licenses.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();
const dayjs = useDayjs();

const getLicenseLoading = ref(false);

const { datasetId } = route.params as {
  datasetId: string;
};

const saveLoading = ref(false);
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  access: z.object({
    description: z.string(),
    type: z.string(),
    url: z.string(),
    urlLastChecked: z.string(),
  }),
  rights: z.object({
    identifier: z.string(),
    identifierScheme: z.string(),
    identifierSchemeUri: z.string(),
    licenseText: z.string(),
    rights: z.string(),
    uri: z.string(),
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  access: {
    description: "",
    type: "",
    url: "",
    urlLastChecked: "",
  },
  rights: {
    identifier: "",
    identifierScheme: "",
    identifierSchemeUri: "",
    licenseText: "",
    rights: "",
    uri: "",
  },
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/metadata/access-rights`,
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

  state.access.description = data.value.DatasetAccess?.description ?? "";
  state.access.type = data.value.DatasetAccess?.type ?? "";
  state.access.url = data.value.DatasetAccess?.url ?? "";
  state.access.urlLastChecked = data.value.DatasetAccess?.urlLastChecked
    ? dayjs(data.value.DatasetAccess.urlLastChecked).format("YYYY-MM-DD")
    : "";

  state.rights.identifier = data.value.DatasetRights?.identifier ?? "";
  state.rights.identifierScheme =
    data.value.DatasetRights?.identifierScheme ?? "";
  state.rights.identifierSchemeUri =
    data.value.DatasetRights?.identifierSchemeUri ?? "";
  state.rights.licenseText = data.value.DatasetRights?.licenseText ?? "";
  state.rights.rights = data.value.DatasetRights?.rights ?? "";
  state.rights.uri = data.value.DatasetRights?.uri ?? "";

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

const updateLicense = async (value: string) => {
  const license = licensesJSON.find((item) => item.name === value);

  if (license) {
    getLicenseLoading.value = true;
    await $fetch(
      `/api/utils/request-json?url=${encodeURIComponent(license.detailsUrl)}`,
      {
        method: "GET",
      },
    )
      .then((res: any) => {
        console.log(res);

        const responseData = res.data;

        state.rights.licenseText = responseData.licenseText;
        state.rights.rights = license.name;
        state.rights.uri = license.reference;
        state.rights.identifier = license.licenseId;
        state.rights.identifierScheme = "SPDX";
        state.rights.identifierSchemeUri = "https://spdx.org/licenses/";
      })
      .catch((err) => {
        console.log(err);

        toast.add({
          title: "Error",
          color: "error",
          description: "Failed to fetch license details",
        });
      })
      .finally(() => {
        getLicenseLoading.value = false;
      });
  }
};

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  if (!state.access.description?.trim()) {
    errors.push({
      name: "access-description",
      message: "Access description is required.",
    });
  }

  if (state.access.type === "Access") {
    errors.push({
      name: "access-type",
      message: "Access type is required.",
    });
  }

  if (state.access.url && !isValidUrl(state.access.url)) {
    errors.push({
      name: "access-url",
      message: "Access URL is invalid.",
    });
  }

  if (!state.rights.rights?.trim()) {
    errors.push({
      name: "rights-rights",
      message: "Rights is required.",
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    access: formData.access,
    rights: formData.rights,
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/metadata/access-rights`, {
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
      description: "The form has been submitted.",
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
            label: 'Access and Rights',
            to: `/app/datasets/${datasetId}/metadata/access-rights`,
          },
        ]"
      />

      <UForm
        id="metadata-access-rights-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Access and Rights
            </h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Some basic information about the dataset is displayed here.
            <span v-if="isDirty" class="text-amber-500 ml-1">(Unsaved Changes)</span>
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Access
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Please provide access information for this dataset.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="Type" name="access-type" required>
                <USelect
                  v-model="state.access.type"
                  class="w-full"
                  placeholder="Select access type"
                  :items="FORM_JSON.datasetAccessTypeOptions"
                />
              </UFormField>

              <UFormField label="Description" name="access-description" required>
                <UTextarea
                  v-model="state.access.description"
                  placeholder="Provide further details about the access details"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="URL" name="access-url">
                <UInput
                  v-model="state.access.url"
                  placeholder="Enter the URL"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Rights
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Please provide rights information for this dataset.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="Rights" name="rights-rights" required>
                <USelect
                  v-model="state.rights.rights"
                  class="w-full"
                  placeholder="Select rights"
                  :items="licensesJSON.map((option) => ({
                    label: option.name,
                    value: option.name,
                  }))"
                  :loading="getLicenseLoading"
                  @update:model-value="updateLicense"
                />
              </UFormField>

              <UFormField label="Description" name="rights-description">
                <UTextarea
                  v-model="state.rights.licenseText"
                  placeholder="Provide further details about the license text"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pt-4 dark:from-gray-950">
      <UButton
        form="metadata-access-rights-form"
        type="submit"
        :disabled="saveLoading || getLicenseLoading"
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