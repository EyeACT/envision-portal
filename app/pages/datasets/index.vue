<script setup lang="ts">
import dayjs from "dayjs";
import { refDebounced } from "@vueuse/core";
import type { DiscoveryDatasetList } from "#shared/types/dataset";
import type { DiscoveryQuery } from "~/utils/discoveryMock";
import { queryMockDatasets } from "~/utils/discoveryMock";
import { MODALITIES, REPOSITORIES, getModality } from "~/utils/modalities";

definePageMeta({ layout: "public" });

useSeoMeta({
  title: "Find Datasets",
});

const toast = useToast();

const ITEMS_PER_PAGE = 10;
const MIN_YEAR = 2010;
const MAX_YEAR = new Date().getFullYear();
const KEYWORD_PREVIEW_LIMIT = 6;

type Origin = "all" | "envision" | "external";
type ImageRange = "any" | "lt100" | "100-1k" | "1k-10k" | "10k+";

const IMAGE_RANGES: {
  value: ImageRange;
  label: string;
  min?: number;
  max?: number;
}[] = [
  { value: "any", label: "Any number" },
  { value: "lt100", label: "Fewer than 100", max: 99 },
  { value: "100-1k", label: "100 to 999", min: 100, max: 999 },
  { value: "1k-10k", label: "1,000 to 9,999", min: 1000, max: 9999 },
  { value: "10k+", label: "10,000 or more", min: 10000 },
];

const SORT_OPTIONS = [
  { label: "Most relevant", value: "relevance" },
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Most images", value: "images" },
  { label: "Title A–Z", value: "title" },
];

// Filters
const page = ref(1);
const searchQuery = ref("");
const appliedSearch = ref("");
const keyword = ref("");
const debouncedKeyword = refDebounced(keyword, 300);
const selectedModalities = ref<string[]>([]);
const modalityMatch = ref<"any" | "all">("any");
const origin = ref<Origin>("all");
const repository = ref<string>("");
const yearRange = ref<number[]>([MIN_YEAR, MAX_YEAR]);
const debouncedYearRange = refDebounced(yearRange, 200);
const imageRange = ref<ImageRange>("any");
const sort = ref<NonNullable<DiscoveryQuery["sort"]>>("relevance");

const queryParams = computed<DiscoveryQuery>(() => {
  const params: DiscoveryQuery = {
    page: page.value,
    limit: ITEMS_PER_PAGE,
    sort: sort.value,
  };

  if (appliedSearch.value) params.search = appliedSearch.value;
  if (debouncedKeyword.value.trim()) {
    params.keyword = debouncedKeyword.value.trim();
  }
  if (selectedModalities.value.length) {
    params.modality = selectedModalities.value.join(",");
    params.modalityMatch = modalityMatch.value;
  }
  if (origin.value === "external") params.external = "true";
  if (origin.value === "envision") params.external = "false";
  if (repository.value && origin.value !== "envision") {
    params.repository = repository.value;
  }

  const [from, to] = debouncedYearRange.value;
  if (from !== undefined && from > MIN_YEAR) params.yearFrom = from;
  if (to !== undefined && to < MAX_YEAR) params.yearTo = to;

  const range = IMAGE_RANGES.find((r) => r.value === imageRange.value);
  if (range?.min !== undefined) params.minImages = range.min;
  if (range?.max !== undefined) params.maxImages = range.max;

  return params;
});

// TODO: replace with useFetch("/api/discover/dataset", { query: queryParams })
// once the API returns modalities, image counts and facets.
const {
  data: response,
  error,
  pending,
} = await useAsyncData(
  "discover-datasets",
  () => queryMockDatasets(queryParams.value),
  { watch: [queryParams] },
);

watch(
  error,
  (value) => {
    if (value) {
      toast.add({
        title: "Error fetching datasets",
        description: "Please try again later",
        icon: "material-symbols:error",
      });
    }
  },
  { immediate: true },
);

