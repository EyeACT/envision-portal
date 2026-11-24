<script setup lang="ts">
import dayjs from "dayjs";
import { DateFormatter, getLocalTimeZone } from "@internationalized/date";
import type { AccordionItem } from "@nuxt/ui";
import type { DiscoveryDatasetList } from "#shared/types/dataset";

definePageMeta({ layout: "public" });

useSeoMeta({
  title: "All Datasets",
});

const toast = useToast();

type ImageRange = "any" | "under100" | "100to999" | "1000to9999" | "10000plus"
const ITEMS_PER_PAGE = 5;
const page = ref(1);
const selectedKeywords = ref<string[]>([]);
const searchQuery = ref<string>("");
type ExternalFilter = "all" | "external" | "non-external";
const externalFilter = ref<ExternalFilter>("all");
const selectedModalities = ref<string[]>([])
const selectedImageRange = ref<ImageRange>("any")
type DatasetSort = "relevance" | "modality_count"
const sortBy = ref<DatasetSort>("relevance")

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const dateRange = shallowRef();

const KEYWORD_PREVIEW_LIMIT = 10;
const expandedKeywords = ref(new Set<number>());

const toggleKeywords = (datasetId: number) => {
  const next = new Set(expandedKeywords.value);

  if (next.has(datasetId)) {
    next.delete(datasetId);
  } else {
    next.add(datasetId);
  }

  expandedKeywords.value = next;
};

const visibleKeywords = (datasetId: number, keywords: string[]) =>
  expandedKeywords.value.has(datasetId)
    ? keywords
    : keywords.slice(0, KEYWORD_PREVIEW_LIMIT);

// Applied search term (sent to API when user submits search)
const appliedSearch = ref<string>("");

// Build query params for API (reactive so we refetch when filters or page change)
const queryParams = computed(() => {
  const params: Record<string, string | number | string[]> = {
    page: page.value,
    limit: ITEMS_PER_PAGE,
  };
  
  if (appliedSearch.value) {
    params.search = appliedSearch.value;
  }

  if (selectedKeywords.value.length > 0) {
    params.keyword = selectedKeywords.value;
  }

  if (selectedModalities.value.length > 0) {
    params.modality = selectedModalities.value
  }

  if (dateRange.value?.start) {
    params.dateFrom = dateRange.value.start
      .toDate(getLocalTimeZone())
      .toISOString();
  }
  if (dateRange.value?.end) {
    params.dateTo = dateRange.value.end
      .toDate(getLocalTimeZone())
      .toISOString();
  }
  if (externalFilter.value === "external") {
    params.external = "true";
  } else if (externalFilter.value === "non-external") {
    params.external = "false";
  }

  if(selectedImageRange.value !== "any") {
    const bounds = imageRangeBounds[selectedImageRange.value]
    if(bounds.min !== undefined) params.imageCountMin = bounds.min 
    if(bounds.max !== undefined) params.imageCountMax = bounds.max
  }

  if(sortBy.value !== "relevance") {
    params.sortBy = sortBy.value
  }

  return params;
});

const {
  data: response,
  error,
  pending,
} = await useFetch<{
  data: DiscoveryDatasetList[];
  total: number;
}>("/api/discover/dataset", {
  query: queryParams,
  watch: [queryParams],
});

if (error.value) {
  toast.add({
    title: "Error fetching datasets",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

const datasets = computed(() => response.value?.data ?? []);
const totalDatasets = computed(() => response.value?.total ?? 0);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalDatasets.value / ITEMS_PER_PAGE)),
);

const getDaysAgo = (date: string | Date): string => {
  const daysAgo = dayjs(date).diff(dayjs(), "day");

  return daysAgo === 0
    ? "Today"
    : `${Math.abs(daysAgo)} day${Math.abs(daysAgo) > 1 ? "s" : ""} ago`;
};

