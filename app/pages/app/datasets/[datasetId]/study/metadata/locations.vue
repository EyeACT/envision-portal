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
  studyLocations: z.array(
    z.object({
      id: z.string(),
      city: z.string(),
      country: z.string(),
      deleted: z.boolean(),
      facility: z.string(),
      identifier: z.string(),
      identifierScheme: z.string(),
      identifierSchemeUri: z.string(),
      local: z.boolean(),
      state: z.string(),
      status: z.string(),
      zip: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  studyLocations: [],
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/locations`,
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

  state.studyLocations = data.value.StudyLocation.map((location: any) => ({
    ...location,
    deleted: false,
    local: false,
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

const addLocation = () => {
  state.studyLocations.push({
    id: nanoid(),
    city: "",
    country: "",
    deleted: false,
    facility: "",
    identifier: "",
    identifierScheme: "",
    identifierSchemeUri: "",
    local: true,
    state: "",
    status: "",
    zip: "",
  });
};

const removeLocation = (index: number) => {
  const location = state.studyLocations[index];

  if (location?.local) {
    state.studyLocations.splice(index, 1);
  } else {
    location!.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];
  const enumValues = FORM_JSON.studyMetadataStatusOptions.map(
    (option) => option.value,
  );

  if (state.studyLocations.length === 0) {
    errors.push({
      name: "studyLocations",
      message: "At least one study location is required",
    });
  }

  const activeLocations = state.studyLocations.filter(
    (location: any) => !location.deleted,
  );

  if (activeLocations.length === 0) {
    errors.push({
      name: "studyLocations",
      message: "At least one study location is required",
    });
  }

  const seen = new Set<string>();
  activeLocations.forEach((location: any, index: number) => {
    const key = `${location.facility?.trim().toLowerCase()}|${location.city?.trim().toLowerCase()}|${location.country?.trim().toLowerCase()}`;
    if (seen.has(key)) {
      errors.push({
        name: `facility-${index}`,
        message: "Duplicate location with same facility, city, and country",
      });
    }
    seen.add(key);
  });

  activeLocations.forEach((location: any, index: number) => {
    if (location.facility.trim() === "") {
      errors.push({
        name: `facility-${index}`,
        message: "Facility is required",
      });
    }

    if (location.status.trim() === "") {
      errors.push({
        name: `status-${index}`,
        message: "Status is required",
      });
    }

    if (
      location.status.trim() !== "" &&
      !enumValues.includes(location.status.trim())
    ) {
      errors.push({
        name: `status-${index}`,
        message: "Status must be a valid option",
      });
    }

    if (location.city.trim() === "") {
      errors.push({
        name: `city-${index}`,
        message: "City is required",
      });
    }

    if (location.country.trim() === "") {
      errors.push({
        name: `country-${index}`,
        message: "Country is required",
      });
    }

    if (
      (location.identifier.trim() !== "" && location.identifierScheme.trim() === "") ||
      (location.identifier.trim() === "" && location.identifierScheme.trim() !== "")
    ) {
      errors.push(
        {
          name: `identifier-${index}`,
          message: "Identifier and Identifier Scheme must be provided together",
        },
        {
          name: `identifierScheme-${index}`,
          message: "Identifier and Identifier Scheme must be provided together",
        }
      );
    }

    if (
      location.identifier &&
      location.identifierScheme?.toUpperCase() === "ORCID" &&
      !isValidORCIDValue(location.identifier)
    ) {
      errors.push({
        name: `identifier-${index}`,
        message: "Identifier must be a valid ORCID",
      });
    }
    if (
      location.identifier &&
      location.identifierScheme?.toUpperCase() === "ROR" &&
      !isValidRORValue(location.identifier)
    ) {
      errors.push({
        name: `identifier-${index}`,
        message: "Identifier must be a valid ROR",
      });
    }

    if (
      location.identifierSchemeUri &&
      !isValidUrl(location.identifierSchemeUri)
    ) {
      errors.push({
        name: `identifierSchemeUri-${index}`,
        message: "Identifier Scheme URI must be a valid URL",
      });
    }
  });

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    studyLocations: formData.studyLocations.map((location: any) => {
      const s = { ...location };

      if (s.local) {
        delete s.id;
      }
      if (!s.deleted) {
        delete s.deleted;
      }

      return s;
    }),
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/study/metadata/locations`, {
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
            label: 'Locations',
            to: `/app/datasets/${datasetId}/study/metadata/locations`,
          },
        ]"
      />

      <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Locations
          </h1>
        </div>
        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
        </p>
      </div>

      <UForm
        id="study-metadata-locations-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Facility Study Locations
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Register active medical institutions, clinical trial sites, regional laboratories, or physical facilities executing parts of this testing setup.
              </p>
            </div>

            <UFormField name="studyLocations">
              <CardCollapsible
                v-for="(item, index) in state.studyLocations"
                v-show="!item.deleted"
                :key="item.id"
                class="my-2 shadow-none"
                :title="item.facility || `Location ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove Location"
                    variant="soft"
                    color="error"
                    @click="removeLocation(index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-4 p-1">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UFormField label="Facility Name" :name="`facility-${index}`" required>
                      <UInput v-model="item.facility" placeholder="e.g., Mayo Clinic, Stanford Hospital" />
                    </UFormField>

                    <UFormField label="Recruitment Status" :name="`status-${index}`" required>
                      <USelect
                        v-model="item.status"
                        class="w-full"
                        placeholder="Select operations threshold"
                        :items="FORM_JSON.studyMetadataStatusOptions"
                      />
                    </UFormField>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <UFormField label="City" :name="`city-${index}`" class="md:col-span-2" required>
                      <UInput v-model="item.city" placeholder="San Francisco" />
                    </UFormField>

                    <UFormField label="State / Province" :name="`state-${index}`" required>
                      <UInput v-model="item.state" placeholder="California" />
                    </UFormField>

                    <UFormField label="Zip / Postal Code" :name="`zip-${index}`">
                      <UInput v-model="item.zip" placeholder="94101" />
                    </UFormField>
                  </div>

                  <UFormField label="Country" :name="`country-${index}`" required>
                    <UInput v-model="item.country" placeholder="United States" />
                  </UFormField>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UFormField
                      label="Facility Identifier"
                      :name="`identifier-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifier"
                        placeholder="e.g., ror-id-9999"
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
                        placeholder="e.g., ROR, Facility ID"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Scheme URI"
                      :name="`identifierSchemeUri-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifierSchemeUri"
                        placeholder="https://ror.org"
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
              label="Add New Location Record"
              class="mt-2"
              @click="addLocation"
            />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-4">
      <UButton
        form="study-metadata-locations-form"
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
            Are you sure you want to leave this page? Any modifications made to your configured study facility location arrays will be permanently discarded.
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