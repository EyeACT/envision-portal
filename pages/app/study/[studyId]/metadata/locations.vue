<script setup lang="ts">
import * as z from "zod";
import { nanoid } from "nanoid";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };

const saveLoading = ref(false);

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
  `/api/studies/${studyId}/metadata/locations`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo("/");
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
}

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

  if (location.local) {
    state.studyLocations.splice(index, 1);
  } else {
    location.deleted = true;
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

  state.studyLocations.forEach((location: any, index: number) => {
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

    if (location.state.trim() === "") {
      errors.push({
        name: `state-${index}`,
        message: "State is required",
      });
    }

    // If identifier is provided, then identifierScheme must also be provided or vice versa
    if (
      (location.identifier.trim() !== "" &&
        location.identifierScheme.trim() === "") ||
      (location.identifier.trim() === "" &&
        location.identifierScheme.trim() !== "")
    ) {
      const messages = [
        {
          name: `identifier-${index}`,
          message: "Identifier and Identifier Scheme must be provided together",
        },
        {
          name: `identifierScheme-${index}`,
          message: "Identifier and Identifier Scheme must be provided together",
        },
      ];

      errors.push(...messages);
    }
  });

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    studyLocations: formData.studyLocations.map((location: any) => {
      const s = location;

      if (s.local) {
        delete s.id;
      }
      if (!s.deleted) {
        delete s.deleted;
      }

      return s;
    }),
  };

  await $fetch(`/api/studies/${studyId}/metadata/locations`, {
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

      // refresh the page
      window.location.reload();
    })
    .catch((err) => {
      console.log(err);

      toast.add({
        title: "Error",
        color: "error",
        description: "An error occurred while submitting the form.",
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
        { label: data?.title, to: `/app/study/${studyId}` },
        {
          label: 'Metadata',
        },
        {
          label: 'Locations',
          to: `/app/study/${studyId}/metadata/locations`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
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
        :validate="validate"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Locations
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField name="studyLocations">
              <CardCollapsible
                v-for="(item, index) in state.studyLocations"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.facility || `City ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove location"
                    variant="soft"
                    color="error"
                    @click="removeLocation(index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-3">
                  <UFormField label="Facility" :name="`facility-${index}`">
                    <UInput v-model="item.facility" placeholder="James" />
                  </UFormField>

                  <UFormField label="Status" :name="`status-${index}`">
                    <USelect
                      v-model="item.status"
                      class="w-full"
                      placeholder="Active"
                      :items="FORM_JSON.studyMetadataStatusOptions"
                    />
                  </UFormField>

                  <UFormField label="City" :name="`city-${index}`">
                    <UInput v-model="item.city" placeholder="San Francisco" />
                  </UFormField>

                  <UFormField label="State" :name="`state-${index}`">
                    <UInput v-model="item.state" placeholder="California" />
                  </UFormField>

                  <UFormField label="Country" :name="`country-${index}`">
                    <UInput
                      v-model="item.country"
                      placeholder="United States"
                    />
                  </UFormField>

                  <UFormField label="Zip Code" :name="`zip-${index}`">
                    <UInput v-model="item.zip" placeholder="94101" />
                  </UFormField>

                  <div class="flex w-full gap-3">
                    <UFormField
                      label="Identifier"
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
                        placeholder="ORCID"
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
              label="Add Location"
              @click="addLocation"
            />
          </div>
        </div>

        <UButton
          type="submit"
          :disabled="saveLoading"
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
