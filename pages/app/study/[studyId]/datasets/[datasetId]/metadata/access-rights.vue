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

const { datasetId, studyId } = route.params as {
  datasetId: string;
  studyId: string;
};

const saveLoading = ref(false);

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
  `/api/studies/${studyId}/datasets/${datasetId}/metadata/access-rights`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  // await navigateTo("/");
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
}

const updateLicense = async (value: string) => {
  const license = licensesJSON.find((item) => item.name === value);

  getLicenseLoading.value = true;

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

    getLicenseLoading.value = false;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];

  if (!state.rights.uri) {
    errors.push({
      message: "URI is required",
      path: "rights.uri",
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    access: formData.access,
    rights: formData.rights,
  };

  await $fetch(
    `/api/studies/${studyId}/datasets/${datasetId}/metadata/access-rights`,
    {
      body: b,
      method: "PUT",
    },
  )
    .then((res) => {
      console.log(res);

      toast.add({
        title: "Success",
        color: "success",
        description: "The form has been submitted.",
      });

      // refresh the page
      window.location.reload();
    })
    .catch((err) => {
      console.log(err);

      toast.add({
        title: "Error",
        color: "error",
        description: "The form has been submitted.",
      });
    })
    .finally(() => {
      saveLoading.value = false;
    });
}
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.study.title, to: `/app/study/${studyId}` },
        {
          label: data?.title,
          to: `/app/study/${studyId}/datasets/${datasetId}`,
        },
        {
          label: 'Access and Rights',
          to: `/app/study/${studyId}/datasets/${datasetId}/metadata/access-rights`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="font-bold text-gray-900 dark:text-white">
            Access and Rights
          </h1>
        </div>

        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the dataset is displayed here.
        </p>
      </div>

      <UForm
        :validate="validate"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
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
              <UFormField label="Type" name="access.type">
                <USelect
                  v-model="state.access.type"
                  class="w-full"
                  placeholder="Select access type"
                  :items="FORM_JSON.datasetAccessTypeOptions"
                />
              </UFormField>

              <UFormField label="Description" name="access.description">
                <UTextarea
                  v-model="state.access.description"
                  placeholder="Provide further details about the access details"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="URL" name="access.url">
                <UInput
                  v-model="state.access.url"
                  placeholder="Enter the URL"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="URL Last Checked" name="access.urlLastChecked">
                <UInput
                  v-model="state.access.urlLastChecked"
                  placeholder="Enter the URL last checked"
                  class="w-full"
                  type="date"
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
                Rights
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please provide rights information for this dataset.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="Rights" name="rights.rights">
                <USelect
                  v-model="state.rights.rights"
                  class="w-full"
                  placeholder="Select rights"
                  :items="
                    licensesJSON.map((option) => ({
                      label: option.name,
                      value: option.name,
                    }))
                  "
                  :loading="getLicenseLoading"
                  @update:model-value="updateLicense"
                />
              </UFormField>

              <UFormField label="Description" name="access.description">
                <UTextarea
                  v-model="state.rights.licenseText"
                  placeholder="Provide further details about the license text"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <UButton
          type="submit"
          :disabled="saveLoading || getLicenseLoading"
          :loading="saveLoading"
          class="w-full"
          size="lg"
          label="Save Metadata"
          icon="i-lucide-save"
        />
      </UForm>
    </div>
  </div>
</template>