const datasets = computed(() => response.value?.data ?? []);
const totalDatasets = computed(() => response.value?.total ?? 0);
const facets = computed(() => response.value?.facets);
const summary = computed(() => response.value?.summary);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalDatasets.value / ITEMS_PER_PAGE)),
);
const rangeStart = computed(() =>
  totalDatasets.value === 0 ? 0 : (page.value - 1) * ITEMS_PER_PAGE + 1,
);
const rangeEnd = computed(() =>
  Math.min(page.value * ITEMS_PER_PAGE, totalDatasets.value),
);

// Formatting
const numberFormat = new Intl.NumberFormat("en-US");
const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const formatNumber = (n: number | null | undefined) =>
  numberFormat.format(n ?? 0);
const formatCompact = (n: number | null | undefined) =>
  compactFormat.format(n ?? 0);

const sortedModalities = (dataset: DiscoveryDatasetList) =>
  [...(dataset.modalities ?? [])].sort(
    (a, b) => (b.fileCount ?? 0) - (a.fileCount ?? 0),
  );

const modalityTotal = (dataset: DiscoveryDatasetList) =>
  (dataset.modalities ?? []).reduce((n, m) => n + (m.fileCount ?? 0), 0);

const originLabel = (dataset: DiscoveryDatasetList) => {
  if (!dataset.external) return "Envision Portal";
  return REPOSITORIES[dataset.repository ?? ""]?.label ?? "External repository";
};

const originIcon = (dataset: DiscoveryDatasetList) => {
  if (!dataset.external) return "i-lucide-eye";
  return REPOSITORIES[dataset.repository ?? ""]?.icon ?? "i-lucide-globe";
};

const registrationTooltip = (dataset: DiscoveryDatasetList) => {
  if (dataset.registrationSource === "Manual Registration") {
    return "Registered manually by our review team.";
  }
  if (dataset.registrationSource === "Automatic Registration") {
    return "Found by our automated discovery pipeline. Imaging modalities were detected from the image files.";
  }
  return "Deposited directly on the Envision Portal.";
};

const dateLabel = (dataset: DiscoveryDatasetList) =>
  dataset.external ? "Registered" : "Published";

const expandedKeywords = ref(new Set<number>());

const toggleKeywords = (datasetId: number) => {
  const next = new Set(expandedKeywords.value);
  if (next.has(datasetId)) next.delete(datasetId);
  else next.add(datasetId);
  expandedKeywords.value = next;
};

const visibleKeywords = (dataset: DiscoveryDatasetList) =>
  expandedKeywords.value.has(dataset.id)
    ? dataset.keywords
    : dataset.keywords.slice(0, KEYWORD_PREVIEW_LIMIT);

// Filter actions
const toggleModality = (key: string) => {
  selectedModalities.value = selectedModalities.value.includes(key)
    ? selectedModalities.value.filter((m) => m !== key)
    : [...selectedModalities.value, key];
};

const searchDatasets = () => {
  appliedSearch.value = searchQuery.value.trim();
};

const clearSearch = () => {
  searchQuery.value = "";
  appliedSearch.value = "";
};

const resetFilters = () => {
  clearSearch();
  keyword.value = "";
  selectedModalities.value = [];
  modalityMatch.value = "any";
  origin.value = "all";
  repository.value = "";
  yearRange.value = [MIN_YEAR, MAX_YEAR];
  imageRange.value = "any";
};

const originItems = computed(() => [
  {
    value: "all",
    label: "All sources",
    count:
      (facets.value?.origin.envision ?? 0) +
      (facets.value?.origin.external ?? 0),
  },
  {
    value: "envision",
    label: "Deposited on Envision Portal",
    count: facets.value?.origin.envision,
  },
  {
    value: "external",
    label: "Registered from external repository",
    count: facets.value?.origin.external,
  },
]);

