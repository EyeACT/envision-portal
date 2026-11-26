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

type ImageRange = "any" | "under100" | "100to999" | "1000to9999" | "10000plus";
const ITEMS_PER_PAGE = 5;
const page = ref(1);
const selectedKeywords = ref<string[]>([]);
const searchQuery = ref<string>("");
type ExternalFilter = "all" | "external" | "non-external";
const externalFilter = ref<ExternalFilter>("all");
const selectedModalities = ref<string[]>([]);
const selectedImageRange = ref<ImageRange>("any");
type DatasetSort = "relevance" | "newest" | "oldest" | "images" | "title";
const sortBy = ref<DatasetSort>("relevance");

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
    params.modality = selectedModalities.value;
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

  if (selectedImageRange.value !== "any") {
    const bounds = imageRangeBounds[selectedImageRange.value];
    if (bounds.min !== undefined) params.imageCountMin = bounds.min;
    if (bounds.max !== undefined) params.imageCountMax = bounds.max;
  }

  params.sortBy = sortBy.value;

  return params;
});

const {
  data: response,
  error,
  pending,
} = await useFetch<{
  data: DiscoveryDatasetList[];
  total: number;
  modalityToTotalMap: Record<string, number>;
  sourceToTotalMap: Record<string, number>;
  repositoryToTotalMap: Record<string, number>;
  totalImageFiles: number;
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
const totalModalityFiles = computed(
  () => response.value?.modalityToTotalMap ?? {},
);
const totalSources = computed(() => response.value?.sourceToTotalMap ?? {});
const totalRepositorySources = computed(
  () => response.value?.repositoryToTotalMap,
);
const totalImageFiles = computed(() => response.value?.totalImageFiles);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalDatasets.value / ITEMS_PER_PAGE)),
);

const getDaysAgo = (date: string | Date): string => {
  const daysAgo = dayjs(date).diff(dayjs(), "day");

  return daysAgo === 0
    ? "Today"
    : `${Math.abs(daysAgo)} day${Math.abs(daysAgo) > 1 ? "s" : ""} ago`;
};

const formatFileCount = (fileCount: number) => {
  if (fileCount >= 1000000) {
    const millions = (Math.round(fileCount / 100000) / 10).toFixed(1);
    return `${millions.replace(/\.0$/, "")}M`;
  }

  if (fileCount >= 1000) {
    const roundedThousands = Math.round(fileCount / 100) / 10;

    if (roundedThousands >= 1000) {
      return `1M`;
    }

    return `${roundedThousands.toFixed(1).replace(/\.0$/, "")}k+`;
  }

  return fileCount.toString();
};

const items = ref<AccordionItem[]>([
  { content: "", label: "Imaging Modality" },
  { content: "", label: "Source" },
  { content: "", label: "Publication Year" },
  { content: "", label: "Number of Images" },
  { content: "", label: "Keywords" },
]);

const searchDatasets = () => {
  appliedSearch.value = searchQuery.value.trim();
  page.value = 1;
};

const resetFilters = () => {
  selectedKeywords.value = [];
  dateRange.value = undefined;
  externalFilter.value = "all";
  appliedSearch.value = "";
  searchQuery.value = "";
  page.value = 1;
  selectedModalities.value = [];
  selectedImageRange.value = "any";
  sortBy.value = "relevance";
};

const hasActiveFilters = computed(() => {
  return (
    selectedKeywords.value.length > 0 ||
    dateRange.value !== undefined ||
    externalFilter.value !== "all" ||
    appliedSearch.value !== "" ||
    selectedModalities.value.length > 0 ||
    selectedImageRange.value !== "any"
  );
});

const sourceItems = [
  { label: "All sources", value: "all", count: 8267 },
  { label: "Deposited on Envision Portal", value: "non-external", count: 8265 },
  { label: "Registered from external repository", value: "external", count: 2 },
];

const repositorySource = [
  {
    name: "figshare",
    icon: "i-lucide-network",
    color: "bg-gray-200 text-gray-800",
  },
  {
    name: "zenodo",
    icon: "i-lucide-database",
    color: "bg-gray-200 text-gray-800",
  },
  {
    name: "kaggle",
    icon: "i-lucide-letter-k",
    color: "bg-gray-200 text-gray-800",
  },
  {
    name: "",
    icon: "i-lucide-eye",
    color: "bg-green-50 text-green-600 border-green-200",
  },
];

