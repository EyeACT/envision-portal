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
  allocation: z.string(),
  bioSpecDescription: z.string(),
  bioSpecRetention: z.string(),
  enrollmentCount: z.number(),
  enrollmentType: z.string(),
  interventionModel: z.string(),
  interventionModelDescription: z.string(),
  isPatientRegistry: z.string(),
  masking: z.string(),
  maskingDescription: z.string(),
  numberOfArms: z.number(),
  oberservationalModelList: z.array(z.string()),
  phaseList: z.array(z.string()),
  primaryPurpose: z.string(),
  studyType: z.string(),
  targetDuration: z.number(),
  targetDurationUnit: z.string(),
  timePerspectiveList: z.array(z.string()),
  whoMaskedList: z.array(z.string()),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  allocation: "",
  bioSpecDescription: "",
  bioSpecRetention: "",
  enrollmentCount: 0,
  enrollmentType: "",
  interventionModel: "",
  interventionModelDescription: "",
  isPatientRegistry: "",
  masking: "",
  maskingDescription: "",
  numberOfArms: 0,
  oberservationalModelList: [],
  phaseList: [],
  primaryPurpose: "",
  studyType: "",
  targetDuration: 0,
  targetDurationUnit: "",
  timePerspectiveList: [],
  whoMaskedList: [],
});

const selectOptions = [
  {
    label: "Yes",
    value: "Yes",
  },
  {
    label: "No",
    value: "No",
  },
];

const { data, error } = await useFetch(
  `/api/studies/${studyId}/metadata/design`,
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

  state.studyType = data.value.StudyDesign?.studyType ?? "";
  state.isPatientRegistry = data.value.StudyDesign?.isPatientRegistry ?? "";

  state.enrollmentCount = data.value.StudyDesign?.enrollmentCount ?? 0;
  state.enrollmentType = data.value.StudyDesign?.enrollmentType ?? "";

  state.allocation = data.value.StudyDesign?.allocation ?? "";
  state.interventionModel = data.value.StudyDesign?.interventionModel ?? "";
  state.interventionModelDescription =
    data.value.StudyDesign?.interventionModelDescription ?? "";
  state.primaryPurpose = data.value.StudyDesign?.primaryPurpose ?? "";

  state.masking = data.value.StudyDesign?.masking ?? "";
  state.maskingDescription = data.value.StudyDesign?.maskingDescription ?? "";
  state.whoMaskedList = data.value.StudyDesign?.whoMaskedList ?? [];

  state.numberOfArms = data.value.StudyDesign?.numberOfArms ?? 0;
  state.phaseList = data.value.StudyDesign?.phaseList ?? [];

  state.oberservationalModelList =
    data.value.StudyDesign?.oberservationalModelList ?? [];
  state.timePerspectiveList = data.value.StudyDesign?.timePerspectiveList ?? [];

  state.targetDuration = data.value.StudyDesign?.targetDuration ?? 0;
  state.targetDurationUnit = data.value.StudyDesign?.targetDurationUnit ?? "";

  state.bioSpecRetention = data.value.StudyDesign?.bioSpecRetention ?? "";
  state.bioSpecDescription = data.value.StudyDesign?.bioSpecDescription ?? "";
}