const activeFilters = computed(() => {
  const chips: { label: string; clear: () => void }[] = [];

  if (appliedSearch.value) {
    chips.push({ label: `“${appliedSearch.value}”`, clear: clearSearch });
  }
  for (const key of selectedModalities.value) {
    chips.push({
      label: getModality(key).short,
      clear: () => toggleModality(key),
    });
  }
  if (origin.value !== "all") {
    chips.push({
      label: origin.value === "envision" ? "Envision Portal" : "External",
      clear: () => (origin.value = "all"),
    });
  }
  if (repository.value && origin.value !== "envision") {
    chips.push({
      label: REPOSITORIES[repository.value]?.label ?? repository.value,
      clear: () => (repository.value = ""),
    });
  }
  if (keyword.value.trim()) {
    chips.push({
      label: `Keyword: ${keyword.value.trim()}`,
      clear: () => (keyword.value = ""),
    });
  }
  const [from, to] = yearRange.value;
  if ((from ?? MIN_YEAR) > MIN_YEAR || (to ?? MAX_YEAR) < MAX_YEAR) {
    chips.push({
      label: `${from}–${to}`,
      clear: () => (yearRange.value = [MIN_YEAR, MAX_YEAR]),
    });
  }
  if (imageRange.value !== "any") {
    chips.push({
      label: `${IMAGE_RANGES.find((r) => r.value === imageRange.value)?.label} images`,
      clear: () => (imageRange.value = "any"),
    });
  }

  return chips;
});

// Go back to the first page whenever the filters or sort change
watch(
  () => {
    const { page: _page, ...rest } = queryParams.value;
    return JSON.stringify(rest);
  },
  () => {
    page.value = 1;
  },
);
</script>

