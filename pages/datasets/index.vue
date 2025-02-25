<script setup lang="ts">
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

  // await navigateTo("/datasets");
}
</script>

<template>
  <div>
    <UContainer>
      <UBreadcrumb
        class="mb-4"
        :items="[
          { label: 'Home', to: '/' },
          { label: 'All Datasets', to: '/datasets' },
        ]"
      />

      <div class="flex flex-col gap-6 pt-10">
        <NuxtLink
          v-for="dataset in datasets"
          :key="dataset.id"
          :to="`/datasets/${dataset.id}`"
        >
          <UCard class="transition-all hover:shadow-md">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h2>
                  {{ dataset.title }}
                </h2>

                <UBadge color="primary" variant="outline">
                  {{ dataset.versionTitle }}
                </UBadge>
              </div>
            </template>

            <div class="flex flex-col gap-3">
              <p class="text-sm text-gray-500">
                {{ dataset.description }}
              </p>
            </div>

            <template #footer>
              <div class="flex items-center justify-end gap-3">
                <div>
                  Published on
                  {{ $dayjs(dataset.created).format("MMMM D, YYYY") }}
                </div>
              </div>
            </template>
          </UCard>
        </NuxtLink>
      </div>
    </UContainer>
  </div>
</template>
