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

const ITEMS_PER_PAGE = 5;
const page = ref(1);
const selectedKeyword = ref<string>("");
const searchQuery = ref<string>("");
type ExternalFilter = "all" | "external" | "non-external";
const externalFilter = ref<ExternalFilter>("all");

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const dateRange = shallowRef();

// Applied search term (sent to API when user submits search)
const appliedSearch = ref<string>("");

// Build query params for API (reactive so we refetch when filters or page change)
const queryParams = computed(() => {
  const params: Record<string, string | number> = {
    page: page.value,
    limit: ITEMS_PER_PAGE,
  };
  if (appliedSearch.value) {
    params.search = appliedSearch.value;
  }
  if (selectedKeyword.value) {
    params.keyword = selectedKeyword.value;
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
  return params;
});

const { data: response, error } = await useFetch<{
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

  return daysAgo === 0 ? "Today" : `${Math.abs(daysAgo)} days ago`;
};

const items = ref<AccordionItem[]>([
  { content: "", label: "Keywords" },
  { content: "", label: "Date Range" },
  { content: "", label: "External datasets" },
]);

// All keywords from current page datasets (for filter chips); for full list we'd need a separate API
const keywordsFromDatasets = computed(() =>
  Array.from(new Set(datasets.value.flatMap((ds) => ds.keywords))),
);

const searchDatasets = () => {
  appliedSearch.value = searchQuery.value.trim();
  page.value = 1;
};

const resetFilters = () => {
  selectedKeyword.value = "";
  dateRange.value = undefined;
  externalFilter.value = "all";
  appliedSearch.value = "";
  searchQuery.value = "";
  page.value = 1;
};

const hasActiveFilters = computed(() => {
  return (
    selectedKeyword.value !== "" ||
    dateRange.value !== undefined ||
    externalFilter.value !== "all" ||
    appliedSearch.value !== ""
  );
});

// When filters change, go back to page 1
watch([selectedKeyword, dateRange, externalFilter, appliedSearch], () => {
  page.value = 1;
});
</script>

<template>
  <div>
    <UContainer>
      <UBreadcrumb
        class="mb-4"
        :items="[{ label: 'All Datasets', to: '/datasets' }]"
      />

      <div class="flex flex-col gap-6 pt-2 md:flex-row">
        <div class="w-full md:w-1/5">
          <UAccordion type="multiple" :items="items">
            <template #content="{ item }">
              <div
                v-if="item.label === 'Keywords'"
                class="flex flex-wrap gap-2 p-2"
              >
                <UBadge
                  v-for="keyword in keywordsFromDatasets"
                  :key="keyword"
                  variant="soft"
                  class="cursor-pointer capitalize transition-all hover:bg-blue-100"
                  :color="keyword === selectedKeyword ? 'primary' : 'neutral'"
                  @click="
                    selectedKeyword = keyword === selectedKeyword ? '' : keyword
                  "
                >
                  {{ keyword }}
                </UBadge>
              </div>

              <div v-else-if="item.label === 'Date Range'" class="p-2">
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

              <div
                v-else-if="item.label === 'External datasets'"
                class="flex flex-col gap-2 p-2"
              >
                <UBadge
                  variant="soft"
                  class="cursor-pointer transition-all hover:bg-blue-100"
                  :color="externalFilter === 'all' ? 'primary' : 'neutral'"
                  @click="externalFilter = 'all'"
                >
                  All datasets
                </UBadge>
                <UBadge
                  variant="soft"
                  class="cursor-pointer transition-all hover:bg-blue-100"
                  :color="externalFilter === 'external' ? 'primary' : 'neutral'"
                  @click="externalFilter = 'external'"
                >
                  External only
                </UBadge>
                <UBadge
                  variant="soft"
                  class="cursor-pointer transition-all hover:bg-blue-100"
                  :color="
                    externalFilter === 'non-external' ? 'primary' : 'neutral'
                  "
                  @click="externalFilter = 'non-external'"
                >
                  Envision Portalonly
                </UBadge>
              </div>
            </template>
          </UAccordion>
        </div>

        <div class="flex w-full flex-col gap-4 md:w-4/5">
          <!-- search bar -->
          <div class="flex items-center gap-2">
            <UInput
              v-model="searchQuery"
              type="text"
              placeholder="Search datasets..."
              @keyup.enter="searchDatasets"
            />

            <UButton
              color="primary"
              variant="soft"
              icon="material-symbols:search"
              @click="searchDatasets"
            />
          </div>

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
                <strong class="text-gray-900">{{ datasets.length }}</strong>
                of
                <strong class="text-gray-900">{{ totalDatasets }}</strong>
                {{ totalDatasets === 1 ? "dataset" : "datasets" }}
              </span>

              <span v-if="hasActiveFilters" class="text-gray-400">
                (filtered)
              </span>
            </div>
          </div>

          <NuxtLink
            v-for="dataset in datasets"
            :key="dataset.id"
            :to="`/datasets/${dataset.id}`"
          >
            <UCard
              class="rounded-lg border border-gray-200 bg-white p-2 transition-all hover:shadow-lg"
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
                  Published on
                  <time :datetime="dayjs(dataset.created).toISOString()">
                    {{ dayjs(dataset.created).format("MMMM D, YYYY") }}
                  </time>

                  ({{ getDaysAgo(dataset.created) }})
                </p>
              </template>

              <div class="space-y-4">
                <p class="line-clamp-3 text-sm text-gray-500">
                  {{ dataset.description }}
                </p>

                <div v-if="dataset.keywords && dataset.keywords.length > 0">
                  <h3 class="text-md mb-1 font-semibold text-gray-500">
                    Keywords:
                  </h3>

                  <div class="flex flex-wrap gap-2">
                    <UBadge
                      v-for="keyword in dataset.keywords"
                      :key="keyword"
                      variant="outline"
                      class="text-xs capitalize"
                    >
                      {{ keyword }}
                    </UBadge>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="flex items-start gap-3 text-sm">
                    <div class="flex gap-2">
                      <Icon
                        name="charm:person"
                        size="12"
                        class="mt-1 text-blue-500"
                      />

                      <span class="min-w-[80px] font-medium text-gray-600">
                        Creators:
                      </span>
                    </div>
                    <div class="flex-wraptext-gray-700 flex">
                      <span
                        v-if="dataset.creators && dataset.creators.length > 0"
                      >
                        <span
                          v-for="(creator, index) in dataset.creators"
                          :key="index"
                          class="capitalize"
                        >
                          {{ creator.creatorName
                          }}<span v-if="index < dataset.creators.length - 1"
                            >,
                          </span>
                        </span>
                      </span>

                      <span v-else class="text-gray-400 italic">
                        No creators available
                      </span>
                    </div>
                  </div>

                  <div
                    class="flex items-start gap-3 text-sm"
                    v-if="dataset.versionCount > 0"
                  >
                    <div class="flex gap-2">
                      <Icon
                        name="mdi:file-document-multiple"
                        size="12"
                        class="mt-1 text-blue-500"
                      />

                      <span class="min-w-[80px] font-medium text-gray-600">
                        Versions:
                      </span>
                    </div>
                    <div class="flex-wraptext-gray-700 flex">
                      <span class="text-gray-700">
                        This dataset has {{ dataset.versionCount }} other
                        version{{ dataset.versionCount > 1 ? "s" : "" }}.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </NuxtLink>

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