<template>
  <div>
    <!-- Header -->
    <div class="border-default border-b">
      <UContainer class="py-10">
        <UBreadcrumb
          class="mb-6"
          :items="[{ label: 'Find datasets', to: '/datasets' }]"
        />

        <div class="max-w-3xl">
          <h1 class="text-highlighted text-4xl font-semibold tracking-tight">
            Discover ophthalmic imaging datasets
          </h1>

          <p class="mt-3 text-base">
            Search datasets deposited on the Envision Portal and registered from
            Zenodo and Figshare. Imaging modalities are detected automatically
            by analyzing the image files in each dataset.
          </p>
        </div>

        <form
          class="mt-6 flex max-w-3xl gap-2"
          role="search"
          @submit.prevent="searchDatasets"
        >
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            size="xl"
            placeholder="Search titles, descriptions and keywords"
            aria-label="Search datasets"
            class="flex-1"
            :ui="{ trailing: 'pe-1' }"
          >
            <template v-if="searchQuery" #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-x"
                aria-label="Clear search"
                @click="clearSearch"
              />
            </template>
          </UInput>

          <UButton type="submit" size="xl" label="Search" />
        </form>

        <dl v-if="summary" class="mt-8 grid max-w-3xl grid-cols-4 gap-4">
          <div>
            <dt class="text-xs">Datasets</dt>
            <dd class="text-highlighted text-xl font-semibold tabular-nums">
              {{ formatNumber(summary.datasets) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs">Eye images classified</dt>
            <dd class="text-highlighted text-xl font-semibold tabular-nums">
              {{ formatCompact(summary.images) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs">Imaging modalities</dt>
            <dd class="text-highlighted text-xl font-semibold tabular-nums">
              {{ MODALITIES.length }}
            </dd>
          </div>
          <div>
            <dt class="text-xs">Sources</dt>
            <dd class="text-highlighted text-xl font-semibold tabular-nums">
              {{ summary.repositories }}
            </dd>
          </div>
        </dl>
      </UContainer>
    </div>

    <UContainer class="py-8">
      <div class="flex gap-8">
        <!-- Sidebar filters -->
        <aside class="w-72 shrink-0">
          <div class="sticky top-24">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-highlighted font-semibold">Filters</h2>
              <UButton
                v-if="activeFilters.length"
                color="neutral"
                variant="link"
                size="xs"
                label="Clear all"
                @click="resetFilters"
              />
            </div>

            <div class="flex flex-col gap-6">
              <section>
                <div class="mb-2 flex items-center justify-between">
                  <h3 class="text-highlighted text-sm font-semibold">
                    Imaging modality
                  </h3>

                  <UFieldGroup v-if="selectedModalities.length > 1" size="xs">
                    <UButton
                      :color="modalityMatch === 'any' ? 'primary' : 'neutral'"
                      :variant="modalityMatch === 'any' ? 'soft' : 'ghost'"
                      size="xs"
                      label="Any"
                      @click="modalityMatch = 'any'"
                    />
                    <UButton
                      :color="modalityMatch === 'all' ? 'primary' : 'neutral'"
                      :variant="modalityMatch === 'all' ? 'soft' : 'ghost'"
                      size="xs"
                      label="All"
                      @click="modalityMatch = 'all'"
                    />
                  </UFieldGroup>
                </div>

                <p class="mb-3 text-xs">
                  Detected automatically from the image files.
                </p>

                <ul class="flex flex-col gap-1">
                  <li v-for="modality in MODALITIES" :key="modality.key">
                    <button
                      type="button"
                      class="hover:bg-elevated flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors"
                      :class="
                        selectedModalities.includes(modality.key)
                          ? 'bg-elevated'
                          : ''
                      "
                      :aria-pressed="selectedModalities.includes(modality.key)"
                      @click="toggleModality(modality.key)"
                    >
                      <UCheckbox
                        :model-value="selectedModalities.includes(modality.key)"
                        tabindex="-1"
                        class="pointer-events-none"
                      />
                      <span
                        class="size-2.5 shrink-0 rounded-full"
                        :class="modality.dot"
                      />
                      <span class="min-w-0 flex-1">
                        <span
                          class="text-highlighted block text-sm font-medium"
                        >
                          {{ modality.short }}
                        </span>
                        <span class="block truncate text-xs">
                          {{ modality.label }}
                        </span>
                      </span>
                      <span class="text-xs tabular-nums">
                        {{ facets?.modality[modality.key] ?? 0 }}
                      </span>
                    </button>
                  </li>
                </ul>
              </section>

              <USeparator />

              <section>
                <h3 class="text-highlighted mb-3 text-sm font-semibold">
                  Source
                </h3>

                <URadioGroup
                  v-model="origin"
                  :items="originItems"
                  size="sm"
                  :ui="{ fieldset: 'gap-2', label: 'w-full' }"
                >
                  <template #label="{ item }">
                    <span
                      class="flex w-full items-center justify-between gap-2"
                    >
                      <span>{{ item.label }}</span>
                      <span class="text-xs tabular-nums">
                        {{ item.count ?? 0 }}
                      </span>
                    </span>
                  </template>
                </URadioGroup>

                <div
                  v-if="origin !== 'envision'"
                  class="border-default mt-3 ml-1.5 flex flex-wrap gap-1.5 border-l pl-3"
                >
                  <UButton
                    v-for="(repo, key) in REPOSITORIES"
                    :key="key"
                    size="xs"
                    :icon="repo.icon"
                    :color="repository === key ? 'primary' : 'neutral'"
                    :variant="repository === key ? 'soft' : 'outline'"
                    @click="repository = repository === key ? '' : key"
                  >
                    {{ repo.label }}
                    <span class="tabular-nums">
                      {{ facets?.repository[key] ?? 0 }}
                    </span>
                  </UButton>
                </div>
              </section>

              <USeparator />

              <section>
                <div class="mb-3 flex items-center justify-between">
                  <h3 class="text-highlighted text-sm font-semibold">
                    Publication year
                  </h3>
                  <span class="text-xs tabular-nums">
                    {{ yearRange[0] }} – {{ yearRange[1] }}
                  </span>
                </div>

                <USlider
                  v-model="yearRange"
                  :min="MIN_YEAR"
                  :max="MAX_YEAR"
                  :step="1"
                  :min-steps-between-thumbs="0"
                  size="sm"
                />
              </section>

              <USeparator />

              <section>
                <h3 class="text-highlighted mb-3 text-sm font-semibold">
                  Number of images
                </h3>

                <URadioGroup
                  v-model="imageRange"
                  :items="IMAGE_RANGES"
                  size="sm"
                  :ui="{ fieldset: 'gap-2' }"
                />
              </section>

              <USeparator />

              <section>
                <h3 class="text-highlighted mb-3 text-sm font-semibold">
                  Keyword
                </h3>

                <UInput
                  v-model="keyword"
                  icon="i-lucide-tag"
                  placeholder="e.g. glaucoma"
                  size="sm"
                />
              </section>
            </div>
          </div>
        </aside>

        <!-- Results -->
        <div class="min-w-0 flex-1">
          <div
            class="mb-4 flex flex-wrap items-center justify-between gap-3"
            aria-live="polite"
          >
            <p class="text-sm">
              <template v-if="totalDatasets">
                Showing
                <strong class="text-highlighted tabular-nums">
                  {{ rangeStart }}–{{ rangeEnd }}
                </strong>
                of
                <strong class="text-highlighted tabular-nums">
                  {{ formatNumber(totalDatasets) }}
                </strong>
                {{ totalDatasets === 1 ? "dataset" : "datasets" }}
              </template>
              <template v-else>No datasets found</template>
            </p>

            <div class="flex items-center gap-2">
              <USelect
                v-model="sort"
                :items="SORT_OPTIONS"
                size="md"
                icon="i-lucide-arrow-down-wide-narrow"
                aria-label="Sort datasets"
                class="w-44"
              />
            </div>
          </div>

          <div v-if="activeFilters.length" class="mb-4 flex flex-wrap gap-2">
            <UButton
              v-for="chip in activeFilters"
              :key="chip.label"
              color="neutral"
              variant="soft"
              size="xs"
              trailing-icon="i-lucide-x"
              :aria-label="`Remove filter ${chip.label}`"
              @click="chip.clear"
            >
              {{ chip.label }}
            </UButton>

            <UButton
              color="neutral"
              variant="link"
              size="xs"
              label="Clear all"
              @click="resetFilters"
            />
          </div>

          <OverlayLoader :loading="pending" overlay>
            <UEmpty
              v-if="!pending && datasets.length === 0"
              icon="i-lucide-search-x"
              title="No datasets match your filters"
              description="Try removing a filter or searching for a broader term."
              :actions="[
                {
                  label: 'Clear all filters',
                  color: 'neutral',
                  variant: 'outline',
                  onClick: resetFilters,
                },
              ]"
              class="border-default rounded-lg border border-dashed py-16"
            />

            <ul v-else class="flex flex-col gap-4">
              <li v-for="dataset in datasets" :key="dataset.id">
                <NuxtLink
                  :to="`/datasets/${dataset.id}`"
                  class="group border-default bg-default hover:border-accented focus-visible:outline-primary block rounded-lg border p-5 transition-shadow hover:shadow-md focus-visible:outline-2"
                >
                  <!-- Badges -->
                  <div class="mb-2 flex flex-wrap items-center gap-2">
                    <UTooltip :text="registrationTooltip(dataset)">
                      <UBadge
                        :color="dataset.external ? 'neutral' : 'primary'"
                        variant="subtle"
                        :icon="originIcon(dataset)"
                        size="sm"
                      >
                        {{ originLabel(dataset) }}
                      </UBadge>
                    </UTooltip>

                    <UBadge
                      v-if="
                        dataset.registrationSource === 'Automatic Registration'
                      "
                      color="neutral"
                      variant="outline"
                      icon="material-symbols:auto-mode"
                      size="sm"
                    >
                      Auto-discovered
                    </UBadge>

                    <UBadge color="neutral" variant="outline" size="sm">
                      Version {{ dataset.versionTitle }}
                    </UBadge>
                  </div>

                  <h2
                    class="text-highlighted group-hover:text-primary text-lg font-semibold transition-colors"
                  >
                    {{ dataset.title }}
                  </h2>

                  <p class="mt-1 text-xs">
                    {{ dateLabel(dataset) }}
                    <time :datetime="dayjs(dataset.created).toISOString()">
                      {{ dayjs(dataset.created).format("MMM D, YYYY") }}
                    </time>
                    <template v-if="dataset.creators?.length">
                      <span class="mx-1">·</span>
                      <span>
                        {{
                          dataset.creators
                            .slice(0, 3)
                            .map((c) => c.creatorName)
                            .join(", ")
                        }}<template v-if="dataset.creators.length > 3">
                          et al.</template
                        >
                      </span>
                    </template>
                  </p>

                  <p class="text-toned mt-3 line-clamp-2 text-sm">
                    {{ dataset.description || "No description available." }}
                  </p>

                  <!-- Modalities -->
                  <div class="mt-4">
                    <template v-if="dataset.modalities?.length">
                      <div
                        class="bg-elevated mb-2.5 flex h-1.5 overflow-hidden rounded-full"
                        role="img"
                        :aria-label="`Image share by modality: ${sortedModalities(
                          dataset,
                        )
                          .map(
                            (m) =>
                              `${getModality(m.modality).short} ${formatNumber(m.fileCount)}`,
                          )
                          .join(', ')}`"
                      >
                        <div
                          v-for="m in sortedModalities(dataset)"
                          :key="m.modality"
                          :class="getModality(m.modality).dot"
                          :style="{
                            width: `${((m.fileCount ?? 0) / Math.max(1, modalityTotal(dataset))) * 100}%`,
                          }"
                        />
                      </div>

                      <div class="flex flex-wrap gap-1.5">
                        <UTooltip
                          v-for="m in sortedModalities(dataset)"
                          :key="m.modality"
                          :text="`${getModality(m.modality).label}: ${m.fileCountComplete ? '' : 'about '}${formatNumber(m.fileCount)} images${m.fileCountComplete ? '' : ' (estimated from a sample)'}`"
                        >
                          <span
                            class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
                            :class="getModality(m.modality).chip"
                          >
                            <span
                              class="size-1.5 rounded-full"
                              :class="getModality(m.modality).dot"
                            />
                            {{ getModality(m.modality).short }}
                            <span class="tabular-nums opacity-75">
                              {{ m.fileCountComplete ? "" : "~"
                              }}{{ formatCompact(m.fileCount) }}
                            </span>
                          </span>
                        </UTooltip>
                      </div>
                    </template>

                    <p v-else class="flex items-center gap-1.5 text-xs">
                      <UIcon name="i-lucide-scan-eye" class="size-3.5" />
                      Modality detection pending
                    </p>
                  </div>

                  <!-- Footer -->
                  <div
                    class="border-default mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs"
                  >
                    <span
                      v-if="dataset.imageFileCount"
                      class="flex items-center gap-1"
                    >
                      <UIcon name="i-lucide-images" class="size-3.5" />
                      <strong class="text-toned tabular-nums">
                        {{ formatNumber(dataset.imageFileCount) }}
                      </strong>
                      images
                    </span>

                    <span
                      v-if="dataset.maskFileCount"
                      class="flex items-center gap-1"
                    >
                      <UIcon name="i-lucide-layers" class="size-3.5" />
                      Includes
                      <strong class="text-toned tabular-nums">
                        {{ formatNumber(dataset.maskFileCount) }}
                      </strong>
                      masks
                    </span>

                    <span
                      v-if="dataset.versionCount > 0"
                      class="flex items-center gap-1"
                    >
                      <UIcon name="i-lucide-history" class="size-3.5" />
                      {{ dataset.versionCount }} other version{{
                        dataset.versionCount > 1 ? "s" : ""
                      }}
                    </span>

                    <span
                      v-if="dataset.keywords?.length"
                      class="flex flex-wrap items-center gap-1.5"
                    >
                      <UIcon name="i-lucide-tag" class="size-3.5" />
                      <UBadge
                        v-for="kw in visibleKeywords(dataset)"
                        :key="kw"
                        color="neutral"
                        variant="soft"
                        size="sm"
                        class="capitalize"
                      >
                        {{ kw }}
                      </UBadge>
                      <UButton
                        v-if="dataset.keywords.length > KEYWORD_PREVIEW_LIMIT"
                        size="xs"
                        variant="link"
                        class="px-0"
                        @click.prevent.stop="toggleKeywords(dataset.id)"
                      >
                        {{
                          expandedKeywords.has(dataset.id)
                            ? "Show less"
                            : `+${dataset.keywords.length - KEYWORD_PREVIEW_LIMIT}`
                        }}
                      </UButton>
                    </span>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </OverlayLoader>

          <div v-if="totalPages > 1" class="mt-8 flex justify-center">
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
