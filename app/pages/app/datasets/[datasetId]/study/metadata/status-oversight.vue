<script setup lang="ts">
import * as z from "zod";
import { toRaw } from "vue";
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
  fda_regulated_device: z.string().min(1, "FDA Regulated Device is required."),
  fda_regulated_drug: z.string().min(1, "FDA Regulated Drug is required."),
  has_dmc: z.string().min(1, "Has DMC is required."),
  human_subject_review_status: z
    .string()
    .min(1, "Human Subject Review Status is required."),
  overallStatus: z.string().min(1, "Overall status is required"),
  startDate: z.string().min(1, "Start date is required"),
  startDateType: z.string().min(1, "Start date type is required"),
  whyStopped: z.string(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  completionDate: "",
  completionDateType: "",
  fda_regulated_device: "",
  fda_regulated_drug: "",
  has_dmc: "",
  human_subject_review_status: "",
  overallStatus: "",
  startDate: "",
  startDateType: "",
  whyStopped: "",
});

const yesNoOptions = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

function normalize(value: string | null | undefined): string {
  if (!value) return "";

  return (
    value.trim().charAt(0).toUpperCase() + value.trim().slice(1).toLowerCase()
  );
}

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/status-oversight`,
  {},
);

watch(
  () => state.startDate,
  (newDate) => {
    if (newDate) {
      state.startDateType = dayjs(newDate).isAfter(dayjs(), "day")
        ? "Anticipated"
        : "Actual";
    }
  },
);

watch(
  () => state.completionDate,
  (newDate) => {
    if (newDate) {
      state.completionDateType = dayjs(newDate).isAfter(dayjs(), "day")
        ? "Anticipated"
        : "Actual";
    }
  },
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

  state.human_subject_review_status = normalize(
    data.value.StudyOversight?.humanSubjectReviewStatus,
  );
  state.fda_regulated_drug = normalize(
    data.value.StudyOversight?.fdaRegulatedDrug,
  );
  state.fda_regulated_device = normalize(
    data.value.StudyOversight?.fdaRegulatedDevice,
  );
  state.has_dmc = normalize(data.value.StudyOversight?.hasDmc);
}

// Wait for the date watchers to run so that they don't mark the form as dirty
nextTick(() => {
  originalStateString.value = JSON.stringify(toRaw(state));
});

const isDirty = computed(() => {
  return JSON.stringify(toRaw(state)) !== originalStateString.value;
});

const { showLeaveModal, confirmLeave, cancelLeave } = useUnsavedChangesGuard({
  isDirty,
  isSubmitting,
});

const validate = (state: any): FormError[] => {
  const errors = [];
  const statusValues = FORM_JSON.studyMetadataStatusOptions.map(
    (option) => option.value,
  );
  const reviewStatusValues =
    FORM_JSON.studyMetadataHumanSubjectReviewStatusOptions.map(
      (option) => option.value,
    );

  if (!state.overallStatus) {
    errors.push({
      name: "overallStatus",
      message: "Overall status is required",
    });
  }

  if (state.overallStatus && !statusValues.includes(state.overallStatus)) {
    errors.push({
      name: "overallStatus",
      message: "Overall status must be a valid option",
    });
  }

  if (
    ["Suspended", "Terminated", "Withdrawn"].includes(state.overallStatus) &&
    !state.whyStopped
  ) {
    errors.push({
      name: "whyStopped",
      message:
        "A valid reason is required when the study is suspended, terminated or withdrawn",
    });
  }

  if (!state.startDate)
    errors.push({ name: "startDate", message: "Start date is required" });
  if (!state.startDateType)
    errors.push({
      name: "startDateType",
      message: "Start date type is required",
    });
  if (!state.completionDate)
    errors.push({
      name: "completionDate",
      message: "Completion date is required",
    });
  if (!state.completionDateType)
    errors.push({
      name: "completionDateType",
      message: "Completion date type is required",
    });

  if (
    !state.human_subject_review_status ||
    state.human_subject_review_status.trim() === ""
  ) {
    errors.push({
      name: "human_subject_review_status",
      message: "Human Subject Review Status is required.",
    });
  } else if (!reviewStatusValues.includes(state.human_subject_review_status)) {
    errors.push({
      name: "human_subject_review_status",
      message: "Invalid Human Subject Review Status.",
    });
  }

  if (!state.fda_regulated_device || state.fda_regulated_device.trim() === "") {
    errors.push({
      name: "fda_regulated_device",
      message: "FDA Regulated Device is required.",
    });
  }

  if (!state.fda_regulated_drug || state.fda_regulated_drug.trim() === "") {
    errors.push({
      name: "fda_regulated_drug",
      message: "FDA Regulated Drug is required.",
    });
  }

  if (!state.has_dmc || state.has_dmc.trim() === "") {
    errors.push({
      name: "has_dmc",
      message: "Has DMC is required.",
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  try {
    await $fetch(`/api/datasets/${datasetId}/study/metadata/status-oversight`, {
      body: {
        oversight: {
          humanSubjectReviewStatus: formData.human_subject_review_status,
          isFDARegulatedDevice: formData.fda_regulated_device,
          isFDARegulatedDrug: formData.fda_regulated_drug,
          oversightHasDMC: formData.has_dmc,
        },
        status: {
          completionDate: formData.completionDate,
          completionDateType: formData.completionDateType,
          overallStatus: formData.overallStatus,
          startDate: formData.startDate,
          startDateType: formData.startDateType,
          whyStopped: formData.whyStopped,
        },
      },
      method: "PUT",
    });

    toast.add({
      title: "Success",
      color: "success",
      description: "Metadata saved successfully.",
    });

    originalStateString.value = JSON.stringify(toRaw(state));
  } catch (err) {
    console.error(err);
    toast.add({
      title: "Error",
      color: "error",
      description: "Failed to save metadata.",
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
          { label: 'Study Metadata' },
          {
            label: 'Status and Oversight',
            to: `/app/datasets/${datasetId}/study/metadata/status-oversight`,
          },
        ]"
      />

      <UForm
        id="study-metadata-status-oversight-form"
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
              Status and Oversight
            </h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Report the current status of this study and its regulatory
            oversight.
          </p>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Status
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Provide the current status of the study and its start and
                completion dates.
              </p>
            </div>

            <UFormField label="Overall Status" name="overallStatus" required>
              <USelect
                v-model="state.overallStatus"
                class="w-full"
                placeholder="Select status"
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
                <UInput v-model="state.startDate" class="w-full" type="date" />
              </UFormField>

              <UFormField
                label="Start Date Type"
                name="startDateType"
                class="w-full"
                required
              >
                <USelect
                  v-model="state.startDateType"
                  placeholder="Select date type"
                  class="w-full"
                  :items="FORM_JSON.studyMetadataEnrollmentTypeOptions"
                />
              </UFormField>
            </div>

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
                  placeholder="Select date type"
                  class="w-full"
                  :items="FORM_JSON.studyMetadataEnrollmentTypeOptions"
                />
              </UFormField>
            </div>
            <UFormField
              v-if="
                state.completionDate &&
                ['Suspended', 'Terminated', 'Withdrawn'].includes(
                  state.overallStatus,
                )
              "
              label="Why Stopped"
              name="whyStopped"
              required
            >
              <UTextarea
                v-model="state.whyStopped"
                class="w-full"
                placeholder="Enrollment stopped early due to a lack of funding."
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
                Oversight
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Provide the ethics review status and regulatory details for the
                study.
              </p>
            </div>

            <UFormField
              label="Human Subject Review Status"
              name="human_subject_review_status"
              required
            >
              <USelect
                v-model="state.human_subject_review_status"
                :items="FORM_JSON.studyMetadataHumanSubjectReviewStatusOptions"
                placeholder="Request not yet submitted"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Is this clinical study studying a drug product?"
              name="fda_regulated_drug"
              required
            >
              <USelect
                v-model="state.fda_regulated_drug"
                :items="yesNoOptions"
                placeholder="No"
                clearable
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Is this clinical study studying a medical device?"
              name="fda_regulated_device"
              required
            >
              <USelect
                v-model="state.fda_regulated_device"
                :items="yesNoOptions"
                placeholder="No"
                clearable
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Does this study have a Data Monitoring Committee (DMC)?"
              name="has_dmc"
              required
            >
              <USelect
                v-model="state.has_dmc"
                :items="yesNoOptions"
                placeholder="No"
                clearable
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute right-0 bottom-0 left-0 z-10 px-6 pt-4 pb-6">
      <UButton
        form="study-metadata-status-oversight-form"
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