const items = ref<AccordionItem[]>([
  { content: "",  label: "Imaging Modality" },
  { content: "", label: "Source"},
  { content: "", label: "Publication Year" },
  { content: "", label: "Number of Images"},
  // { content: "", label: "External datasets" },
  { content: "", label: "Keywords" },
]);

const searchDatasets = () => {
  appliedSearch.value = searchQuery.value.trim();
  page.value = 1;
};

const resetFilters = () => {
  selectedKeywords.value = "";
  dateRange.value = undefined;
  externalFilter.value = "all";
  appliedSearch.value = "";
  searchQuery.value = "";
  page.value = 1;
  selectedModalities.value = []
  selectedImageRange.value = "any"
  sortBy.value = "relevance"
};

const hasActiveFilters = computed(() => {
  return (
    selectedKeywords.value !== "" ||
    dateRange.value !== undefined ||
    externalFilter.value !== "all" ||
    appliedSearch.value !== "" 
  );
});

const sourceItems = [
  {label: "All sources", value: "all", count: 8267},
  {label: "Deposited on Envision Portal", value: "non-external", count: 8265},
  {label: "Registered from external repository", value: "external", count: 2},
]

const modalities = [
  {longLabel: "Optical coherence tomography", shortLabel: "OCT", value: "oct", count: 12, color: 'bg-red-500'},
  {longLabel: "OCT Angiography", shortLabel: "OCTA", value: "octa", count: 32000, color: "bg-blue-500"},
  {longLabel: "Fundus Photography", shortLabel: "FP", value: "fundus_photography", count: 1000, color: "bg-green-500"},
  {longLabel: "Fundus Autoflourscence",shortLabel: "FA", value: "fundus_autoflourescence", count: 150, color: "bg-yellow-500"},
  {longLabel: "Pseudo Color Fundus", shortLabel: "PCF", value: "pseudo_color_fundus", count: 220, color: "bg-purple-500"},
  {longLabel: "Infrared reflectance", shortLabel: "IR", value: "infrared_reflectance", count: 2, color: "bg-orange-500"},
]

const numberOfImages = [
  {label: "Any number", value: "any"}, // no filter
  {label: "Fewer Than 100", value: "under100"}, 
  {label: "100 - 999", value: "100to999"},
  {label: "1000 - 9,999", value: "1000to9999"},
  {label: "10,000 or more", value: "10000plus"},
]

const imageRangeBounds = {
  under100: {min: 0, max: 99},
  "100to999": {min: 100, max: 999},
  "1000to9999": {min: 1000, max: 9999},
  "10000plus": {min: 10000},
} as const;

const sortOptions = [
  {label: "Relevance", value: "relevance"},
  {label: "Modality Count", value: "modality_count"},
]


// When filters change, go back to page 1
watch([selectedKeywords, dateRange, externalFilter, appliedSearch, selectedModalities, sortBy, selectedImageRange], () => {
  page.value = 1;
});
</script>

