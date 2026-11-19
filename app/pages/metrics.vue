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

const modalityData = data.value?.modalityData || []

const dummyModaltiyCategories = computed(() => ({
  datasets: {
    name: "datasets",
    color: "var(--ui-primary)"
  },
}))

const totalLicenseFiles: number = donutData.value?.reduce((acc, num) => acc + num, 0)
// TODO: Failure fallback tooltip if segment struct changes
const formatLicenseTooltip = (segment: unknown) => {
  let percent = Math.floor((segment.value / totalLicenseFiles) * 100)
  return `${segment.value} datasets (${percent}%)`
}


</script>

<template>
  <div class="mx-auto flex w-full max-w-screen-xl flex-col gap-10 px-6 pb-10">
    <UPageCTA
      title="Metrics"
      description="Analytics & Insights about Envision Portal"
      variant="naked"
    />

    <section class="flex flex-col gap-4 lg:-mt-16">
      <h2 class="text-lg font-semibold">How Datasets Have Been Added to the Repository</h2>
      <div class="grid grid-cols-2 gap-4">
        <UCard>
          <figure class="flex flex-col items-center gap-1 py-2 text-center">
              <data 
                class="text-3xl font-bold text-[var(--ui-primary)]"
                :value="data?.manual ?? 0"
                >
                {{ (data?.manual ?? 0).toLocaleString() }}
              </data>

              <figcaption> 
                <h3 class="text-sm font-medium">Manually Shared</h3>
                <p class="text-muted text-xs">Uploaded directly by researchers</p>
              </figcaption>
          </figure>
        </UCard>

        <UCard
          aria-label="Automatically indexed datasets"
          aria-description="Datasets added to the Envision Portal platform via automatic indexing third party sources."
        >
          <figure class="flex flex-col items-center gap-1 py-2 text-center">
            <data 
              class="text-3xl font-bold text-[var(--ui-primary)]"
              :value="data?.autoIndex ?? 0"
            >
              {{ (data?.autoIndex ?? 0).toLocaleString() }}
            </data>


            <figcaption> 
              <h3 class="text-sm font-medium">Auto-Indexed</h3>
              <p class="text-muted text-xs">
                Discovered and indexed from repositories
              </p>
            </figcaption>
          </figure>
        </UCard>
      </div>
    </section>

    <section class="flex flex-col gap-4">
      <h2 class="text-lg font-semibold">Research at a Glance</h2>
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
            aria-label="Datasets by publication year"
            aria-description="Number of datasets grouped by publication year."
          />
        </div>

        <p v-else>
          No data available.
        </p>
      </UCard>

      <UCard>
        <h3 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">Datasets by Modality</h3>
        <div v-if="modalityData.length">    
          <BarChart
            :data="modalityData"
            :height="400"
            :categories="dummyModaltiyCategories"
            :y-axis="['datasets']"
            :y-axis-config="{ tickTextFontSize: '8px', tickTextAlign: 'right' }"
            :x-num-ticks="modalityData.length"
            :radius="3"
            :y-grid-line="true"
            x-axis="modality"
            :x-axis-config="{tickTextAlign: 'right'}"
            :legend-position="LegendPosition.TopRight"
            :hide-legend="true"
            :bar-padding="1"
            orientation="horizontal"
            aria-label="Datasets by modality"
            aria-description="Number of datasets grouped by modality."
          />
        </div>

        <p v-else>
          No data available.
        </p>

      </UCard>


      <UCard>
        <figure class="flex flex-col items-center gap-1 py-2 text-center">
          <div class="text-3xl font-bold text-[var(--ui-primary)]">
            {{ 1311 }}
          </div>

          <figcaption>
            <h3 class="text-sm font-medium">Total Conditions</h3>
            <p class="text-muted text-xs">Focused on across all datasets</p>
          </figcaption>

        </figure>
      </UCard>

    </section>

    <section>
      <h2 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">Open Science and Reach</h2>
      <div 
        class="grid grid-cols-2 gap-4" 
      >
        <UCard>
          <figure class="flex flex-col items-center gap-1 py-2 text-center">
            <data 
              class="text-3xl font-bold text-[var(--ui-primary)]"
              :data="data?.reach.dois ?? 0"
              >
              {{ Math.floor(data?.reach.dois / ( data?.manual + data?.autoIndex) * 100)}} %
            </data>

            <figcaption>
              <h3 class="text-sm font-medium">With a DOI</h3>
              <p class="text-xs font-medium">{{ data?.reach?.dois }} of {{ data?.manual + data?.autoIndex }} datasets</p>
            </figcaption>
          </figure>
        </UCard>


        <UCard>
          <h3 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">License Distribution</h3>
          <DonutChart
              :data="donutData"
              :categories="licenseLabels"
              variant="gradient"
              glow
              :height="200"
              :radius="80"
              :pad-angle="0.1"
              :arc-width="20"
              :tooltip-title-formatter="formatLicenseTooltip"
              aria-label="Datasets by license"
              aria-description="Number of datasets grouped by the license they use."
            >
          </DonutChart>
        </UCard>

        <UCard>
          <h3 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">Top Publishers and Repositories</h3>
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
              aria-label="Datasets by publisher"
              aria-description="Number of datasets grouped by their publisher"
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
