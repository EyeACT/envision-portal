<script setup lang="ts">
import { ref, reactive } from "vue";
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as { datasetId: string };

const schema = z.object({
  fda_regulated_device: z.string(),
  fda_regulated_drug: z.string(),
  has_dmc: z.string(),
  human_subject_review_status: z.string(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  fda_regulated_device: "",
  fda_regulated_drug: "",
  has_dmc: "",
  human_subject_review_status: "",
});

const loading = ref(false);

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

  await navigateTo("/");
}

if (data.value) {
  state.human_subject_review_status = normalize(
    data.value.humanSubjectReviewStatus,
  );
  state.fda_regulated_drug = normalize(data.value.fdaRegulatedDrug);
  state.fda_regulated_device = normalize(data.value.fdaRegulatedDevice);
  state.has_dmc = normalize(data.value.hasDmc);
}

const validate = (state: any): FormError[] => {
  const errors = [];
  const enumValues = FORM_JSON.studyMetadataHumanSubjectReviewStatusOptions.map(
    (option) => option.value,
  );

  if (state.human_subject_review_status.trim() === "") {
    errors.push({
      name: "human_subject_review_status",
      message: "Human Subject Review Status is required.",
    });
  }

  if (
    state.human_subject_review_status.trim() !== "" &&
    !enumValues.includes(state.human_subject_review_status)
  ) {
    errors.push({
      name: "human_subject_review_status",
      message: "Invalid Human Subject Review Status.",
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  loading.value = true;

  const formData = event.data;
  const body = {
    humanSubjectReviewStatus: formData.human_subject_review_status,
    isFDARegulatedDevice: formData.fda_regulated_device,
    isFDARegulatedDrug: formData.fda_regulated_drug,
    oversightHasDMC: formData.has_dmc,
  };

  try {
    const res = await fetch(
      `/api/datasets/${datasetId}/study/metadata/oversight`,
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      },
    );

    if (!res.ok) {
      throw new Error(
        `[PUT] "/api/datasets/${datasetId}/study/metadata/oversight": ${res.statusText}`,
      );
    }

    toast.add({
      title: "Success",
      description: "Metadata saved successfully.",
    });
  } catch (err) {
    console.error(err);
    toast.add({ title: "Error", description: "Failed to save metadata." });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
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

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Oversight
          </h1>
        </div>

        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
        </p>
      </div>

      <UForm
        :validate="validate"
        :state="state"
        class="flex flex-col gap-6"
        @submit.prevent="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
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

        <UButton type="submit" :loading="loading" class="w-1/10 text-center">
          <template #icon>
            <UIcon name="i-heroicons-check-circle" />
          </template>
          Save Metadata
        </UButton>
      </UForm>
    </div>
  </div>
</template>
