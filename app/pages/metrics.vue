<script setup lang="ts">

const ogImage = `https://kalai.fairdataihub.org/api/generate?title=${encodeURIComponent("Metrics - Envision Portal")}&description=${encodeURIComponent("Usage and growth metrics for the Envision Portal platform")}&app=envision-portal&org=eye-act`;

useSeoMeta({
  title: "Metrics - Envision Portal",
  description: "Usage and growth metrics for the Envision Portal platform.",
  ogTitle: "Metrics - Envision Portal",
  ogDescription: "Usage and growth metrics for the Envision Portal platform.",
  ogImage,
});

definePageMeta({
  layout: "public",
});

const { data } = await useFetch("/api/discover/metrics");

const publishedDatasetsPerYearData = data.value?.datasetsPublicationYearData ?? []
const publishedDatasetsPerYearCategories = computed(() => ({
  datasets: {
    name: "datasets",
    color: "#22c55e"
  }
}))

const xFormatter = (i:number): string => `${publishedDatasetsPerYearData[i]?.year}`
const yFormatter = (tick: number) => tick.toString()

</script>

<template>
  <div class="mx-auto flex w-full max-w-screen-xl flex-col gap-10 px-6 pb-10">
    <UPageCTA
      title="Metrics"
      description="Analytics & Insights about Envision Portal"
      variant="naked"
    />

    <section class="flex flex-col gap-4 lg:-mt-16">
      <h3 class="text-lg font-semibold">How Datasets Have Been Added to the Repository</h3>
      <div class="grid grid-cols-2 gap-4">
        <UCard>
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-green-500">
              {{ (data?.manual ?? 0).toLocaleString() }}
            </div>

            <p class="text-sm font-medium">Manually Shared</p>

            <p class="text-muted text-xs">Uploaded directly by researchers</p>
          </div>
        </UCard>

        <UCard>
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-green-500">
              {{ (data?.autoIndex ?? 0).toLocaleString() }}
            </div>

            <p class="text-sm font-medium">Auto-Indexed</p>

            <p class="text-muted text-xs">
              Discovered and indexed from repositories
            </p>
          </div>
        </UCard>
      </div>
    </section>

    <section class="flex flex-col gap-4">
      <h3 class="text-lg font-semibold">Datasets by Publication Year</h3>
      <div v-if="publishedDatasetsPerYearData.length">    
        <BarChart
          :data="publishedDatasetsPerYearData"
          :height="300"
          :categories="publishedDatasetsPerYearCategories"
          :y-axis="['datasets']"
          :x-num-ticks="publishedDatasetsPerYearData.length"
          :radius="4"
          :y-grid-line="true"
          :x-formatter="xFormatter"
          :y-formatter="yFormatter"
          :legend-position="LegendPosition.TopRight"
          :hide-legend="true"
        />
      </div>

      <p v-else>
        No data available.
      </p>
    </section>

    <!--TODO: Once modalities loaded in loop through them to add new cards instead of manaul addition-->
    <section>
      <h2 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">Dataset Breakdown by Modality</h2>
      <div class="grid grid-cols-2 gap-4">
        <UCard>
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-green-500">
              {{ (data?.datasetsPerModality["oct"] ?? 0).toLocaleString() }}
            </div>

            <p class="text-sm font-medium">Datasets with OCT Images</p>

            <p class="text-muted text-xs">
              Discovered and indexed from repositories
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-green-500">
              {{ (data?.datasetsPerModality["flio"] ?? 0).toLocaleString() }}
            </div>

            <p class="text-sm font-medium">Datasets with FLIO Images</p>

            <p class="text-muted text-xs">
              Discovered and indexed from repositories
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-green-500">
              {{ (data?.datasetsPerModality["fundus_photography"] ?? 0).toLocaleString() }}
            </div>

            <p class="text-sm font-medium">Datasets with Fundus Photography Images</p>

            <p class="text-muted text-xs">
              Discovered and indexed from repositories
            </p>
          </div>
        </UCard>
      </div>
    </section>

    <section>
      <h2 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">Dataset Breakdown by Source</h2>
      <div 
        class="grid grid-cols-2 gap-4" 
      >
        <UCard v-for="(idx, source) in data?.datasetsPerSource">
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-green-500">
              {{ (data?.datasetsPerSource[source] ?? 0).toLocaleString() }}
            </div>

            <p class="text-sm font-medium">Datasets originally published on {{ source }}.</p>

            <p class="text-muted text-xs">
              Discovered and indexed from repositories
            </p>
          </div>
        </UCard>
      </div>
    
    </section>


  </div>
</template>
