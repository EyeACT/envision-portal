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
  completionDate: z.string(),
  completionDateType: z.string(),
  overallStatus: z.string(),
  startDate: z.string(),
  startDateType: z.string(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  completionDate: "",
  completionDateType: "",
  overallStatus: "",
  startDate: "",
  startDateType: "",
});

const { data, error } = await useFetch(
  `/api/studies/${studyId}/metadata/status`,
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

  state.overallStatus = data.value.StudyStatus?.overallStatus || "";
  state.startDate = data.value.StudyStatus?.startDate || "";
  state.startDateType = data.value.StudyStatus?.startDateType || "";
  state.completionDate = data.value.StudyStatus?.completionDate || "";
  state.completionDateType = data.value.StudyStatus?.completionDateType || "";
}

const validate = (state: any): FormError[] => {
  const errors = [];

  if (!state.overallStatus) {
    errors.push({ name: "overallStatus", message: "This field is required" });
  }

  if (!state.startDate) {
    errors.push({ name: "startDate", message: "This field is required" });
  }

  if (!state.startDateType) {
    errors.push({ name: "startDateType", message: "This field is required" });
  }

  if (!state.completionDate) {
    errors.push({ name: "completionDate", message: "This field is required" });
  }

  if (!state.completionDateType) {
    errors.push({
      name: "completionDateType",
      message: "This field is required",
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    completionDate: formData.completionDate,
    completionDateType: formData.completionDateType,
    overallStatus: formData.overallStatus,
    startDate: formData.startDate,
    startDateType: formData.startDateType,
  };

  await $fetch(`/api/studies/${studyId}/metadata/status`, {
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
        description: "Something went wrong.",
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
        { label: 'Home', to: '/' },
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
          Some basic information about the status of the study is displayed
          here.
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
            <UFormField label="Overall Status" name="overallStatus">
              <USelect
                v-model="state.overallStatus"
                class="w-full"
                placeholder="Completed"
                :items="FORM_JSON.studyMetadataStatusOptions"
              />
            </UFormField>

            <UFormField label="Start Date" name="startDate">
              <UInput v-model="state.startDate" type="date" />
            </UFormField>

            <UFormField label="Start Date Type" name="startDateType">
              <USelect
                v-model="state.startDateType"
                class="w-full"
                placeholder="Actual"
                :items="FORM_JSON.studyMetadataEnrollmentTypeOptions"
              />
            </UFormField>

            <UFormField label="Completion Date" name="completionDate">
              <UInput v-model="state.completionDate" type="date" />
            </UFormField>

            <UFormField label="Completion Date Type" name="completionDateType">
              <USelect
                v-model="state.completionDateType"
                class="w-full"
                placeholder="Actual"
                :items="FORM_JSON.studyMetadataEnrollmentTypeOptions"
              />
            </UFormField>
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

      {{ state }}
    </div>
  </div>
</template>
