<script setup lang="ts">
import * as z from "zod";
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
  exclusionCriteria: z.array(z.string()),
  genderBased: z.string(),
  genderDescription: z.string(),
  healthyVolunteers: z.string(),
  inclusionCriteria: z.array(z.string()),
  maximumAgeUnit: z.string(),
  maximumAgeValue: z.number(),
  minimumAgeUnit: z.string(),
  minimumAgeValue: z.number(),
  samplingMethod: z.string(),
  sex: z.string(),
  studyPopulation: z.string(),
  studyType: z.string(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  exclusionCriteria: [],
  genderBased: "",
  genderDescription: "",
  healthyVolunteers: "",
  inclusionCriteria: [],
  maximumAgeUnit: "",
  maximumAgeValue: 0,
  minimumAgeUnit: "",
  minimumAgeValue: 0,
  samplingMethod: "",
  sex: "",
  studyPopulation: "",
  studyType: "",
});

const { data, error } = await useFetch(
  `/api/studies/${studyId}/metadata/eligibility`,
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

  state.studyType = data.value.studyType ?? "";
  state.sex = data.value.StudyEligibilty?.sex ?? "";
  state.studyPopulation = data.value.StudyEligibilty?.studyPopulation ?? "";
  state.samplingMethod = data.value.StudyEligibilty?.samplingMethod ?? "";
  state.exclusionCriteria = data.value.StudyEligibilty?.exclusionCriteria ?? [];
  state.inclusionCriteria = ["as", "asd"]; // data.value.StudyEligibilty?.inclusionCriteria ??;
  state.genderBased = data.value.StudyEligibilty?.genderBased ?? "";
  state.genderDescription = data.value.StudyEligibilty?.genderDescription ?? "";
  state.healthyVolunteers = data.value.StudyEligibilty?.healthyVolunteers ?? "";
  state.maximumAgeValue = data.value.StudyEligibilty?.maximumAgeValue ?? 0;
  state.maximumAgeUnit = data.value.StudyEligibilty?.maximumAgeUnit ?? "";
  state.minimumAgeValue = data.value.StudyEligibilty?.minimumAgeValue ?? 0;
  state.minimumAgeUnit = data.value.StudyEligibilty?.minimumAgeUnit ?? "";
}

