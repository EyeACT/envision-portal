<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";
import { UTextarea } from "#components";

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

  state.overallStatus = data.value.StudyStatus?.overallStatus ?? "";
  state.startDate = data.value.StudyStatus?.startDate ?? "";
  state.startDateType = data.value.StudyStatus?.startDateType ?? "";
  state.completionDate = data.value.StudyStatus?.completionDate ?? "";
  state.completionDateType = data.value.StudyStatus?.completionDateType ?? "";
  state.whyStopped = data.value.StudyStatus?.whyStopped ?? "";
}

const validate = (state: any): FormError[] => {
  const errors = [];

  if (!state.overallStatus) {
    errors.push({
      name: "overallStatus",
      message: "Overall status is required",
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

  const formData = event.data;

  const b = {
    completionDate: formData.completionDate,
    completionDateType: formData.completionDateType,
    overallStatus: formData.overallStatus,
    startDate: formData.startDate,
    startDateType: formData.startDateType,
    whyStopped: formData.whyStopped,
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
                Status
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField label="Overall Status" name="overallStatus">
              <USelect
                v-model="state.overallStatus"
                class="w-full"
                placeholder="Recruiting"
                :items="FORM_JSON.studyMetadataStatusOptions"
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField label="Start Date" name="startDate" class="w-full">
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
              >
                <USelect
                  v-model="state.startDateType"
                  class="w-full"
                  placeholder="Actual"
                  :items="FORM_JSON.studyMetadataEnrollmentTypeOptions"
                />
              </UFormField>
            </div>

            <UFormField label="Why Stopped" name="whyStopped">
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
