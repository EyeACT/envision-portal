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
  consent: z.object({
    details: z.string(),
    geneticOnly: z.boolean(),
    geogRestrict: z.boolean(),
    noMethods: z.boolean(),
    noncommercial: z.boolean(),
    researchType: z.boolean(),
    type: z.string(),
  }),
  deidentLevel: z.object({
    dates: z.boolean(),
    details: z.string(),
    direct: z.boolean(),
    hipaa: z.boolean(),
    kAnon: z.boolean(),
    nonarr: z.boolean(),
    type: z.string(),
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
  consent: {
    details: "",
    geneticOnly: false,
    geogRestrict: false,
    noMethods: false,
    noncommercial: false,
    researchType: false,
    type: "",
  },
  deidentLevel: {
    dates: false,
    details: "",
    direct: false,
    hipaa: false,
    kAnon: false,
    nonarr: false,
    type: "",
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
  `/api/datasets/${datasetId}/metadata/access-data-use`,
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

  state.consent.details = data.value.DatasetConsent?.details ?? "";
  state.consent.geneticOnly = data.value.DatasetConsent?.geneticOnly ?? false;
  state.consent.geogRestrict = data.value.DatasetConsent?.geogRestrict ?? false;
  state.consent.noMethods = data.value.DatasetConsent?.noMethods ?? false;
  state.consent.noncommercial =
    data.value.DatasetConsent?.noncommercial ?? false;
  state.consent.researchType = data.value.DatasetConsent?.researchType ?? false;
  state.consent.type = data.value.DatasetConsent?.type ?? "";

  state.deidentLevel.dates = data.value.DatasetDeIdentLevel?.dates ?? false;
  state.deidentLevel.details = data.value.DatasetDeIdentLevel?.details ?? "";
  state.deidentLevel.direct = data.value.DatasetDeIdentLevel?.direct ?? false;
  state.deidentLevel.hipaa = data.value.DatasetDeIdentLevel?.hipaa ?? false;
  state.deidentLevel.kAnon = data.value.DatasetDeIdentLevel?.kAnon ?? false;
  state.deidentLevel.nonarr = data.value.DatasetDeIdentLevel?.nonarr ?? false;
  state.deidentLevel.type = data.value.DatasetDeIdentLevel?.type ?? "";

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

const { showLeaveModal, confirmLeave, cancelLeave } = useUnsavedChangesGuard({
  isDirty,
  isSubmitting,
});

const updateLicense = async (value: string) => {
  const license = licensesJSON.find((item) => item.name === value);

  if (license) {
    getLicenseLoading.value = true;
    await $fetch("/api/utils/spdx-license", {
      query: { id: license.licenseId },
    })
      .then((res) => {
        state.rights.licenseText = res.licenseText;
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

// New datasets start with placeholder types that aren't valid options, so check against the options.
const isOption = (options: { value: string }[], value: string) =>
  options.some((option) => option.value === value);

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  if (!state.access.description?.trim()) {
    errors.push({
      name: "access-description",
      message: "Access description is required.",
    });
  }

  if (!isOption(FORM_JSON.datasetAccessTypeOptions, state.access.type)) {
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
      message: "License is required.",
    });
  }

  if (!isOption(FORM_JSON.datasetConsentTypeOptions, state.consent.type)) {
    errors.push({ name: "consent.type", message: "Consent type is required" });
  }

  if (!isOption(FORM_JSON.datasetDeIdentTypeOptions, state.deidentLevel.type)) {
    errors.push({
      name: "deidentLevel.type",
      message: "De-identification type is required",
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    access: {
      ...formData.access,
      urlLastChecked: formData.access.urlLastChecked || undefined,
    },
    consent: formData.consent,
    deidentLevel: formData.deidentLevel,
    rights: formData.rights,
  };

  try {
    await $fetch(`/api/datasets/${datasetId}/metadata/access-data-use`, {
      body: b,
      method: "PUT",
    });

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
  <div class="relative flex h-[calc(100vh-6rem)] flex-col overflow-hidden">
    <div class="flex-1 space-y-6 overflow-y-auto p-4 pb-28">
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: data?.title, to: `/app/datasets/${datasetId}` },
          {
            label: 'Access & Data Use',
            to: `/app/datasets/${datasetId}/metadata/access-data-use`,
          },
        ]"
      />

      <UForm
        id="metadata-access-data-use-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Access &amp; Data Use
            </h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Define who can access this dataset, the license it is shared under,
            and the consent and de-identification that apply to it.
          </p>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Access
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Specify how people can access this dataset.
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

              <UFormField
                label="Description"
                name="access-description"
                required
              >
                <UTextarea
                  v-model="state.access.description"
                  placeholder="Data can be downloaded after submitting a request and signing a data use agreement."
                  class="w-full"
                />
              </UFormField>

              <UFormField label="URL" name="access-url">
                <UInput
                  v-model="state.access.url"
                  placeholder="https://example.org/request-access"
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
                License
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Specify the terms under which this dataset can be used.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="License" name="rights-rights" required>
                <USelect
                  v-model="state.rights.rights"
                  class="w-full"
                  placeholder="Select license"
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

              <UFormField label="Description" name="rights-description">
                <UTextarea
                  v-model="state.rights.licenseText"
                  placeholder="Paste the license text or describe any additional terms of use."
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
                Consent
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Describe the consent participants gave and any limits it places
                on data use.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="Type" name="consent.type" required>
                <USelect
                  v-model="state.consent.type"
                  class="w-full"
                  placeholder="Select consent type"
                  :items="FORM_JSON.datasetConsentTypeOptions"
                />
              </UFormField>

              <UFormField
                label="Does the consent allow only non-commercial use of the data?"
                required
              >
                <USwitch
                  v-model="state.consent.noncommercial"
                  :label="state.consent.noncommercial ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Does the consent allow only use of the data in a specific geographic location?"
                required
              >
                <USwitch
                  v-model="state.consent.geogRestrict"
                  :label="state.consent.geogRestrict ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Does the consent allow only use of the data for a specific type of research?"
                required
              >
                <USwitch
                  v-model="state.consent.researchType"
                  :label="state.consent.researchType ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Does the consent allow only use of the data for genetic research?"
                required
              >
                <USwitch
                  v-model="state.consent.geneticOnly"
                  :label="state.consent.geneticOnly ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Does the consent allow only use of the data for research that does not involve the development of methods or algorithms?"
                required
              >
                <USwitch
                  v-model="state.consent.noMethods"
                  :label="state.consent.noMethods ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField label="Details" name="consent.details">
                <UTextarea
                  v-model="state.consent.details"
                  placeholder="Data use is limited to diabetes-related research and excludes commercial use."
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
                De-identification Level
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Describe how identifying information was removed from this
                dataset.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="Type" name="deidentLevel.type" required>
                <USelect
                  v-model="state.deidentLevel.type"
                  class="w-full"
                  placeholder="Select de-identification type"
                  :items="FORM_JSON.datasetDeIdentTypeOptions"
                />
              </UFormField>

              <UFormField label="Were direct identifiers removed?" required>
                <USwitch
                  v-model="state.deidentLevel.direct"
                  :label="state.deidentLevel.direct ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Were US HIPAA de-identification rules applied?"
                required
              >
                <USwitch
                  v-model="state.deidentLevel.hipaa"
                  :label="state.deidentLevel.hipaa ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Were dates rebased and/or replaced by integers?"
                required
              >
                <USwitch
                  v-model="state.deidentLevel.dates"
                  :label="state.deidentLevel.dates ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField label="Were narrative text fields removed?" required>
                <USwitch
                  v-model="state.deidentLevel.nonarr"
                  :label="state.deidentLevel.nonarr ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField label="Was k-anonymisation (k>=2) achieved?" required>
                <USwitch
                  v-model="state.deidentLevel.kAnon"
                  :label="state.deidentLevel.kAnon ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField label="Details" name="deidentLevel.details">
                <UTextarea
                  v-model="state.deidentLevel.details"
                  placeholder="Names and medical record numbers were removed, and dates were shifted by a random offset for each participant."
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute right-0 bottom-0 left-0 z-10 px-6 pt-4 pb-6">
      <UButton
        form="metadata-access-data-use-form"
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
