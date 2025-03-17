<script setup lang="ts">
import { z } from "zod";
import { faker } from "@faker-js/faker";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };

const loading = ref(false);

const { data, error } = await useFetch(`/api/studies/${studyId}/datasets`, {});

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
      :dropdown-items="[
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'My Studies', to: '/app/dashboard/studies' },
        {
          label: 'My Datasets',
          to: `/app/dashboard/studies/${studyId}/datasets`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div>
          <h1>Datasets</h1>

          <p>Manage your datasets</p>
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

      <div class="flex flex-col gap-3">
        <NuxtLink
          v-for="dataset in data?.datasets"
          :key="dataset.id"
          :to="`/app/study/${studyId}/datasets/${dataset.id}`"
          class="tranistion-all hover:shadow-md"
        >
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h2>
                  {{ dataset.title }}
                </h2>
              </div>
            </template>

            <p>
              {{ dataset.description }}
            </p>

            <USeparator class="my-3" />

            <div class="flex items-center gap-2 text-sm">
              <p>Updated: {{ $dayjs(dataset.updated).fromNow() }}</p>

              <USeparator orientation="vertical" class="h-3" />

              <p>Created: {{ $dayjs(dataset.created).fromNow() }}</p>
            </div>
          </UCard>
        </NuxtLink>

        <pre>{{ data }}</pre>
      </div>
    </div>
  </div>
</template>