const validate = (state: any): FormError[] => {
  const errors = [];
  const sexEnumValues = FORM_JSON.studyMetadataEligibilityGenderOptions.map(
    (option) => option.value,
  );
  const genderEnumValues =
    FORM_JSON.studyMetadataEligibilityGenderBasedOptions.map(
      (option) => option.value,
    );

  const ageUnitEnumValues =
    FORM_JSON.studyMetadataEligibilityAgeUnitOptions.map(
      (option) => option.value,
    );

  const healthyVolunteersEnumValues =
    FORM_JSON.studyMetadataEligibilityHealthyVolunteersOptions.map(
      (option) => option.value,
    );

  console.log(state);
  console.log(state.sex.trim());
  console.log(state.sex.trim() === "");
  if (state.sex.trim() === "") {
    errors.push({
      name: "sex",
      message: "Sex is required",
    });
  }

  if (state.sex.trim() !== "" && !sexEnumValues.includes(state.sex.trim())) {
    errors.push({
      name: "sex",
      message: `Sex must be one of the following: ${sexEnumValues.join(", ")}`,
    });
  }

  if (state.genderBased.trim() === "") {
    errors.push({
      name: "genderBased",
      message: "Gender based is required",
    });
  }

  if (
    state.genderBased.trim() !== "" &&
    !genderEnumValues.includes(state.genderBased.trim())
  ) {
    errors.push({
      name: "genderBased",
      message: `Gender based must be one of the following: ${genderEnumValues.join(", ")}`,
    });
  }

  if (state.minimumAgeUnit.trim() === "") {
    errors.push({
      name: "minimumAgeUnit",
      message: "Minimum age unit is required",
    });
  }

  if (state.maximumAgeUnit.trim() === "") {
    errors.push({
      name: "maximumAgeUnit",
      message: "Maximum age unit is required",
    });
  }

  if (
    state.minimumAgeUnit.trim() !== "" &&
    !ageUnitEnumValues.includes(state.minimumAgeUnit.trim())
  ) {
    errors.push({
      name: "minimumAgeUnit",
      message: `Minimum age unit must be one of the following: ${ageUnitEnumValues.join(", ")}`,
    });
  }

  if (
    state.maximumAgeUnit.trim() !== "" &&
    !ageUnitEnumValues.includes(state.maximumAgeUnit.trim())
  ) {
    errors.push({
      name: "maximumAgeUnit",
      message: `Maximum age unit must be one of the following: ${ageUnitEnumValues.join(", ")}`,
    });
  }

  if (state.healthyVolunteers.trim() === "") {
    errors.push({
      name: "healthyVolunteers",
      message: "Healthy volunteers is required",
    });
  }

  if (
    state.healthyVolunteers.trim() !== "" &&
    !healthyVolunteersEnumValues.includes(state.healthyVolunteers.trim())
  ) {
    errors.push({
      name: "healthyVolunteers",
      message: `Healthy volunteers must be one of the following: ${healthyVolunteersEnumValues.join(", ")}`,
    });
  }

  if (state.inclusionCriteria.length === 0) {
    errors.push({
      name: "inclusionCriteria",
      message: "At least one inclusion criteria is required",
    });
  } else {
    state.inclusionCriteria.forEach((item: any, index: number) => {
      if (item.trim() === "") {
        errors.push({
          name: `inclusionCriteria[${index}]`,
          message: "Field can not be empty",
        });
      }
    });
  }

  if (state.exclusionCriteria.length === 0) {
    errors.push({
      name: "exclusionCriteria",
      message: "At least one exclusion criteria is required",
    });
  } else {
    state.exclusionCriteria.forEach((item: any, index: number) => {
      if (item.trim() === "") {
        errors.push({
          name: `exclusionCriteria[${index}]`,
          message: "Field can not be empty",
        });
      }
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    exclusionCriteria: formData.exclusionCriteria.filter(
      (item) => item.trim() !== "",
    ),
    genderBased: formData.genderBased,
    genderDescription: formData.genderDescription,
    healthyVolunteers: formData.healthyVolunteers,
    inclusionCriteria: formData.inclusionCriteria.filter(
      (item) => item.trim() !== "",
    ),
    maximumAgeUnit: formData.maximumAgeUnit,
    maximumAgeValue: formData.maximumAgeValue,
    minimumAgeUnit: formData.minimumAgeUnit,
    minimumAgeValue: formData.minimumAgeValue,
    samplingMethod: formData.samplingMethod,
    sex: formData.sex,
    studyPopulation: formData.studyPopulation,
  };

  await $fetch(`/api/studies/${studyId}/metadata/eligibility`, {
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
      // refresh the page
      window.location.reload();

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
          label: 'Status',
          to: `/app/study/${studyId}/metadata/status`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Status
          </h1>
        </div>

        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
        </p>
      </div>

      <UAlert
        v-show="!state.studyType"
        title="Missing Study Type"
        description="Some information is missing from the study. Please add a study type to continue."
        color="error"
        variant="soft"
        orientation="horizontal"
        :actions="[
          {
            label: 'Add a study type',
            to: '/app/study/' + studyId + '/metadata/design',
            color: 'warning',
          },
        ]"
      />

      <UForm
        :validate="validate"
        :state="state"
        class="space-y-4"
        :disabled="!state.studyType"
        @submit="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Gender
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField label="Sex" name="sex">
              <USelect
                v-model="state.sex"
                class="w-full"
                placeholder="Female"
                :items="FORM_JSON.studyMetadataEligibilityGenderOptions"
              />
            </UFormField>

            <UFormField label="Based on Gender?" name="genderBased">
              <USelect
                v-model="state.genderBased"
                class="w-full"
                placeholder="Female"
                :items="FORM_JSON.studyMetadataEligibilityGenderBasedOptions"
              />
            </UFormField>

            <UFormField label="Description" name="genderDescription">
              <UTextarea
                v-model="state.genderDescription"
                class="w-full"
                placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos."
              />
            </UFormField>
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Age
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <div class="flex w-full gap-4">
              <UFormField label="Minimum Age" name="minimumAge" class="w-full">
                <UInput
                  v-model="state.minimumAgeValue"
                  class="w-full"
                  type="number"
                  placeholder="1"
                />
              </UFormField>

              <UFormField label="Age Unit" name="minimumAgeUnit" class="w-full">
                <USelect
                  v-model="state.minimumAgeUnit"
                  class="w-full"
                  placeholder="Years"
                  :items="FORM_JSON.studyMetadataEligibilityAgeUnitOptions"
                />
              </UFormField>
            </div>

            <div class="flex w-full gap-4">
              <UFormField label="Maximum Age" name="maximumAge" class="w-full">
                <UInput
                  v-model="state.maximumAgeValue"
                  class="w-full"
                  type="number"
                  placeholder="1"
                />
              </UFormField>

              <UFormField label="Age Unit" name="maximumAgeUnit" class="w-full">
                <USelect
                  v-model="state.maximumAgeUnit"
                  class="w-full"
                  placeholder="Years"
                  :items="FORM_JSON.studyMetadataEligibilityAgeUnitOptions"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Interventional Studies
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField
              label="Are the volunteers healthy?"
              name="healthyVolunteers"
            >
              <USelect
                v-model="state.healthyVolunteers"
                class="w-full"
                placeholder="Yes"
                :items="
                  FORM_JSON.studyMetadataEligibilityHealthyVolunteersOptions
                "
              />
            </UFormField>
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Eligibility Criteria
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField label="Inclusion Criteria" name="inclusionCriteria">
              <div v-if="state.inclusionCriteria.length > 0">
                <div
                  v-for="(item, index) in state.inclusionCriteria"
                  :key="index"
                  class="mb-2 flex gap-2"
                >
                  <UFormField
                    :name="`inclusionCriteria-${index}`"
                    class="flex-1"
                  >
                    <UInput
                      v-model="state.inclusionCriteria[index]"
                      class="w-full"
                      placeholder="Inclusion Criteria"
                    />
                  </UFormField>

                  <div class="flex items-start gap-2">
                    <UButton
                      size="sm"
                      color="error"
                      variant="outline"
                      icon="i-lucide-trash"
                      @click="state.inclusionCriteria.splice(index, 1)"
                    />

                    <UButton
                      size="sm"
                      color="success"
                      variant="outline"
                      icon="i-lucide-plus"
                      @click="state.inclusionCriteria.splice(index + 1, 0, '')"
                    />
                  </div>
                </div>
              </div>

              <div v-else>
                <UButton
                  :disabled="!state.studyType"
                  size="sm"
                  class="w-full"
                  color="success"
                  variant="outline"
                  label="Add Inclusion Criteria"
                  icon="i-lucide-plus"
                  @click="state.inclusionCriteria.push('')"
                />
              </div>
            </UFormField>

            <UFormField label="Exclusion Criteria" name="exclusionCriteria">
              <div v-if="state.exclusionCriteria.length > 0">
                <div
                  v-for="(item, index) in state.exclusionCriteria"
                  :key="index"
                  class="mb-2 flex gap-2"
                >
                  <UFormField
                    class="flex-1"
                    :name="`exclusionCriteria[${index}]`"
                  >
                    <UInput
                      v-model="state.exclusionCriteria[index]"
                      class="w-full"
                      :name="`exclusionCriteria[${index}]`"
                      placeholder="Exclusion Criteria"
                    />
                  </UFormField>

                  <div class="flex items-start gap-2">
                    <UButton
                      size="sm"
                      color="error"
                      variant="outline"
                      icon="i-lucide-trash"
                      @click="state.exclusionCriteria.splice(index, 1)"
                    />

                    <UButton
                      size="sm"
                      color="success"
                      variant="outline"
                      icon="i-lucide-plus"
                      @click="state.exclusionCriteria.splice(index + 1, 0, '')"
                    />
                  </div>
                </div>
              </div>

              <div v-else>
                <UButton
                  :disabled="!state.studyType"
                  size="sm"
                  class="w-full"
                  color="success"
                  variant="outline"
                  label="Add Exclusion Criteria"
                  icon="i-lucide-plus"
                  @click="state.exclusionCriteria.push('')"
                />
              </div>
            </UFormField>
          </div>
        </div>

        <UButton
          type="submit"
          :disabled="saveLoading || !state.studyType"
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
