<script setup lang="ts">
  import dayjs from "dayjs";

  definePageMeta({
    layout: "public",
  });

  const toast = useToast();

  const { data: datasets, error } = await useFetch(`/api/datasets`);

  if (error.value) {
    toast.add({
      title: "Error fetching datasets",
      description: "Please try again later",
      icon: "material-symbols:error",
    });
  }

  const getDaysAgo = (date: string): string => {
    const daysAgo = dayjs().diff(dayjs(date), "day");
    return daysAgo === 0 ? "Today" : `${daysAgo} days ago`;
  };
</script>

<template>
  <div>
    <UContainer>
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
            { label: 'Home', to: '/' },
            { label: 'All Datasets', to: '/datasets' },
            ]"
      />
      <div class="flex flex-col gap-4 pt-2">
        <NuxtLink v-for="dataset in datasets" :key="dataset.id" :to="`/datasets/${dataset.id}`">
          <UCard class="transition-all hover:shadow-lg p-2 rounded-lg border border-gray-200 bg-white">
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold text-blue-400">
                  Brain MRI Dataset
                </h2>
                <UBadge color="primary" variant="outline">
                  v1.2
                </UBadge>
              </div>
              <p class="text-xxs text-gray-500 mt-1">
                Published by <span class="font-medium">Clami2</span> on
                <time datetime="2024-03-12">March 12, 2024</time>
                (10 days ago)
              </p>
            </template>

            <div class="space-y-4">
              <p class="text-sm text-gray-500">
                A dataset containing brain MRI scans for pain detection research.
              </p>
              <div>
                <h3 class="text-md font-semibold text-gray-500">Keywords:</h3>
                <div class="flex gap-2">
                  <UBadge v-for="keyword in dataset.keywords" :key="keyword" variant="outline" class="text-xs">
                    {{ keyword }}
                  </UBadge>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-4 text-xxs text-gray-700">
                <p class="flex items-center gap-1"><Icon name="charm:person" size="15" />Contributors: {{ dataset.contributors }}</p>
                <p class="flex items-center gap-1"><Icon name="mdi:label" size="15" />Labeling Method: {{ dataset.labelingMethod }}</p>
                <p class="flex items-center gap-1"><Icon name="mdi:check-circle" size="15" />Validation Info: {{ dataset.validationInfo }}</p>
                <p class="flex items-center gap-1"><Icon name="mdi:file-document" size="15" />License: {{ dataset.license }}</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </UContainer>
  </div>
</template>