<template>
  <div>
    <UContainer>
    <div class="border-b border-gray-200 pb-4 space-y-4">
      <h1 class="text-sm font-medium text-green-500">Find datasets</h1>
      <h2 class="text-xl font-semibold">Discover ophthalmic imaging datasets</h2>
      <p>Search datasets deposited on the Envision Portal and registered from Zenodo and Figshare.
        Imaging modalities are detected automatically by analyzing the image files in each dataset.
      </p>
      
      <!-- search bar -->
      <div class="flex items-center gap-2">
        <UInput
          v-model="searchQuery"
          type="text"
          icon="i-lucide-search"
          placeholder="Search titles, descriptions, and keywords"
          @keyup.enter="searchDatasets"
        />

        <UButton
          color="primary"
          variant="soft"
          label="Search"
          @click="searchDatasets"
        />
      </div>


      <div class="flex w-full flex-row gap-20 items-center ">
        <div class="flex flex-col">
          <span class="text-sm font-medium">Datasets</span>
          <span class="text-xl font-semibold">{{ totalDatasets }}</span>
        </div>

        <div class="flex flex-col">
          <span class="text-sm font-medium">Eye Images Classified</span>
          <span class="text-xl font-semibold">488.6k</span>
        </div>

        <div class="flex flex-col">
          <span class="text-sm font-medium">Imaging Modalities</span>
          <span class="text-xl font-semibold">6</span>
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-medium">Sources</span>
          <span class="text-xl font-semibold">6</span>
        </div>
      </div>
    </div>




      <div class="flex flex-col gap-6 pt-2 md:flex-row mt-4">
        <div class="flex flex-col">
          <h2 class="text-lg font-semibold">Filters</h2>
          <div class="w-full md:w-[22rem] md:shrink-0">
            <UAccordion type="multiple" :items="items">
              <template #content="{ item }">
                <div v-if="item.label === 'Keywords'" class="p-2">
                  <UInputTags
                    v-model="selectedKeywords"
                    type="text"
                    placeholder="Filter by keyword..."
                    size="sm"
                    icon="i-lucide-search"
                  />
                </div>

                <div v-else-if="item.label === 'Publication Year'" class="p-2">
                  <UPopover :popper="{ placement: 'bottom-start' }">
                    <UButton
                      color="neutral"
                      variant="soft"
                      icon="i-lucide-calendar"
                      class="hover:border-primary-300 hover:bg-primary-50 w-full justify-start gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm transition-all"
                      :ui="{
                        base: 'text-gray-700 hover:text-primary-600',
                      }"
                    >
                      <template v-if="dateRange?.start">
                        <template v-if="dateRange?.end">
                          <span class="font-medium">
                            {{
                              df.format(
                                dateRange.start.toDate(getLocalTimeZone()),
                              )
                            }}
                          </span>
                          <span class="text-gray-400">-</span>
                          <span class="font-medium">
                            {{
                              df.format(dateRange.end.toDate(getLocalTimeZone()))
                            }}
                          </span>
                        </template>
                        <template v-else>
                          <span class="font-medium">
                            {{
                              df.format(
                                dateRange.start.toDate(getLocalTimeZone()),
                              )
                            }}
                          </span>
                        </template>
                      </template>
                      <template v-else>
                        <span class="text-gray-400">Pick a date</span>
                      </template>
                    </UButton>

                    <template #content>
                      <UCalendar
                        v-model="dateRange"
                        class="rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
                        :number-of-months="2"
                        range
                      />
                    </template>
                  </UPopover>
                </div>

                <div v-else-if="item.label === 'Imaging Modality'" class="p-2">
                  <p class="text-xs text-left mb-2">Detected automatically from the image files.</p>
                    <div 
                      v-for="modality in modalities"
                      class="flex w-full items-center"
                    >
                      <label 
                        :key="modality.value"
                        class="flex min-w-0 flex-1 items-center gap-2"
                        >
                          <input 
                            v-model="selectedModalities"
                            type="checkbox"
                            :value="modality.value"
                            class="shrink-0"
                            />
                            <span 
                              aria-hidden="true" 
                              :class="['size-2 shrink-0 rounded-full', modality.color]"></span>
                            <span class="flex translate-y-1 flex-col leading-5">
                              <span class="font-semibold text-sm">{{ modality.shortLabel }}</span>
                              <span class="text-xs whitespace-nowrap">{{ modality.longLabel }}</span>
                            </span>
                      </label>
                      <span class="w-14 shrink-0 text-left tabular-nums text-xs">{{ modality.count }}</span>
                  </div>

                </div>

                <div v-else-if="item.label === 'Source'" class="p-2">
                  <div
                    v-for="source in sourceItems"
                    :key="source.value"
                    class="flex w-full items-center"
                  >
                    <label
                      class="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <input 
                        v-model="externalFilter"
                        type="radio"
                        :value="source.value"
                        class="shrink-0"
                      />
                      <span class="text-sm whitespace-nowrap">{{ source.label }}</span>
                    </label>
                    <span class="w-14 shrink-0 text-left tabular-nums text-xs">
                      {{ source.count }}
                    </span>
                  </div>

                </div>

                <div v-else-if="item.label === 'Number of Images'" class="p-2">
                  <URadioGroup v-model="selectedImageRange" :items="numberOfImages" />
                </div>
              </template>
            </UAccordion>
          </div>
        </div>


        <div class="flex w-full flex-col gap-4 md:w-4/5">
          <!-- Dataset counts and reset button -->
          <div class="flex items-center justify-between gap-4">
            <div v-if="hasActiveFilters">
              <UButton
                color="neutral"
                variant="soft"
                icon="i-lucide-x"
                size="sm"
                class="transition-all hover:bg-red-50 hover:text-red-600"
                @click="resetFilters"
              >
                Reset filters
              </UButton>
            </div>
            <div v-else class="flex-1"></div>

            <div class="flex gap-4 text-sm text-gray-600">
              <span>
                Showing
                <strong class="text-gray-900">{{(page * ITEMS_PER_PAGE) - (ITEMS_PER_PAGE - 1)}} - {{ page * ITEMS_PER_PAGE }}</strong>
                of
                <strong class="text-gray-900">{{ totalDatasets }}</strong>
                {{ totalDatasets === 1 ? "dataset" : "datasets" }}
              </span>

              <span v-if="hasActiveFilters" class="text-gray-400">
                (filtered)
              </span>
            </div>

            <div class="flex gap-4 text-sm text-gray-600">
              <USelect 
                v-model="sortBy"
                :items="sortOptions"
                aria-label="Sort datasets"
                class="w-48"
                icon="i-lucide-sparkles"
                />
            </div>
          </div>

          <!-- Data List Wrapper with Loading Overlay -->
          <OverlayLoader :loading="pending" overlay>
            <NuxtLink
              v-for="dataset in datasets"
              :key="dataset.id"
              :to="`/datasets/${dataset.id}`"
            >
              <UCard
                class="my-4 rounded-lg border border-gray-200 bg-white p-2 transition-all hover:shadow-lg"
              >
                <template #header>
                  <div class="flex flex-col">
                    <div class="flex items-start justify-between gap-2">
                      <div class="mb-1 flex items-start gap-2">
                        <UBadge color="primary" variant="outline">
                          Version {{ dataset.versionTitle }}
                        </UBadge>

                        <UBadge
                          v-if="dataset.external"
                          color="warning"
                          variant="soft"
                        >
                          External Dataset
                        </UBadge>
                      </div>

                      <UTooltip
                        :text="
                          dataset.registrationSource === 'Manual Registration'
                            ? 'This dataset was registered manually by our review team.'
                            : dataset.registrationSource ===
                                'Automatic Registration'
                              ? 'This dataset was found via our automated discovery process.'
                              : 'This dataset was published on the Envision Portal.'
                        "
                      >
                        <UBadge
                          color="primary"
                          variant="soft"
                          class="cursor-help"
                        >
                          <Icon name="material-symbols:auto-mode" size="14" />
                          {{
                            dataset.registrationSource === "Manual Registration"
                              ? "Registered manually"
                              : dataset.registrationSource ===
                                  "Automatic Registration"
                                ? "Registered automatically"
                                : "Published on Envision Portal"
                          }}
                        </UBadge>
                      </UTooltip>
                    </div>

                    <h2 class="text-xl font-semibold text-blue-400">
                      {{ dataset.title }}
                    </h2>
                  </div>

                  <p class="mt-1 text-xs text-gray-500">
                    {{
                      dataset.registrationSource === "Manual Registration" ||
                      dataset.registrationSource === "Automatic Registration"
                        ? "Registered"
                        : "Published"
                    }}
                    on
                    <time :datetime="dayjs(dataset.created).toISOString()">
                      {{ dayjs(dataset.created).format("MMMM D, YYYY") }}
                    </time>

                    ({{ getDaysAgo(dataset.created) }})
                  </p>
                </template>

                <div class="space-y-4 border-b border-gray-200 pb-4 mb-3">
                  <p class="line-clamp-3 text-sm text-gray-500">
                    {{ dataset.description || "No description available." }}
                  </p>

                  <div 
                    class="flex h-3 w-full overflow-hidden rounded-full bg-gray-100"
                    role="img"
                    aria-label="Modality breakdown"

                  >
                    <div 
                      :class="['h-full shrink-0 bg-red-500']"
                      :style="{width: '25%'}"
                    ></div>

                    <div 
                      :class="['h-full shrink-0 bg-blue-500']"
                      :style="{width: '25%'}"
                    ></div>

                    <div 
                      :class="['h-full shrink-0 bg-green-500']"
                      :style="{width: '50%'}"
                    ></div>
                
                  </div>

                  <div class="flex flex-wrap gap-2 ">
                    <div class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                      <span 
                        aria-hidden="true"
                        :class="['size-2 shrink-0 rounded-full bg-red-500']"
                      ></span>
                      <span class="text-sm font-medium">OCT</span>
                      <span class="tabular-nums text-xs text-gray-500">25,000</span>
                    </div>

                    <div class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                      <span 
                        aria-hidden="true"
                        :class="['size-2 shrink-0 rounded-full bg-blue-500']"
                      ></span>
                      <span class="text-sm font-medium">OCTA</span>
                      <span class="tabular-nums text-xs text-gray-500">25,000</span>
                    </div>

                    <div class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                      <span 
                        aria-hidden="true"
                        :class="['size-2 shrink-0 rounded-full bg-blue-500']"
                      ></span>
                      <span class="text-sm font-medium">FP</span>
                      <span class="tabular-nums text-xs text-gray-500">50,000</span>
                    </div>
                  </div>
                </div>


                <div class="flex flex-wrap gap-2">
                  <div class="flex flex-row gap-4">

                    <div class="flex min-w-0 items-center gap-2">
                      <Icon 
                        name="i-lucide-image"
                        size="16"
                        class="shrink-0 text-gray-500"
                        aria-hidden="true"
                      />
                      <span class="text-sm font-semibold">23,000 images</span>
                    </div>


                      <div 
                        v-if="dataset.keywords && dataset.keywords.length > 0"
                        class="flex min-w-0 items-center gap-2"
                        >
                        <Icon 
                          name="i-lucide-tag"
                          size="16"
                          class="shrink-0 text-gray-500"
                          aria-hidden="true"
                        />

                        <div class="flex flex-wrap gap-2 min-w-0 items-center">
                          <UBadge
                            v-for="keyword in visibleKeywords(
                              dataset.id,
                              dataset.keywords,
                            )"
                            :key="keyword"
                            variant="subtle"
                            color="neutral"
                            class="text-xs capitalize"
                          >
                            {{ keyword }}
                          </UBadge>

                          <UButton
                            v-if="dataset.keywords.length > KEYWORD_PREVIEW_LIMIT"
                            size="xs"
                            variant="link"
                            class="px-1"
                            @click.prevent.stop="toggleKeywords(dataset.id)"
                          >
                            {{
                              expandedKeywords.has(dataset.id)
                                ? "Show less"
                                : `Show ${dataset.keywords.length - KEYWORD_PREVIEW_LIMIT} more`
                            }}
                          </UButton>
                        </div>
                      </div>
                  </div>
                </div>
              </UCard>
            </NuxtLink>
          </OverlayLoader>

          <div v-if="totalPages > 1" class="mt-6 flex justify-center">
            <UPagination
              v-model:page="page"
              :items-per-page="ITEMS_PER_PAGE"
              :total="totalDatasets"
            />
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
