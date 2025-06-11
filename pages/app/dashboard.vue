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

const { data: studies, error } = await useFetch("/api/studies", {
  method: "GET",
});

if (error.value) {
  toast.add({
    title: "Error fetching studies",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

const newStudyForm = useTemplateRef("newStudyForm");
const newStudySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});
const newStudyState = reactive({
  title: faker.commerce.productName(),
  description: faker.lorem.sentences(3),
  imageUrl: faker.image.url(),
});

const onSubmit = async () => {
  loading.value = true;

  await $fetch("/api/studies", {
    body: newStudyState,
    method: "POST",
  })
    .then((response) => {
      navigateTo(`/app/study/${response.data.studyId}`);
    })
    .catch((error) => {
      console.error("Error creating new study:", error);
      toast.add({
        title: "Error creating study",
        color: "error",
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
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/app/dashboard' },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            My Studies
          </h1>

          <p class="text-lg font-normal">
            Manage and explore your research studies
          </p>
        </div>

        <USlideover side="right" title="Create New Study">
          <UButton color="primary" size="xl" icon="heroicons-outline:plus">
            New Study
          </UButton>

          <template #body>
            <div>
              <UForm
                ref="newStudyForm"
                :schema="newStudySchema"
                :state="newStudyState"
                class="space-y-4"
                @submit="onSubmit"
              >
                <UFormField label="Title" name="title">
                  <UInput v-model="newStudyState.title" type="text" />
                </UFormField>

                <UFormField label="Description" name="description">
                  <UInput v-model="newStudyState.description" type="text" />
                </UFormField>

                <!-- New Banner Image Field -->
                <UFormField label="Banner Image URL" name="imageUrl">
                  <!-- Accepts only JPEG and PNG -->
                  <UInput v-model="newStudyState.imageUrl" type="href" />
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
                @click="newStudyForm?.submit()"
              >
                Create Study
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
          placeholder="Search studies..."
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

      <!-- Studies Grid -->
      <div class="flex flex-col gap-3">
        <NuxtLink
          v-for="study in studies"
          :key="study.id"
          :to="`/app/study/${study.id}`"
        >
          <UCard class="transition-all hover:shadow-md">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h2>
                  {{ study.title }}
                </h2>

                <UAvatar :src="study.imageUrl" size="lg" class="rounded-md" />
              </div>
            </template>

            <p>
              {{ study.StudyDescription?.briefSummary }}
            </p>

            <USeparator class="my-3" />

            <div class="flex items-center gap-2 text-sm">
              <p>
                Updated:
                {{ displayDateDifference(study.updated) }} ago
              </p>

              <USeparator orientation="vertical" class="h-3" />

              <p>Created: {{ displayDateDifference(study.created) }} ago</p>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
