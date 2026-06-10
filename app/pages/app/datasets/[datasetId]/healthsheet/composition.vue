<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import QUESTIONS_JSON from "~/assets/data/healthsheet/composition.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as {
  datasetId: string;
};

const saveLoading = ref(false);
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  records: z.array(
    z.object({
      id: z.number(),
      question: z.string(),
      response: z.string(),
    }),
  ),
  version: z.number(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  records: [],
  version: 1,
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/healthsheet/composition`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching healthsheet",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  state.records =
    data.value.composition.records.length > 0
      ? data.value.composition.records.map((subject: any) => ({
          id: subject.id,
          question: subject.question,
          response: subject.response,
        }))
      : QUESTIONS_JSON.map((question: any) => ({
          id: question.id,
          question: question.question,
          response: "",
        }));

  state.version = data.value.composition.version;

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
  const errors: FormError[] = [];

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    records: formData.records,
    version: formData.version,
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/healthsheet/composition`, {
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
            label: 'Healthsheet - Composition',
            to: `/app/datasets/${datasetId}/healthsheet/composition`,
          },
        ]"
      />

      <UForm
        id="healthsheet-composition-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Composition</h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Some basic information about the dataset is displayed here.
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Composition
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Please provide motivation information for this dataset.
              </p>
            </div>

            <div class="flex flex-col gap-5">
              <UFormField
                v-for="(record, index) in state.records"
                :key="record.id"
                :label="record.question"
                :name="`records[${index}].response`"
              >
                <UTextarea
                  v-model="record.response"
                  placeholder="Provide details for this question entry..."
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pt-4 dark:from-gray-950">
      <UButton
        form="healthsheet-composition-form"
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