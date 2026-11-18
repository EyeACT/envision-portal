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
    color: "var(--ui-primary)"
  }
}))

const xFormatter = (i:number): string => `${publishedDatasetsPerYearData[i]?.year}`
const yFormatter = (tick: number) => tick.toString()

const donutData = ref(data.value?.reach.licenseData);


const licenseLabels = {
  "cc-by": {
    name: "cc-by",
    color: "var(--ui-primary)",
  },
  "apache": {
    name: "apache",
    color: "var(--ui-info)",
  },
  "mit": {
    name: "mit",
    color: "var(--ui-success)",
  },
  "gnu": {
    name: "gnu",
    color: "var(--ui-warning)",
  },
  "other": {
    name: "other",
    color: "purple",
  },
  "unknown": {
    name: "unkown",
    color: "var(--ui-error)"
  }
};

const publishersData = data.value?.reach.publishers ?? []
const publishersCategories = computed(() => ({
  datasets: {
    name: "datasets",
    color: "var(--ui-primary)"
  }
}))


const dummyModalityData = [
  {"modality": "flio", "datasets": 200},
  {"modality": "oct", "datasets": 1000},
  {"modality": "cfp", "datasets": 1000},
  {"modality": "uwf", "datasets": 1000},
  {"modality": "OCTA", "datasets": 1000},
  {"modality": "SLO", "datasets": 1000},
  {"modality": "FFA", "datasets": 1000},
]

const dummyModaltiyCategories = computed(() => ({
  datasets: {
    name: "datasets",
    color: "var(--ui-primary)"
  },
}))



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
            <div class="text-3xl font-bold text-[var(--ui-primary)]">
              {{ (data?.manual ?? 0).toLocaleString() }}
            </div>

            <p class="text-sm font-medium">Manually Shared</p>

            <p class="text-muted text-xs">Uploaded directly by researchers</p>
          </div>
        </UCard>

        <UCard>
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-[var(--ui-primary)]">
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
      <h3 class="text-lg font-semibold">Research at a Glance</h3>
      <UCard>
        <h3 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">Datasets by Publication Year</h3>
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
      </UCard>

      <UCard>
          <h2 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">Datasets by Modality</h2>
          <div v-if="dummyModalityData.length">    
            <BarChart
              :data="dummyModalityData"
              :height="400"
              :categories="dummyModaltiyCategories"
              :y-axis="['datasets']"
              :x-num-ticks="dummyModalityData.length"
              :radius="3"
              :y-grid-line="true"
              x-axis="modality"
              :x-axis-config="{tickTextAlign: 'right'}"
              :legend-position="LegendPosition.TopRight"
              :hide-legend="true"
              :bar-padding="1"
              orientation="horizontal"
            />
        </div>

        <p v-else>
          No data available.
        </p>

      </UCard>


      <UCard>
        <div class="flex flex-col items-center gap-1 py-2 text-center">
          <div class="text-3xl font-bold text-[var(--ui-primary)]">
            {{ 1311 }}
          </div>

          <p class="text-sm font-medium">Total Conditions</p>

          <p class="text-muted text-xs">Focused on across all datasets</p>
        </div>
      </UCard>

    </section>

    <section>
      <h2 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">Open Science and Reach</h2>
      <div 
        class="grid grid-cols-2 gap-4" 
      >
        <UCard>
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-[var(--ui-primary)]">
              {{ Math.floor(data?.reach.dois / ( data?.manual + data?.autoIndex) * 100)}} %
            </div>

            <p class="text-sm font-medium">With a DOI</p>
            <p class="text-xs font-medium">{{ data?.reach?.dois }} of {{ data?.manual + data?.autoIndex }} datasets</p>
          </div>
        </UCard>


        <UCard>
          <h2 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">License Distribution</h2>
          <DonutChart
              :data="donutData"
              :categories="licenseLabels"
              variant="gradient"
              glow
              :height="200"
              :radius="80"
              :pad-angle="0.1"
              :arc-width="20"
            >
          </DonutChart>
        </UCard>

        <UCard>
          <h2 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">Top Publishers and Repositories</h2>
          <div v-if="publishersData.length">    
            <BarChart
              :data="publishersData"
              :height="400"
              :categories="publishersCategories"
              :y-axis="['datasets']"
              :x-num-ticks="publishersData.length"
              :radius="3"
              :y-grid-line="true"
              x-axis="publisher"
              :x-axis-config="{tickTextAlign: 'right'}"
              :legend-position="LegendPosition.TopRight"
              :hide-legend="true"
              :bar-padding="1"
              orientation="horizontal"
            />
        </div>

        <p v-else>
          No data available.
        </p>

        </UCard>
      </div>
    </section>
  </div>
</template>
