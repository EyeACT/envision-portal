<script setup lang="ts">
import { ref, reactive, onBeforeMount } from "vue";
import FORM_JSON from "~/assets/data/form.json";

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };

const state = reactive({
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

async function fetchData() {
  try {
    const res = await fetch(`/api/studies/${studyId}/metadata/oversight`);

    if (!res.ok) throw new Error("Failed to fetch metadata");
    const data = await res.json();

    state.human_subject_review_status = normalize(
      data.humanSubjectReviewStatus,
    );
    state.fda_regulated_drug = normalize(data.fdaRegulatedDrug);
    state.fda_regulated_device = normalize(data.fdaRegulatedDevice);
    state.has_dmc = normalize(data.hasDmc);
  } catch (err) {
    console.error(err);
    toast.add({ title: "Error", description: "Failed to fetch metadata." });
  }
}

async function onSubmit() {
  loading.value = true;
  try {
    const res = await fetch(`/api/studies/${studyId}/metadata/oversight`, {
      body: JSON.stringify({
        humanSubjectReviewStatus: state.human_subject_review_status,
        isFDARegulatedDevice: state.fda_regulated_device,
        isFDARegulatedDrug: state.fda_regulated_drug,
        oversightHasDMC: state.has_dmc,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });

    if (!res.ok)
      throw new Error(
        `[PUT] "/api/studies/${studyId}/metadata/oversight": ${res.statusText}`,
      );

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

onBeforeMount(() => {
  fetchData();
});
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'Study Title', to: `/app/study/${studyId}` },
        {
          label: 'Metadata',
        },
        {
          label: 'Oversight',
          to: `/app/study/${studyId}/metadata/oversight`,
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
        :state="state"
        class="flex flex-col gap-6"
        @submit.prevent="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <UFormField label="Human Subject Review Status">
              <USelect
                v-model="state.human_subject_review_status"
                :items="FORM_JSON.studyMetadataHumanSubjectReviewStatusOptions"
                placeholder="Request not yet submitted"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Is this clinical study studying a drug product?">
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
