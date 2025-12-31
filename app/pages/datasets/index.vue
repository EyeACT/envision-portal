<script setup lang="ts">
import dayjs from "dayjs";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";
import type { AccordionItem } from "@nuxt/ui";
import type { DiscoveryDatasetList } from "#shared/types/dataset";

definePageMeta({ layout: "public" });

useSeoMeta({
  title: "All Datasets",
});

const toast = useToast();

const { data: datasets, error } = await useFetch<DiscoveryDatasetList[]>(
  "/api/discover/dataset",
);

if (error.value) {
  toast.add({
    title: "Error fetching datasets",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

const getDaysAgo = (date: string | Date): string => {
  const daysAgo = dayjs(date).diff(dayjs(), "day");

  return daysAgo === 0 ? "Today" : `${Math.abs(daysAgo)} days ago`;
};

const selectedKeyword = ref<string>("");
const searchQuery = ref<string>("");

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const dateRange = shallowRef();

const items = ref<AccordionItem[]>([
  { content: "", label: "Keywords" },
  { content: "", label: "Date Range" },
]);

const filteredDatasets = computed(() => {
  let list = datasets.value || [];

  if (selectedKeyword.value) {
    list = list.filter((dataset) =>
      dataset.keywords.some(
        (keyword) =>
          keyword.toLowerCase() === selectedKeyword.value.toLowerCase(),
      ),
    );
  }

  if (dateRange.value?.start && dateRange.value?.end) {
    const startDate = dateRange.value.start.toDate(getLocalTimeZone());
    const endDate = dateRange.value.end.toDate(getLocalTimeZone());

    list = list.filter((dataset) => {
      const datasetDate = dayjs(dataset.created).toDate();
      return datasetDate >= startDate && datasetDate <= endDate;
    });
  } else if (dateRange.value?.start) {
    const startDate = dateRange.value.start.toDate(getLocalTimeZone());

    list = list.filter((dataset) => {
      const datasetDate = dayjs(dataset.created).toDate();
      return datasetDate >= startDate;
    });
  }

  return list;
});

const searchDatasets = () => {
  // todo: implement search
  console.log(searchQuery.value);
};

const resetFilters = () => {
  selectedKeyword.value = "";
  dateRange.value = undefined;
};

const hasActiveFilters = computed(() => {
  return selectedKeyword.value !== "" || dateRange.value !== undefined;
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
                  v-for="keyword in Array.from(
                    new Set(filteredDatasets.flatMap((ds) => ds.keywords)),
                  )"
                  :key="keyword"
                  variant="soft"
                  class="cursor-pointer transition-all hover:bg-blue-100"
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
                      icon: { size: { sm: 'h-4 w-4' } },
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
                      :ui="{
                        base: 'text-sm',
                        cell: {
                          base: 'rounded-md transition-all',
                          selected:
                            'bg-primary-500 text-white hover:bg-primary-600',
                          range: 'bg-primary-100',
                        },
                        header: {
                          base: 'text-gray-700 font-semibold',
                        },
                      }"
                      :number-of-months="2"
                      range
                    />
                  </template>
                </UPopover>
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
                <strong class="text-gray-900">{{
                  filteredDatasets.length
                }}</strong>
                <span
                  v-if="filteredDatasets.length !== (datasets?.length ?? 0)"
                >
                  of
                  <strong class="text-gray-900">{{
                    datasets?.length ?? 0
                  }}</strong>
                </span>
                {{ filteredDatasets.length === 1 ? "dataset" : "datasets" }}
              </span>

              <span v-if="hasActiveFilters" class="text-gray-400">
                (filtered)
              </span>
            </div>
          </div>

          <NuxtLink
            v-for="dataset in filteredDatasets"
            :key="dataset.id"
            :to="`/datasets/${dataset.id}`"
          >
            <UCard
              class="rounded-lg border border-gray-200 bg-white p-2 transition-all hover:shadow-lg"
            >
              <template #header>
                <div class="flex flex-col">
                  <div class="flex items-center justify-between gap-2">
                    <div class="mb-1 flex items-center gap-2">
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
                      text="This dataset was found via our automated discovery process."
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
                            : "Automated Discovery"
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
                <p class="text-sm text-gray-500">
                  {{ dataset.description }}
                </p>

                <div>
                  <h3 class="text-md mb-1 font-semibold text-gray-500">
                    Keywords:
                  </h3>

                  <div class="flex flex-wrap gap-2">
                    <UBadge
                      v-for="keyword in dataset.keywords"
                      :key="keyword"
                      variant="outline"
                      class="text-xs"
                    >
                      {{ keyword }}
                    </UBadge>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="flex items-center gap-3 text-sm">
                    <Icon name="charm:person" size="14" class="text-blue-500" />

                    <span class="min-w-[100px] font-medium text-gray-600">
                      Creators:
                    </span>

                    <span class="text-gray-700">
                      <span
                        v-if="dataset.creators && dataset.creators.length > 0"
                      >
                        <span
                          v-for="(creator, index) in dataset.creators"
                          :key="index"
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
                    </span>
                  </div>

                  <!-- <div class="flex items-center gap-3 text-sm">
                    <Icon name="mdi:label" size="14" class="text-green-500" />

                    <span class="min-w-[100px] font-medium text-gray-600"
                      >Method:</span
                    >

                    <span class="text-gray-700">
                      <span v-if="dataset.labelingMethod">
                        {{ dataset.labelingMethod }}
                      </span>

                      <span v-else class="text-gray-400 italic">
                        Not specified
                      </span>
                    </span>
                  </div>

                  <div class="flex items-center gap-3 text-sm">
                    <Icon
                      name="mdi:check-circle"
                      size="14"
                      class="text-purple-500"
                    />

                    <span class="min-w-[100px] font-medium text-gray-600"
                      >Validation:</span
                    >

                    <span class="text-gray-700">
                      <span v-if="dataset.validationInfo">
                        {{ dataset.validationInfo }}
                      </span>

                      <span v-else class="text-gray-400 italic">
                        Not specified
                      </span>
                    </span>
                  </div> -->

                  <div
                    v-if="dataset.rights && dataset.rights.length > 0"
                    class="flex items-center gap-3 text-sm"
                  >
                    <Icon
                      name="mdi:file-document"
                      size="14"
                      class="text-orange-500"
                    />

                    <span class="min-w-[100px] font-medium text-gray-600"
                      >License:</span
                    >

                    <span class="text-gray-700">
                      <span
                        v-for="(right, index) in dataset.rights"
                        :key="index"
                      >
                        {{ right }}
                        <span v-if="index < dataset.rights.length - 1">, </span>
                      </span>
                    </span>
                  </div>

                  <div
                    class="flex items-center gap-3 text-sm"
                    v-if="dataset.versionCount > 0"
                  >
                    <Icon
                      name="mdi:file-document-multiple"
                      size="14"
                      class="text-blue-500"
                    />
                    <span class="min-w-[100px] font-medium text-gray-600"
                      >Versions:</span
                    >
                    <span class="text-gray-700">
                      This dataset has {{ dataset.versionCount }} other
                      version{{ dataset.versionCount > 1 ? "s" : "" }}.
                    </span>
                  </div>
                </div>
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </div>
    </UContainer>
  </div>
</template>
