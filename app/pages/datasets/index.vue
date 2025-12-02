<script setup lang="ts">
import dayjs from "dayjs";
import type { AccordionItem } from "@nuxt/ui";

definePageMeta({ layout: "public" });

useSeoMeta({
  title: "All Datasets",
});

const toast = useToast();

const { data: datasets, error } = await useFetch<Dataset[]>(
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

const selectedLabelingMethod = ref<string>("");
const selectedValidationInfo = ref<string>("");
const selectedKeyword = ref<string>("");

const keywords = computed(() => {
  const allKeywords =
    datasets.value?.flatMap(
      (ds) =>
        ds.publishedMetadata?.studyDescription?.conditionsModule?.keywordList?.map(
          (kw: { keywordValue: string }) => kw.keywordValue,
        ) || [],
    ) || [];

  return Array.from(new Set(allKeywords));
});

const labelingMethods = computed(() =>
  Array.from(
    new Set(
      (datasets.value || [])
        .map((ds) => ds.labelingMethod)
        .filter((v): v is string => typeof v === "string" && v.trim() !== ""),
    ),
  ),
);

const validationInfos = computed(() =>
  Array.from(
    new Set(
      (datasets.value || [])
        .map((ds) => ds.validationInfo)
        .filter((v): v is string => typeof v === "string" && v.trim() !== ""),
    ),
  ),
);

const items = ref<AccordionItem[]>([
  { content: "", label: "Keywords" },
  { content: "", label: "Method" },
  { content: "", label: "Validation" },
]);

const filteredDatasets = computed(() => {
  let list = datasets.value || [];

  if (selectedKeyword.value) {
    list = list.filter((dataset) =>
      dataset.publishedMetadata?.studyDescription?.conditionsModule?.keywordList?.some(
        (keyword: { keywordValue: string }) =>
          keyword.keywordValue.toLowerCase() ===
          selectedKeyword.value.toLowerCase(),
      ),
    );
  }

  if (selectedLabelingMethod.value) {
    list = list.filter(
      (dataset) => dataset.labelingMethod === selectedLabelingMethod.value,
    );
  }

  if (selectedValidationInfo.value) {
    list = list.filter(
      (dataset) => dataset.validationInfo === selectedValidationInfo.value,
    );
  }

  return list;
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
                  v-for="keyword in keywords"
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

              <div
                v-else-if="item.label === 'Method'"
                class="flex flex-wrap gap-2 p-2"
              >
                <UBadge
                  v-for="method in labelingMethods"
                  :key="method || 'unknown-method'"
                  variant="soft"
                  class="cursor-pointer transition-all hover:bg-blue-100"
                  :color="
                    method === selectedLabelingMethod ? 'primary' : 'neutral'
                  "
                  @click="
                    selectedLabelingMethod =
                      method === selectedLabelingMethod ? '' : method
                  "
                >
                  {{ method }}
                </UBadge>
              </div>

              <div
                v-else-if="item.label === 'Validation'"
                class="flex flex-wrap gap-2 p-2"
              >
                <UBadge
                  v-for="info in validationInfos"
                  :key="info || 'unknown-validation'"
                  variant="soft"
                  class="cursor-pointer transition-all hover:bg-blue-100"
                  :color="
                    info === selectedValidationInfo ? 'primary' : 'neutral'
                  "
                  @click="
                    selectedValidationInfo =
                      info === selectedValidationInfo ? '' : info
                  "
                >
                  {{ info }}
                </UBadge>
              </div>
            </template>
          </UAccordion>
        </div>

        <div class="flex w-full flex-col gap-4 md:w-4/5">
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
                      v-for="keyword in dataset.publishedMetadata
                        ?.studyDescription?.conditionsModule?.keywordList ?? []"
                      :key="keyword.keywordValue"
                      variant="outline"
                      class="text-xs"
                    >
                      {{ keyword.keywordValue }}
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
                        v-if="
                          dataset.publishedMetadata?.datasetDescription
                            ?.creator &&
                          dataset.publishedMetadata.datasetDescription.creator
                            .length
                        "
                      >
                        <span
                          v-for="(creator, index) in dataset.publishedMetadata
                            .datasetDescription.creator"
                          :key="index"
                        >
                          {{ creator.creatorName
                          }}<span
                            v-if="
                              index <
                              dataset.publishedMetadata.datasetDescription
                                .creator.length -
                                1
                            "
                            >,
                          </span>
                        </span>
                      </span>

                      <span v-else class="text-gray-400 italic">
                        No creators available
                      </span>
                    </span>
                  </div>

                  <div class="flex items-center gap-3 text-sm">
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
                  </div>

                  <div
                    v-if="
                      dataset.publishedMetadata?.datasetDescription.rights
                        ?.length
                    "
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
                        v-for="(right, index) in dataset.publishedMetadata
                          .datasetDescription.rights"
                        :key="index"
                      >
                        {{ right.rightsName }}
                        <span
                          v-if="
                            index <
                            dataset.publishedMetadata.datasetDescription.rights
                              .length -
                              1
                          "
                          >,
                        </span>
                      </span>
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
