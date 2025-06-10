<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import QUESTIONS_JSON from "~/assets/data/healthsheet/collection.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId, studyId } = route.params as {
  datasetId: string;
  studyId: string;
};

const saveLoading = ref(false);

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
  `/api/studies/${studyId}/datasets/${datasetId}/healthsheet/collection`,
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
    data.value.collection.records.length > 0
      ? data.value.collection.records.map((subject: any) => ({
          id: subject.id,
          question: subject.question,
          response: subject.response,
        }))
      : QUESTIONS_JSON.map((question: any) => ({
          id: question.id,
          question: question.question,
          response: "",
        }));

  state.version = data.value.collection.version;
}

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    records: formData.records,
    version: formData.version,
  };

  await $fetch(
    `/api/studies/${studyId}/datasets/${datasetId}/healthsheet/collection`,
    {
      body: b,
      method: "PUT",
    },
  )
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
        description: "The form has been submitted.",
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
        { label: data?.study.title, to: `/app/study/${studyId}` },
        {
          label: data?.title,
          to: `/app/study/${studyId}/datasets/${datasetId}`,
        },
        {
          label: 'Healthsheet - Collection',
          to: `/app/study/${studyId}/datasets/${datasetId}/healthsheet/collection`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="font-bold text-gray-900 dark:text-white">Collection</h1>
        </div>

        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the dataset is displayed here.
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
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Collection
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please provide motivation information for this dataset.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField
                v-for="record in state.records"
                :key="record.id"
                :label="record.question"
                :name="`records.${record.id}.response`"
              >
                <UTextarea
                  v-model="record.response"
                  placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos."
                  class="w-full"
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
