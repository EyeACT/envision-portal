<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();
const dayjs = useDayjs();

const { datasetId } = route.params as { datasetId: string };

const saveLoading = ref(false);
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  completionDate: z.string().min(1, "Completion date is required"),
  completionDateType: z.string().min(1, "Completion date type is required"),
  overallStatus: z.string().min(1, "Overall status is required"),
  startDate: z.string().min(1, "Start date is required"),
  startDateType: z.string().min(1, "Start date type is required"),
  whyStopped: z.string(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  completionDate: "",
  completionDateType: "",
  overallStatus: "",
  startDate: "",
  startDateType: "",
  whyStopped: "",
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/status`,
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

  state.overallStatus = data.value.StudyStatus?.overallStatus ?? "";
  state.startDate = data.value.StudyStatus?.startDate
    ? dayjs(data.value.StudyStatus?.startDate).format("YYYY-MM-DD")
    : "";
  state.startDateType = data.value.StudyStatus?.startDateType ?? "";
  state.completionDate = data.value.StudyStatus?.completionDate
    ? dayjs(data.value.StudyStatus?.completionDate).format("YYYY-MM-DD")
    : "";
  state.completionDateType = data.value.StudyStatus?.completionDateType ?? "";
  state.whyStopped = data.value.StudyStatus?.whyStopped ?? "";

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
  const enumValues = FORM_JSON.studyMetadataStatusOptions.map(
    (option) => option.value,
  );

  if (!state.overallStatus) {
    errors.push({
      name: "overallStatus",
      message: "Overall status is required",
    });
  }

  if (state.overallStatus && !enumValues.includes(state.overallStatus)) {
    errors.push({
      name: "overallStatus",
      message: "Overall status must be a valid option",
    });
  }

  if (
    state.overallStatus === "Suspended" ||
    state.overallStatus === "Terminated" ||
    state.overallStatus === "Withdrawn"
  ) {
    if (!state.whyStopped) {
      errors.push({
        name: "whyStopped",
        message:
          "A valid reason is required when the study is suspended, terminated or withdrawn",
      });
    }
  }

  if (!state.startDate) {
    errors.push({
      name: "startDate",
      message: "Start date is required",
    });
  }

  if (!state.startDateType) {
    errors.push({
      name: "startDateType",
      message: "Start date type is required",
    });
  }

  if (!state.completionDate) {
    errors.push({
      name: "completionDate",
      message: "Completion date is required",
    });
  }

  if (!state.completionDateType) {
    errors.push({
      name: "completionDateType",
      message: "Completion date type is required",
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    completionDate: formData.completionDate,
    completionDateType: formData.completionDateType,
    overallStatus: formData.overallStatus,
    startDate: formData.startDate,
    startDateType: formData.startDateType,
    whyStopped: formData.whyStopped,
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/study/metadata/status`, {
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
            label: 'Study Metadata',
          },
          {
            label: 'Status',
            to: `/app/datasets/${datasetId}/study/metadata/status`,
          },
        ]"
      />

      <UForm
        id="study-metadata-status-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Status</h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Some basic information about the study is displayed here.
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">Status</h2>
              <p class="text-gray-500 dark:text-gray-400">
                Please review and modify the execution parameters and structural updates of the clinical trial.
              </p>
            </div>

            <UFormField label="Overall Status" name="overallStatus" required>
              <USelect
                v-model="state.overallStatus"
                class="w-full"
                placeholder="Recruiting"
                :items="FORM_JSON.studyMetadataStatusOptions"
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField
                label="Start Date"
                name="startDate"
                class="w-full"
                required
              >
                <UInput
                  v-model="state.startDate"
                  class="w-full"
                  type="date"
                  placeholder="1"
                />
              </UFormField>

              <UFormField
                label="Start Date Type"
                name="startDateType"
                class="w-full"
                required
              >
                <USelect
                  v-model="state.startDateType"
                  class="w-full"
                  placeholder="Actual"
                  :items="FORM_JSON.studyMetadataEnrollmentTypeOptions"
                />
              </UFormField>
            </div>

            <UFormField
              label="Why Stopped"
              name="whyStopped"
              :required="
                state.overallStatus === 'Suspended' ||
                state.overallStatus === 'Terminated' ||
                state.overallStatus === 'Withdrawn'
              "
            >
              <UTextarea
                v-model="state.whyStopped"
                class="w-full"
                placeholder="Enter a reason for stopping the study."
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField
                label="Completion Date"
                name="completionDate"
                class="w-full"
                required
              >
                <UInput
                  v-model="state.completionDate"
                  class="w-full"
                  type="date"
                  placeholder="1"
                />
              </UFormField>

              <UFormField
                label="Completion Date Type"
                name="completionDateType"
                class="w-full"
                required
              >
                <USelect
                  v-model="state.completionDateType"
                  class="w-full"
                  placeholder="Actual"
                  :items="FORM_JSON.studyMetadataEnrollmentTypeOptions"
                />
              </UFormField>
            </div>
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pt-4 dark:from-gray-950">
      <UButton
        form="study-metadata-status-form"
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