const validate = (state: any): FormError[] => {
  const errors = [];

  if (!state.studyType) {
    errors.push({
      name: "studyType",
      message: "Study type is required",
    });
  }

  if (state.studyType === "Observational") {
    if (!state.isPatientRegistry) {
      errors.push({
        name: "isPatientRegistry",
        message: "Is patient registry is required",
      });
    }

    if (!state.oberservationalModelList.length) {
      errors.push({
        name: "oberservationalModelList",
        message: "Observational model is required",
      });
    }

    if (!state.timePerspectiveList.length) {
      errors.push({
        name: "timePerspectiveList",
        message: "Time perspective is required",
      });
    }

    if (!state.bioSpecRetention) {
      errors.push({
        name: "bioSpecRetention",
        message: "Bio specification retention is required",
      });
    }

    if (!state.bioSpecDescription) {
      errors.push({
        name: "bioSpecDescription",
        message: "Bio specification description is required",
      });
    }

    if (state.targetDuration <= 0) {
      errors.push({
        name: "targetDuration",
        message: "Target duration must be greater than 0",
      });
    }

    if (!state.targetDurationUnit) {
      errors.push({
        name: "targetDurationUnit",
        message: "Target duration unit is required",
      });
    }
  }

  if (state.studyType === "Interventional") {
    if (!state.allocation) {
      errors.push({
        name: "allocation",
        message: "Allocation is required",
      });
    }

    if (!state.interventionModel) {
      errors.push({
        name: "interventionModel",
        message: "Intervention model is required",
      });
    }

    if (!state.primaryPurpose) {
      errors.push({
        name: "primaryPurpose",
        message: "Primary purpose is required",
      });
    }

    if (!state.masking) {
      errors.push({
        name: "masking",
        message: "Masking is required",
      });
    }

    if (!state.whoMaskedList.length) {
      errors.push({
        name: "whoMaskedList",
        message: "Who masked is required",
      });
    }

    if (!state.phaseList.length) {
      errors.push({
        name: "phaseList",
        message: "Phase is required",
      });
    }

    if (state.numberOfArms <= 0) {
      errors.push({
        name: "numberOfArms",
        message: "Number of arms must be greater than 0",
      });
    }
  }

  if (state.enrollmentCount <= 0) {
    errors.push({
      name: "enrollmentCount",
      message: "Enrollment count must be greater than 0",
    });
  }

  if (!state.enrollmentType) {
    errors.push({
      name: "enrollmentType",
      message: "Enrollment type is required",
    });
  }

  console.log(errors);

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    allocation: formData.allocation,
    bioSpecDescription: formData.bioSpecDescription,
    bioSpecRetention: formData.bioSpecRetention,
    enrollmentCount: formData.enrollmentCount,
    enrollmentType: formData.enrollmentType,
    interventionModel: formData.interventionModel,
    interventionModelDescription: formData.interventionModelDescription,
    isPatientRegistry: formData.isPatientRegistry,
    masking: formData.masking,
    maskingDescription: formData.maskingDescription,
    numberOfArms: formData.numberOfArms,
    oberservationalModelList: formData.oberservationalModelList,
    phaseList: formData.phaseList,
    primaryPurpose: formData.primaryPurpose,
    studyType: formData.studyType,
    targetDuration: formData.targetDuration,
    targetDurationUnit: formData.targetDurationUnit,
    timePerspectiveList: formData.timePerspectiveList,
    whoMaskedList: formData.whoMaskedList,
  };

  await $fetch(`/api/studies/${studyId}/metadata/design`, {
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
          label: 'Design',
          to: `/app/study/${studyId}/metadata/design`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Design
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
                Study Type
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField label="What is the study type?" name="studyType">
              <USelect
                v-model="state.studyType"
                class="w-full"
                placeholder="Interventional"
                :items="FORM_JSON.studyMetadataStudyTypeOptions"
              />
            </UFormField>

            <UFormField
              v-show="state.studyType === 'Observational'"
              label="Is this study a Patient Registry?"
              name="isPatientRegistry"
            >
              <USelect
                v-model="state.isPatientRegistry"
                class="w-full"
                placeholder="No"
                :items="selectOptions"
              />
            </UFormField>
          </div>
        </div>

        <div
          v-show="
            state.studyType === 'Interventional' ||
            state.studyType === 'Observational'
          "
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Design Information
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField
              v-show="state.studyType === 'Interventional'"
              label="Allocation"
              name="allocation"
            >
              <USelect
                v-model="state.allocation"
                class="w-full"
                placeholder="Randomized"
                :items="FORM_JSON.studyMetadataAllocationOptions"
              />
            </UFormField>

            <UFormField
              v-show="state.studyType === 'Interventional'"
              label="Intervention Model"
              name="interventionModel"
            >
              <USelect
                v-model="state.interventionModel"
                class="w-full"
                placeholder="Prevention"
                :items="FORM_JSON.studyMetadataInterventionModelOptions"
              />
            </UFormField>

            <UFormField
              v-show="state.studyType === 'Interventional'"
              label="Intervention Model Description"
              name="interventionModelDescription"
            >
              <UInput
                v-model="state.interventionModelDescription"
                class="w-full"
                placeholder="Intervention model description"
              />
            </UFormField>

            <UFormField
              v-show="state.studyType === 'Interventional'"
              label="Primary Purpose"
              name="primaryPurpose"
            >
              <USelect
                v-model="state.primaryPurpose"
                class="w-full"
                placeholder="Single Group Assignment"
                :items="FORM_JSON.studyMetadataPrimaryPurposeOptions"
              />
            </UFormField>

            <UFormField
              v-show="state.studyType === 'Observational'"
              label="Observational Models"
              name="oberservationalModelList"
            >
              <USelect
                v-model="state.oberservationalModelList"
                class="w-full"
                multiple
                placeholder="Observational Models"
                :items="FORM_JSON.studyMetadataObservationalModelsOptions"
              />
            </UFormField>

            <UFormField
              v-show="state.studyType === 'Observational'"
              label="Time Perspective"
              name="timePerspectiveList"
            >
              <USelect
                v-model="state.timePerspectiveList"
                class="w-full"
                multiple
                placeholder="Retrospective"
                :items="FORM_JSON.studyMetadataTimePerspectiveOptions"
              />
            </UFormField>
          </div>
        </div>

        <div
          v-show="state.studyType === 'Interventional'"
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Masking
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField label="Masking" name="masking">
              <USelect
                v-model="state.masking"
                class="w-full"
                placeholder="Blind"
                :items="FORM_JSON.studyMetadataMaskingOptions"
              />
            </UFormField>

            <UFormField label="Masking Description" name="maskingDescription">
              <UTextarea
                v-model="state.maskingDescription"
                class="w-full"
                placeholder="Lorem ipsum dolor sit amet"
              />
            </UFormField>

            <UFormField label="Who Masked?" name="whoMaskedList">
              <USelect
                v-model="state.whoMaskedList"
                class="w-full"
                multiple
                placeholder="Single Group Assignment"
                :items="FORM_JSON.studyMetadataWhoMaskedOptions"
              />
            </UFormField>
          </div>
        </div>

        <div
          v-show="state.studyType === 'Interventional'"
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Phase
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField label="Phase" name="phaseList">
              <USelect
                v-model="state.phaseList"
                class="w-full"
                multiple
                placeholder="Phase 1"
                :items="FORM_JSON.studyMetadataPhaseOptions"
              />
            </UFormField>
          </div>
        </div>

        <div
          v-show="state.studyType === 'Observational'"
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Bio Specification
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField label="Retention" name="bioSpecRetention">
              <USelect
                v-model="state.bioSpecRetention"
                class="w-full"
                placeholder="None Retained"
                :items="FORM_JSON.studyMetadataBioSpecRetentionOptions"
              />
            </UFormField>

            <UFormField label="Description" name="bioSpecDescription">
              <UTextarea
                v-model="state.bioSpecDescription"
                class="w-full"
                placeholder="Lorem ipsum dolor sit amet"
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
                Enrollment Information
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField
              label="Total number of participants to be enrolled"
              name="enrollmentCount"
            >
              <UInput
                v-model="state.enrollmentCount"
                class="w-full"
                placeholder="100"
                type="number"
              />
            </UFormField>

            <UFormField label="Type of enrollment" name="enrollmentType">
              <USelect
                v-model="state.enrollmentType"
                class="w-full"
                placeholder="Anticipated"
                :items="FORM_JSON.studyMetadataEnrollmentTypeOptions"
              />
            </UFormField>

            <UFormField
              v-show="state.studyType === 'Interventional'"
              label="Number of Arms"
              name="numberOfArms"
            >
              <UInput
                v-model="state.numberOfArms"
                class="w-full"
                placeholder="1"
                type="number"
              />
            </UFormField>

            <div
              v-show="state.studyType === 'Observational'"
              class="flex w-full gap-4"
            >
              <UFormField
                v-show="state.studyType === 'Observational'"
                label="Target duration value"
                name="targetDuration"
                class="w-full"
              >
                <UInput
                  v-model="state.targetDuration"
                  class="w-full"
                  type="number"
                  placeholder="1"
                />
              </UFormField>

              <UFormField
                label="Target duration unit"
                name="targetDurationUnit"
                class="w-full"
              >
                <USelect
                  v-model="state.targetDurationUnit"
                  class="w-full"
                  placeholder="Days"
                  :items="FORM_JSON.studyMetadataTargetDurationUnitOptions"
                />
              </UFormField>
            </div>
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