// Okabe–Ito palette: stays distinct under common color vision deficiencies
const modalities: {
  longLabel: string;
  shortLabel: string;
  value: string;
  color: string;
}[] = [
  {
    longLabel: "Optical coherence tomography",
    shortLabel: "OCT",
    value: "oct",
    color: "#D55E00",
  },
  {
    longLabel: "OCT Angiography",
    shortLabel: "OCTA",
    value: "octa",
    color: "#0072B2",
  },
  {
    longLabel: "Fundus Autofluorescence",
    shortLabel: "FA",
    value: "fundus_autofluorescence",
    color: "#E69F00",
  },
  {
    longLabel: "Pseudo Color Fundus",
    shortLabel: "PCF",
    value: "pseudo_color_fundus",
    color: "#CC79A7",
  },
  {
    longLabel: "Infrared reflectance",
    shortLabel: "IR",
    value: "infrared_reflectance",
    color: "#56B4E9",
  },
  {
    longLabel: "Color Fundus Photography",
    shortLabel: "CFP",
    value: "color_fundus_photography",
    color: "#009E73",
  },
];

const UNKNOWN_MODALITY_COLOR = "#9CA3AF";

const numberOfImages = [
  { label: "Any number", value: "any" }, // no filter
  { label: "Fewer Than 100", value: "under100" },
  { label: "100 - 999", value: "100to999" },
  { label: "1000 - 9,999", value: "1000to9999" },
  { label: "10,000 or more", value: "10000plus" },
];

const imageRangeBounds = {
  under100: { min: 0, max: 99 },
  "100to999": { min: 100, max: 999 },
  "1000to9999": { min: 1000, max: 9999 },
  "10000plus": { min: 10000 },
} as const;

const sortOptions = [
  { label: "Most relevant", value: "relevance" }, // most distinct modalities first, then most images
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Most images", value: "images" },
  { label: "Title (A–Z)", value: "title" },
];

const getModality = (value: string) =>
  modalities.find((m) => m.value === value);

type ModalityRecord = DiscoveryDatasetList["modalities"][number];

const nonEmptyModalities = (dataset: DiscoveryDatasetList) =>
  dataset.modalities.filter((m) => m.fileCount !== 0);

const modalityPercent = (
  record: ModalityRecord,
  dataset: DiscoveryDatasetList,
) => {
  const pct = (record.fileCount / dataset.modalityFileCount) * 100;
  return pct > 0 && pct < 1 ? "<1%" : `${Math.round(pct)}%`;
};

const modalityLabel = (record: ModalityRecord) =>
  getModality(record.modality)?.shortLabel ?? record.modality;

const modalitySummary = (dataset: DiscoveryDatasetList) =>
  "Modality breakdown: " +
  nonEmptyModalities(dataset)
    .map((m) => `${modalityLabel(m)} ${modalityPercent(m, dataset)}`)
    .join(", ");

const rangeStart = computed(() =>
  totalDatasets.value === 0 ? 0 : (page.value - 1) * ITEMS_PER_PAGE + 1,
);
const rangeEnd = computed(() =>
  Math.min(page.value * ITEMS_PER_PAGE, totalDatasets.value),
);

const stats = computed(() => [
  { label: "Datasets", value: totalDatasets.value.toLocaleString() },
  {
    label: "Eye images classified",
    value: formatFileCount(totalImageFiles.value ?? 0),
  },
  {
    label: "Imaging modalities",
    value: Object.keys(totalModalityFiles.value ?? {}).length,
  },
  {
    label: "Sources",
    value: Object.keys(totalRepositorySources.value ?? {}).length || 6,
  },
]);

const getSourceValue = (label: string) => {
  if (label === "Deposited on Envision Portal") {
    return totalSources.value[""];
  } else if (label === "Registered from external repository") {
    return totalSources.value["Automatic Registration"];
  } else {
    return totalDatasets.value;
  }
};

// When filters change, go back to page 1
watch(
  [
    selectedKeywords,
    dateRange,
    externalFilter,
    appliedSearch,
    selectedModalities,
    sortBy,
    selectedImageRange,
  ],
  () => {
    page.value = 1;
  },
);
</script>

