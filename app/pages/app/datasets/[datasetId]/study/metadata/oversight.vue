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
  fda_regulated_device: z.string().min(1, "FDA Regulated Device is required."),
  fda_regulated_drug: z.string().min(1, "FDA Regulated Drug is required."),
  has_dmc: z.string().min(1, "Has DMC is required."),
  human_subject_review_status: z.string().min(1, "Human Subject Review Status is required."),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  fda_regulated_device: "",
  fda_regulated_drug: "",
  has_dmc: "",
  human_subject_review_status: "",
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
  `/api/datasets/${datasetId}/study/metadata/oversight`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching dataset",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  state.human_subject_review_status = normalize(
    data.value.humanSubjectReviewStatus,
  );
  state.fda_regulated_drug = normalize(data.value.fdaRegulatedDrug);
  state.fda_regulated_device = normalize(data.value.fdaRegulatedDevice);
  state.has_dmc = normalize(data.value.hasDmc);

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
  const enumValues = FORM_JSON.studyMetadataHumanSubjectReviewStatusOptions.map(
    (option) => option.value,
  );

  if (!state.human_subject_review_status || state.human_subject_review_status.trim() === "") {
    errors.push({
      name: "human_subject_review_status",
      message: "Human Subject Review Status is required.",
    });
  } else if (!enumValues.includes(state.human_subject_review_status)) {
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
  const body = {
    humanSubjectReviewStatus: formData.human_subject_review_status,
    isFDARegulatedDevice: formData.fda_regulated_device,
    isFDARegulatedDrug: formData.fda_regulated_drug,
    oversightHasDMC: formData.has_dmc,
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/study/metadata/oversight`, {
      body,
      method: "PUT",
    });
    console.log(res);

    toast.add({
      title: "Success",
      color: "success",
      description: "Metadata saved successfully.",
    });

    originalStateString.value = JSON.stringify(state);
  } catch (err) {
    console.error(err);
    toast.add({ 
      title: "Error", 
      color: "error",
      description: "Failed to save metadata." 
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
            label: 'Oversight',
            to: `/app/datasets/${datasetId}/study/metadata/oversight`,
          },
        ]"
      />

      <UForm
        id="study-metadata-oversight-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Oversight</h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Some basic information about the study is displayed here.
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
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

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pt-4 dark:from-gray-950">
      <UButton
        form="study-metadata-oversight-form"
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