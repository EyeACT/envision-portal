<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";

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
  `/api/datasets/${datasetId}/study/metadata/eligibility`,
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

  state.studyType = data.value.studyType ?? "";
  state.sex = data.value.StudyEligibility?.sex ?? "";
  state.studyPopulation = data.value.StudyEligibility?.studyPopulation ?? "";
  state.samplingMethod = data.value.StudyEligibility?.samplingMethod ?? "";
  state.exclusionCriteria = data.value.StudyEligibility?.exclusionCriteria ?? [];
  state.inclusionCriteria = data.value.StudyEligibility?.inclusionCriteria ?? [];
  state.genderBased = data.value.StudyEligibility?.genderBased ?? "";
  state.genderDescription = data.value.StudyEligibility?.genderDescription ?? "";
  state.healthyVolunteers = data.value.StudyEligibility?.healthyVolunteers ?? "";
  state.maximumAgeValue = data.value.StudyEligibility?.maximumAgeValue ?? 0;
  state.maximumAgeUnit = data.value.StudyEligibility?.maximumAgeUnit ?? "";
  state.minimumAgeValue = data.value.StudyEligibility?.minimumAgeValue ?? 0;
  state.minimumAgeUnit = data.value.StudyEligibility?.minimumAgeUnit ?? "";

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
  const errors = [];
  const sexEnumValues = FORM_JSON.studyMetadataEligibilityGenderOptions.map((option) => option.value);
  const genderEnumValues = FORM_JSON.studyMetadataEligibilityGenderBasedOptions.map((option) => option.value);
  const ageUnitEnumValues = FORM_JSON.studyMetadataEligibilityAgeUnitOptions.map((option) => option.value);
  const healthyVolunteersEnumValues = FORM_JSON.studyMetadataEligibilityHealthyVolunteersOptions.map((option) => option.value);

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

  if (state.genderBased.trim() !== "" && !genderEnumValues.includes(state.genderBased.trim())) {
    errors.push({
      name: "genderBased",
      message: `Gender based must be one of the following: ${genderEnumValues.join(", ")}`,
    });
  }

  if (state.minimumAgeValue <= 0) {
    errors.push({
      name: "minimumAge",
      message: "Minimum age value must be greater than 0",
    });
  }

  if (state.maximumAgeValue <= 0) {
    errors.push({
      name: "maximumAge",
      message: "Maximum age value must be greater than 0",
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

  if (state.minimumAgeUnit.trim() !== "" && !ageUnitEnumValues.includes(state.minimumAgeUnit.trim())) {
    errors.push({
      name: "minimumAgeUnit",
      message: `Minimum age unit must be one of the following: ${ageUnitEnumValues.join(", ")}`,
    });
  }

  if (state.maximumAgeUnit.trim() !== "" && !ageUnitEnumValues.includes(state.maximumAgeUnit.trim())) {
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

  if (state.healthyVolunteers.trim() !== "" && !healthyVolunteersEnumValues.includes(state.healthyVolunteers.trim())) {
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
  
  if (state.minimumAgeValue && state.maximumAgeValue && state.minimumAgeValue > state.maximumAgeValue) {
    errors.push({
      name: "minimumAgeValue",
      message: "Minimum Age must be less than Maximum Age",
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    exclusionCriteria: formData.exclusionCriteria.filter((item) => item.trim() !== ""),
    genderBased: formData.genderBased,
    genderDescription: formData.genderDescription,
    healthyVolunteers: formData.healthyVolunteers,
    inclusionCriteria: formData.inclusionCriteria.filter((item) => item.trim() !== ""),
    maximumAgeUnit: formData.maximumAgeUnit,
    maximumAgeValue: formData.maximumAgeValue,
    minimumAgeUnit: formData.minimumAgeUnit,
    minimumAgeValue: formData.minimumAgeValue,
    samplingMethod: formData.samplingMethod,
    sex: formData.sex,
    studyPopulation: formData.studyPopulation,
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/study/metadata/eligibility`, {
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
            label: 'Eligibility',
            to: `/app/datasets/${datasetId}/study/metadata/eligibility`,
          },
        ]"
      />

      <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Eligibility
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
            to: '/app/datasets/' + datasetId + '/study/metadata/design',
            color: 'warning',
          },
        ]"
      />

      <UForm
        id="study-metadata-eligibility-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        :disabled="!state.studyType"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Gender
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Define biological sex and gender identity classification boundaries required for enrollment eligibility.
              </p>
            </div>

            <UFormField label="Sex" name="sex" required>
              <USelect
                v-model="state.sex"
                class="w-full"
                placeholder="Female"
                :items="FORM_JSON.studyMetadataEligibilityGenderOptions"
              />
            </UFormField>

            <UFormField label="Based on Gender?" name="genderBased" required>
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
                placeholder="Provide detailed context regarding any gender-specific targeting or limitations within the cohort."
              />
            </UFormField>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Age Boundaries
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Establish precise lower and upper limits of age matching criteria for target trial candidates.
              </p>
            </div>

            <div class="flex w-full gap-4">
              <UFormField
                label="Minimum Age"
                name="minimumAge"
                class="w-full"
                required
              >
                <UInput
                  v-model="state.minimumAgeValue"
                  class="w-full"
                  type="number"
                  placeholder="1"
                />
              </UFormField>

              <UFormField
                label="Age Unit"
                name="minimumAgeUnit"
                class="w-full"
                required
              >
                <USelect
                  v-model="state.minimumAgeUnit"
                  class="w-full"
                  placeholder="Years"
                  :items="FORM_JSON.studyMetadataEligibilityAgeUnitOptions"
                />
              </UFormField>
            </div>

            <div class="flex w-full gap-4">
              <UFormField
                label="Maximum Age"
                name="maximumAge"
                class="w-full"
                required
              >
                <UInput
                  v-model="state.maximumAgeValue"
                  class="w-full"
                  type="number"
                  placeholder="1"
                />
              </UFormField>

              <UFormField
                label="Age Unit"
                name="maximumAgeUnit"
                class="w-full"
                required
              >
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

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Interventional Study Attributes
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Indicate if health baseline constraints apply for general population screening vectors.
              </p>
            </div>

            <UFormField
              label="Are the volunteers healthy?"
              name="healthyVolunteers"
              required
            >
              <USelect
                v-model="state.healthyVolunteers"
                class="w-full"
                placeholder="Yes"
                :items="FORM_JSON.studyMetadataEligibilityHealthyVolunteersOptions"
              />
            </UFormField>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Sampling Method
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Configure descriptive demographic targets for cohort sourcing models.
              </p>
            </div>

            <UFormField label="Study Population" name="studyPopulation">
              <UInput
                v-model="state.studyPopulation"
                class="w-full"
                placeholder="A description of the population from which the groups or cohorts will be selected (Required for observational)."
              />
            </UFormField>

            <UFormField label="Sampling Method" name="samplingMethod">
              <USelect
                v-model="state.samplingMethod"
                class="w-full"
                placeholder="Probability Sample"
                :items="FORM_JSON.studyMetadataEligibilitySamplingMethodOptions"
              />
            </UFormField>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Eligibility Criteria Listings
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Maintain explicit conditional logic sets guiding participant acceptances and rejections.
              </p>
            </div>

            <UFormField
              label="Inclusion Criteria"
              name="inclusionCriteria"
              required
            >
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
                      placeholder="Inclusion Criteria rule item"
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

            <UFormField
              label="Exclusion Criteria"
              name="exclusionCriteria"
              required
            >
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
                      placeholder="Exclusion Criteria rule item"
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
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-4">
      <UButton
        form="study-metadata-eligibility-form"
        type="submit"
        :disabled="saveLoading || !state.studyType"
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
            Are you sure you want to leave this page? Any modifications made to your eligibility parameters will be permanently discarded.
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