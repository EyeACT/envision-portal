<script setup lang="ts">
import { z } from "zod";
import { faker } from "@faker-js/faker";

definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Dashboard",
});

const toast = useToast();

// Search query and filter variables
const searchQuery = ref("");

// User session + study management variables
const loading = ref(false);

const { data: datasets, error } = await useFetch("/api/datasets", {
  method: "GET",
});

if (error.value) {
  toast.add({
    title: "Error fetching datasets",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

const newDatasetForm = useTemplateRef("newDatasetForm");
const newDatasetSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  type: z.string().optional(),
  version: z.string().optional(),
});
const newDatasetState = reactive({
  title: faker.commerce.productName(),
  description: faker.lorem.sentences(3),
  imageUrl: faker.image.url(),
  type: "Dataset",
  version: "1.0.0",
});

const openNewVersionModal = (datasetId: string) => {
  const dataset = datasets.value?.find((d) => d.id === datasetId);

  newDatasetState.version = "";
  newDatasetState.title = dataset?.title ?? "";
  newDatasetState.description = dataset?.description ?? "";
  newDatasetState.imageUrl = dataset?.imageUrl ?? "";
  newDatasetState.type = dataset?.type ?? "";
};

const onSubmit = async () => {
  loading.value = true;

  await $fetch("/api/datasets", {
    body: newDatasetState,
    method: "POST",
  })
    .then((response) => {
      navigateTo(`/app/datasets/${response.data.datasetId}`);
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

const createNewVersion = async (datasetId: string) => {
  loading.value = true;

  await $fetch(`/api/datasets/${datasetId}/new-version`, {
    body: {
      id: datasetId,
      version: newDatasetState.version,
    },
    method: "POST",
  })
    .then((response) => {
      navigateTo(`/app/datasets/${response.data.datasetId}`);
    })
    .catch((error) => {
      console.error("Error creating new version:", error);
      toast.add({
        title: "Error creating new version",
        description: "Please try again later",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      loading.value = false;
    });
};

const dropdownItems = ref([
  {
    icon: "i-lucide-user",
    label: "Profile",
  },
  {
    icon: "i-lucide-credit-card",
    label: "Billing",
  },
  {
    icon: "i-lucide-cog",
    label: "Settings",
  },
]);
</script>

<template>
  <div>
    <div class="flex w-full flex-col gap-6">
      <div
        class="flex flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            My Datasets
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

                <!-- New Banner Image Field -->
                <UFormField label="Banner Image URL" name="imageUrl">
                  <!-- Accepts only JPEG and PNG -->
                  <UInput v-model="newDatasetState.imageUrl" type="href" />
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

        <UDropdownMenu
          :items="dropdownItems"
          :content="{
            align: 'end',
            side: 'bottom',
            sideOffset: 8,
          }"
          :ui="{
            content: 'w-48',
          }"
        >
          <UButton
            label="Filter"
            icon="material-symbols:filter-list"
            color="primary"
            variant="outline"
          />
        </UDropdownMenu>
      </div>

      <!-- Datasets Grid -->
      <div class="mb-5 flex flex-col gap-3">
        <ULink
          v-for="dataset in datasets"
          :key="dataset.id"
          :to="`/app/datasets/${dataset.id}`"
          :disabled="dataset.status === 'published'"
        >
          <UCard
            class="transition-shadow hover:shadow-md"
            :class="dataset.status === 'published' ? 'hover:shadow-none' : ''"
          >
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-primary-500">
                  {{ dataset.title }}
                </h2>

                <UModal
                  title="Create a new version"
                  description="Do you want to clone this dataset to create a new version? "
                >
                  <template #body>
                    <div class="flex flex-col gap-4">
                      <UAlert
                        title="Are you sure?"
                        description="This will create an entry that you can edit and publish later. Any files that are already published will be copied to the new version."
                        color="warning"
                        variant="subtle"
                      />

                      <UFormField
                        label="Version"
                        name="version"
                        description="The version number of the new dataset"
                      >
                        <UInput v-model="newDatasetState.version" type="text" />
                      </UFormField>

                      <UButton
                        label="Create a new version"
                        color="primary"
                        variant="solid"
                        icon="heroicons-outline:plus"
                        :disabled="!newDatasetState.version"
                        :loading="loading"
                        @click="createNewVersion(dataset.id)"
                      />
                    </div>
                  </template>

                  <UButton
                    v-if="dataset.status === 'published'"
                    color="primary"
                    variant="outline"
                    label="Create a new version"
                    icon="heroicons-outline:plus"
                    size="sm"
                    @click.stop.prevent="openNewVersionModal(dataset.id)"
                  />
                </UModal>

                <!-- <UAvatar :src="dataset.imageUrl" size="lg" class="rounded-md" /> -->
              </div>
            </template>

            <p class="text-default">
              {{ dataset.description }}
            </p>

            <USeparator class="my-3" />

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm">
                <p v-if="dataset.doi">DOI: {{ dataset.doi }}</p>

                <USeparator
                  v-if="dataset.doi"
                  orientation="vertical"
                  class="h-3"
                />

                <p>
                  Updated:
                  {{ displayDateDifference(dataset.updated) }} ago
                </p>

                <USeparator orientation="vertical" class="h-3" />

                <p>Created: {{ displayDateDifference(dataset.created) }} ago</p>
              </div>

              <UBadge
                :color="dataset.status === 'draft' ? 'warning' : 'success'"
                variant="subtle"
                size="lg"
                class="capitalize"
              >
                {{ dataset.status }}
              </UBadge>
            </div>
          </UCard>
        </ULink>
      </div>
    </div>
  </div>
</template>