<template>
  <UContainer class="py-10 sm:py-14">
    <!-- Hero -->
    <section class="border-default border-b pb-10">
      <div class="max-w-3xl space-y-3">
        <h1
          class="text-highlighted text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Discover ophthalmic imaging datasets
        </h1>
        <p class="text-muted text-base leading-relaxed">
          Search datasets deposited on the Envision Portal and registered from
          Zenodo and Figshare. Imaging modalities are detected automatically by
          analyzing the image files in each dataset.
        </p>
      </div>

      <!-- search bar -->
      <form
        class="mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row"
        @submit.prevent="searchDatasets"
      >
        <UInput
          v-model="searchQuery"
          type="text"
          size="xl"
          icon="i-lucide-search"
          placeholder="Search titles, descriptions, and keywords"
          class="flex-1"
        />

        <UButton
          type="submit"
          size="xl"
          color="primary"
          label="Search"
          class="justify-center px-6"
        />
      </form>

      <!-- stats -->
      <dl class="mt-10 flex flex-wrap gap-x-16 gap-y-6">
        <div v-for="stat in stats" :key="stat.label" class="flex flex-col">
          <dt class="text-muted text-sm font-medium">{{ stat.label }}</dt>
          <dd class="text-highlighted text-2xl font-semibold tabular-nums">
            {{ stat.value }}
          </dd>
        </div>
      </dl>
    </section>

    <div class="mt-10 flex flex-col gap-10 lg:flex-row lg:items-start">
      <!-- Filters sidebar -->
      <aside class="w-full lg:sticky lg:top-24 lg:w-80 lg:shrink-0">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-highlighted text-base font-semibold">Filters</h2>
          <UButton
            v-if="hasActiveFilters"
            color="neutral"
            variant="link"
            size="sm"
            icon="i-lucide-rotate-ccw"
            label="Reset"
            class="px-0"
            @click="resetFilters"
          />
        </div>

        <div class="border-default rounded-xl border px-4">
          <UAccordion
            type="multiple"
            :items="items"
            :ui="{
              trigger: 'py-4 text-sm font-semibold',
              body: 'pb-5 pt-0',
            }"
          >
            <template #body="{ item }">
              <div v-if="item.label === 'Keywords'">
                <UInputTags
                  v-model="selectedKeywords"
                  placeholder="Filter by keyword..."
                  icon="i-lucide-tag"
                  class="w-full"
                />
              </div>

              <div v-else-if="item.label === 'Publication Year'">
                <UPopover>
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-calendar"
                    class="w-full justify-start text-sm"
                  >
                    <template v-if="dateRange?.start">
                      <span class="font-medium">
                        {{
                          df.format(dateRange.start.toDate(getLocalTimeZone()))
                        }}
                      </span>
                      <template v-if="dateRange?.end">
                        <span class="text-dimmed">–</span>
                        <span class="font-medium">
                          {{
                            df.format(dateRange.end.toDate(getLocalTimeZone()))
                          }}
                        </span>
                      </template>
                    </template>
                    <span v-else class="text-dimmed">Pick a date range</span>
                  </UButton>

                  <template #content>
                    <UCalendar
                      v-model="dateRange"
                      class="p-3"
                      :number-of-months="2"
                      range
                    />
                  </template>
                </UPopover>
              </div>

              <div
                v-else-if="item.label === 'Imaging Modality'"
                class="space-y-1"
              >
                <p class="text-muted mb-3 text-xs">
                  Detected automatically from the image files.
                </p>
                <label
                  v-for="modality in modalities"
                  :key="modality.value"
                  class="hover:bg-elevated flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                >
                  <input
                    v-model="selectedModalities"
                    type="checkbox"
                    :value="modality.value"
                    class="accent-primary size-4 shrink-0"
                  />
                  <span
                    aria-hidden="true"
                    class="size-2.5 shrink-0 rounded-full"
                    :style="{ backgroundColor: modality.color }"
                  ></span>
                  <span class="flex min-w-0 flex-1 flex-col leading-tight">
                    <span class="text-highlighted text-sm font-semibold">
                      {{ modality.shortLabel }}
                    </span>
                    <span class="text-muted truncate text-xs">
                      {{ modality.longLabel }}
                    </span>
                  </span>
                  <span class="text-muted shrink-0 text-xs tabular-nums">
                    {{
                      formatFileCount(totalModalityFiles[modality.value] ?? 0)
                    }}
                  </span>
                </label>
              </div>

              <div v-else-if="item.label === 'Source'" class="space-y-1">
                <label
                  v-for="source in sourceItems"
                  :key="source.value"
                  class="hover:bg-elevated flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                >
                  <input
                    v-model="externalFilter"
                    type="radio"
                    :value="source.value"
                    class="accent-primary size-4 shrink-0"
                  />
                  <span class="text-default min-w-0 flex-1 text-sm">
                    {{ source.label }}
                  </span>
                  <span class="text-muted shrink-0 text-xs tabular-nums">
                    {{ getSourceValue(source.label) }}
                  </span>
                </label>

                <div
                  v-if="
                    Object.keys(totalRepositorySources ?? {}).some(
                      (rs) => rs !== '',
                    )
                  "
                  class="flex flex-wrap gap-2 px-2 pt-3"
                >
                  <UBadge
                    v-for="[rs, total] in Object.entries(
                      totalRepositorySources ?? {},
                    ).filter(([rs]) => rs !== '')"
                    :key="rs"
                    color="neutral"
                    variant="subtle"
                    class="gap-1.5 capitalize"
                  >
                    <span>{{ rs }}</span>
                    <span class="text-muted tabular-nums">{{ total }}</span>
                  </UBadge>
                </div>
              </div>

              <div v-else-if="item.label === 'Number of Images'" class="px-2">
                <URadioGroup
                  v-model="selectedImageRange"
                  :items="numberOfImages"
                  :ui="{ fieldset: 'gap-3' }"
                />
              </div>
            </template>
          </UAccordion>
        </div>
      </aside>

      <!-- Results -->
      <section class="flex min-w-0 flex-1 flex-col gap-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="text-muted text-sm">
            Showing
            <strong class="text-highlighted"
              >{{ rangeStart }}–{{ rangeEnd }}</strong
            >
            of
            <strong class="text-highlighted">{{ totalDatasets }}</strong>
            {{ totalDatasets === 1 ? "dataset" : "datasets" }}
            <span v-if="hasActiveFilters" class="text-dimmed">(filtered)</span>
          </p>

          <USelect
            v-model="sortBy"
            :items="sortOptions"
            aria-label="Sort datasets"
            class="w-48"
            icon="i-lucide-arrow-down-up"
          />
        </div>

        <OverlayLoader :loading="pending" overlay>
          <div class="flex flex-col gap-5">
            <NuxtLink
              v-for="dataset in datasets"
              :key="dataset.id"
              :to="`/datasets/${dataset.id}`"
              class="group border-default bg-default hover:border-primary/40 block rounded-xl border p-6 transition-all hover:shadow-md sm:p-7"
            >
              <!-- Badges -->
              <div class="flex flex-wrap items-center gap-2">
                <UTooltip
                  :text="
                    dataset.registrationSource === 'Manual Registration'
                      ? 'This dataset was registered manually by our review team.'
                      : dataset.registrationSource === 'Automatic Registration'
                        ? 'This dataset was found via our automated discovery process.'
                        : 'This dataset was published on the Envision Portal.'
                  "
                >
                  <div class="flex items-center gap-2">
                    <UBadge
                      :icon="
                        repositorySource.find(
                          (rs) =>
                            rs.name.toLowerCase() ===
                            dataset.datasetSource.toLowerCase(),
                        )?.icon
                      "
                      :color="
                        dataset.datasetSource !== '' ? 'error' : 'primary'
                      "
                      variant="subtle"
                      class="capitalize"
                    >
                      {{ dataset.datasetSource || "Envision Portal" }}
                    </UBadge>
                    <UBadge
                      v-if="dataset.external"
                      color="warning"
                      variant="subtle"
                      icon="i-lucide-orbit"
                    >
                      Auto-discovered
                    </UBadge>
                  </div>
                </UTooltip>

                <UBadge color="neutral" variant="outline">
                  Version {{ dataset.versionTitle }}
                </UBadge>
              </div>

              <!-- Title + date -->
              <h2
                class="text-highlighted group-hover:text-primary mt-4 text-xl leading-snug font-semibold transition-colors"
              >
                {{ dataset.title }}
              </h2>

              <p class="text-dimmed mt-1.5 text-xs">
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
                · {{ getDaysAgo(dataset.created) }}
              </p>

              <p class="text-muted mt-4 line-clamp-3 text-sm leading-relaxed">
                {{ dataset.description || "No description available." }}
              </p>

              <!-- Modality breakdown -->
              <div
                v-if="dataset.modalities.some((m) => m.fileCount !== 0)"
                class="mt-6 space-y-3"
              >
                <div
                  class="bg-elevated flex h-2 w-full gap-0.5 overflow-hidden rounded-full"
                  role="img"
                  :aria-label="modalitySummary(dataset)"
                >
                  <UTooltip
                    v-for="modalityRecord in nonEmptyModalities(dataset)"
                    :key="modalityRecord.modality"
                    :text="`${modalityLabel(modalityRecord)} · ${formatFileCount(modalityRecord.fileCount)} images (${modalityPercent(modalityRecord, dataset)})`"
                  >
                    <div
                      class="h-full shrink-0"
                      :style="{
                        width: `${(modalityRecord.fileCount / dataset.modalityFileCount) * 100}%`,
                        backgroundColor:
                          getModality(modalityRecord.modality)?.color ??
                          UNKNOWN_MODALITY_COLOR,
                      }"
                    ></div>
                  </UTooltip>
                </div>

                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="modalityRecord in nonEmptyModalities(dataset)"
                    :key="modalityRecord.modality"
                    class="inline-flex items-center gap-2 rounded-md border px-2.5 py-1"
                    :style="{
                      backgroundColor: `${getModality(modalityRecord.modality)?.color ?? UNKNOWN_MODALITY_COLOR}14`,
                      borderColor: `${getModality(modalityRecord.modality)?.color ?? UNKNOWN_MODALITY_COLOR}4D`,
                    }"
                  >
                    <span
                      aria-hidden="true"
                      class="size-2 shrink-0 rounded-full"
                      :style="{
                        backgroundColor:
                          getModality(modalityRecord.modality)?.color ??
                          UNKNOWN_MODALITY_COLOR,
                      }"
                    ></span>
                    <span class="text-highlighted text-xs font-semibold">
                      {{ modalityLabel(modalityRecord) }}
                    </span>
                    <span class="text-muted text-xs tabular-nums">
                      {{ formatFileCount(modalityRecord.fileCount) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div
                class="border-default mt-6 flex flex-wrap items-start gap-x-6 gap-y-3 border-t pt-5"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-image"
                    class="text-dimmed size-4 shrink-0"
                  />
                  <span class="text-highlighted text-sm font-medium">
                    {{ formatFileCount(dataset.imageFileCount ?? 0) }} images
                  </span>
                </div>

                <div
                  v-if="dataset.maskFileCount !== 0"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="i-lucide-files"
                    class="text-dimmed size-4 shrink-0"
                  />
                  <span class="text-highlighted text-sm font-medium">
                    Includes
                    {{ formatFileCount(dataset.maskFileCount ?? 0) }} masks
                  </span>
                </div>

                <div
                  v-if="dataset.keywords && dataset.keywords.length > 0"
                  class="flex min-w-0 flex-1 items-start gap-2"
                >
                  <UIcon
                    name="i-lucide-tag"
                    class="text-dimmed mt-0.5 size-4 shrink-0"
                  />
                  <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                    <UBadge
                      v-for="keyword in visibleKeywords(
                        dataset.id,
                        dataset.keywords,
                      )"
                      :key="keyword"
                      variant="soft"
                      color="neutral"
                      size="sm"
                      class="capitalize"
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
            </NuxtLink>

            <div
              v-if="!pending && datasets.length === 0"
              class="border-default flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center"
            >
              <UIcon name="i-lucide-search-x" class="text-dimmed size-8" />
              <p class="text-highlighted mt-3 font-medium">No datasets found</p>
              <p class="text-muted mt-1 text-sm">
                Try a different search term or adjust your filters.
              </p>
            </div>
          </div>
        </OverlayLoader>

        <div v-if="totalPages > 1" class="mt-4 flex justify-center">
          <UPagination
            v-model:page="page"
            :items-per-page="ITEMS_PER_PAGE"
            :total="totalDatasets"
          />
        </div>
      </section>
    </div>
  </UContainer>
</template>
