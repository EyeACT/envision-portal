<script setup lang="ts">
import { MdEditor } from "md-editor-v3";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as {
  datasetId: string;
};

const submitLoading = ref(false);
const text = ref("# Hello Editor");

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/changelog`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching dataset changelog",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo(`/app/datasets/${datasetId}`);
}

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  text.value = data.value.changelog;
}

const onSubmit = async () => {
  submitLoading.value = true;

  await $fetch(`/api/datasets/${datasetId}/changelog`, {
    body: { changelog: text.value },
    method: "PUT",
  })
    .then(() => {
      toast.add({
        title: "Changelog saved",
        description: "Your changelog has been saved",
      });
    })
    .catch((error) => {
      console.error("Error saving changelog:", error);
      toast.add({
        title: "Error saving changelog",
        description: "Please try again later",
      });
    })
    .finally(() => {
      submitLoading.value = false;
    });
};
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.title, to: `/app/datasets/${datasetId}` },
        {
          label: 'Changelog',
          to: `/app/datasets/${datasetId}/changelog`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Changelog
            </h1>

            <p class="text-lg font-normal">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
              quos.
            </p>
          </div>
        </div>
      </div>

      <MdEditor v-model="text" language="en-US" />

      <UButton
        type="button"
        :disabled="submitLoading"
        :loading="submitLoading"
        class="w-full"
        size="lg"
        label="Save Changelog"
        icon="i-lucide-save"
        @click="onSubmit"
      />
    </div>
  </div>
</template>
