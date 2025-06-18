<script setup lang="ts">
import { z } from "zod";
import { faker } from "@faker-js/faker";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

// Search query and filter variables
const searchQuery = ref("");

const { studyId } = route.params as { studyId: string };

const loading = ref(false);

const { data, error } = await useFetch(`/api/studies/${studyId}/datasets`, {
  method: "GET",
});

if (error.value) {
  toast.add({
    title: "Error fetching datasets",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo("/");
}

if (data.value) {
  useSeoMeta({
    title: data.value.studyTitle,
  });
}

const newDatasetForm = useTemplateRef("newDatasetForm");
const newDatasetSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  type: z.string(),
  version: z.string(),
});
const newDatasetState = reactive({
  title: faker.commerce.productName(),
  description: faker.lorem.sentences(3),
  type: "dataset",
  version: "1.0.0",
});

const onSubmit = async () => {
  loading.value = true;

  await $fetch(`/api/studies/${studyId}/datasets`, {
    body: newDatasetState,
    method: "POST",
  })
    .then((response) => {
      navigateTo(`/app/study/${studyId}/datasets/${response.data.datasetId}`);
    })
    .catch((error) => {
      console.error("Error creating new dataset:", error);
      toast.add({
        title: "Error creating dataset",
        color: "error",
        description: "Please try again later",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.studyTitle, to: `/app/study/${studyId}` },
        {
          label: 'Datasets',
          to: `/app/study/${studyId}/datasets`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Datasets
          </h1>

          <p class="text-lg font-normal">
            Manage and explore your research datasets
          </p>
        </div>

        <USlideover side="right" title="Create New Dataset">
          <UButton color="primary" size="xl" icon="heroicons-outline:plus">
            New Dataset
          </UButton>

          <template #body>
            <div>
              <UForm
                ref="newDatasetForm"
                :schema="newDatasetSchema"
                :state="newDatasetState"
                class="space-y-4"
                @submit="onSubmit"
              >
                <UFormField label="Title" name="title">
                  <UInput v-model="newDatasetState.title" type="text" />
                </UFormField>

                <UFormField label="Description" name="description">
                  <UInput v-model="newDatasetState.description" type="text" />
                </UFormField>

                <UFormField label="Type" name="type">
                  <UInput v-model="newDatasetState.type" type="text" />
                </UFormField>

                <UFormField label="Version" name="version">
                  <UInput v-model="newDatasetState.version" type="text" />
                </UFormField>
              </UForm>
            </div>
          </template>

          <template #footer>
            <div class="flex justify-end p-2">
              <UButton
                color="primary"
                size="lg"
                :loading="loading"
                icon="heroicons-outline:plus"
                @click="newDatasetForm?.submit()"
              >
                Create Dataset
              </UButton>
            </div>
          </template>
        </USlideover>
      </div>

      <!-- Controls & Filtering -->
      <div class="flex gap-4">
        <UInput
          v-model="searchQuery"
          type="text"
          placeholder="Search datasets..."
          size="lg"
        />
      </div>

      <!-- Datasets Grid -->
      <div class="flex flex-col gap-3">
        <NuxtLink
          v-for="dataset in data?.datasets"
          :key="dataset.id"
          :to="`/app/study/${studyId}/datasets/${dataset.id}`"
        >
          <UCard class="transition-all hover:shadow-md">
            <template #header>
              <div class="flex w-full items-center justify-between gap-3">
                <div class="flex w-full flex-col gap-2">
                  <h2>
                    {{ dataset.title }}
                  </h2>
                </div>

                <UButton
                  color="primary"
                  icon="heroicons-outline:arrow-up-tray"
                  label="Publish this dataset"
                  variant="outline"
                />
              </div>
            </template>

            <p>
              {{ dataset.description }}
            </p>

            <USeparator class="my-3" />

            <div class="flex w-full items-center justify-between gap-2 text-sm">
              <div class="flex items-center gap-2 text-sm">
                <p>Updated: {{ displayDateDifference(dataset.updated) }} ago</p>

                <USeparator orientation="vertical" class="h-3" />

                <p>Created: {{ displayDateDifference(dataset.created) }} ago</p>
              </div>

              <div class="flex items-center gap-2">
                <UBadge color="primary" size="sm" variant="subtle">
                  In Progress
                </UBadge>

                <UBadge color="success" size="sm" variant="subtle">
                  Published
                </UBadge>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
