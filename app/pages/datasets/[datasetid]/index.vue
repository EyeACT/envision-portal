<script setup lang="ts">
import dayjs from "dayjs";
import type { InternalApi } from "nitropack/types";
definePageMeta({
  layout: "public",
});

const route = useRoute();
const toast = useToast();

// const downloadDropdownItems = ref([
//   {
//     icon: "material-symbols:public",
//     label: "Download public dataset",
//     onSelect: () => {
//       navigateTo(`/datasets/${datasetid}/access/public`);
//     },
//   },
//   {
//     icon: "ri:git-repository-private-fill",
//     label: "Request access to controlled dataset",
//     onSelect: () => {
//       navigateTo(`/datasets/${datasetid}/access/controlled`);
//     },
//   },
// ]);

/** Scholardata API response for dataset index by DOI */
interface DatasetIndexResponse {
  datasetId: number;
  totalCitations: number;
  totalMentions: number;
  fujiScore?: {
    score: number;
    evaluationDate: string;
    metricVersion: string;
    softwareVersion: string;
  };
  latestDIndex?: {
    score: number;
    created: string;
  };
}

const datasetIndexSpinner = ref(true);

const datasetIndexData = ref<DatasetIndexResponse | null>(null);

const { datasetid } = route.params as { datasetid: string };

const { data: dataset, error } = await useFetch<
  InternalApi["/api/discover/dataset/:datasetid"]["get"]
>(`/api/discover/dataset/${datasetid}`);

if (error.value) {
  toast.add({
    title: "Error fetching dataset",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo("/datasets");
}

if (dataset.value) {
  useSeoMeta({
    title: dataset.value.title,
  });
}

const tabItems = [
  {
    icon: "ri:information-line",
    label: "About",
    slot: "about",
  },
  {
    icon: "solar:bill-list-bold",
    label: "Study Metadata",
    slot: "study-metadata",
  },
  {
    icon: "solar:folder-with-files-line-duotone",
    label: "Dataset Metadata",
    slot: "dataset-metadata",
  },
  dataset.value?.external
    ? {
        icon: "solar:lock-keyhole-minimalistic-line-duotone",
        label: "Access Conditions",
        slot: "access-conditions",
      }
    : {
        icon: "solar:history-line-duotone",
        label: "Healthsheet",
        slot: "healthsheet",
      },
  {
    icon: "solar:folder-with-files-line-duotone",
    label: "Files",
    slot: "files",
  },
  {
    icon: "solar:history-line-duotone",
    label: "Versions",
    slot: "versions",
  },
  {
    icon: "solar:history-line-duotone",
    label: "Metrics",
    slot: "metrics"
  }
];

const accessType = computed(() => {
  const requiresRequest = dataset.value?.access?.requiresAccessRequest;

  if (requiresRequest === true) {
    return {
      color: "warning" as const,
      description:
        "You need to request access from the hosting platform before downloading this dataset.",
      label: "Access request required",
    };
  }

  if (requiresRequest === false) {
    return {
      color: "success" as const,
      description:
        "This dataset can be downloaded from the hosting platform without an access request.",
      label: "Open access",
    };
  }

  return {
    color: "neutral" as const,
    description:
      "We could not find the access requirements for this dataset. Check the hosting platform for details.",
    label: "Unknown",
  };
});

const embargoActive = computed(() => {
  const embargoUntil = dataset.value?.access?.embargoUntil;

  return embargoUntil ? dayjs(embargoUntil).isAfter(dayjs()) : false;
});

const getDatasetIndex = async () => {
  await $fetch(`/api/discover/dataset/${datasetid}/datasetIndex`)
    .then((data) => {
      datasetIndexData.value = data as DatasetIndexResponse;
    })
    .catch((err: string) => {
      console.error("Error fetching dataset index", err);
    })
    .finally(() => {
      datasetIndexSpinner.value = false;
    });
};

const generateCombinedFullName = (name: string) => {
  const nameArray = name.split(",");

  if (nameArray.length > 1) {
    return `${nameArray[1]} ${nameArray[0]}`;
  } else {
    return name;
  }
};

onMounted(() => {
  getDatasetIndex();
});
</script>

<template>
  <div>
    <UContainer>
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
          { label: 'All Datasets', to: '/datasets' },
          { label: dataset?.title, to: `/datasets/${datasetid}` },
        ]"
      />

      <div class="flex flex-col gap-6 pt-4">
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-9">
            <div class="flex flex-col">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ dataset?.title }}
              </h1>

              <div
                class="flex flex-row flex-wrap items-center align-middle text-black"
              >
                <div
                  v-for="(creator, index) in dataset?.metadata
                    .datasetDescription.creator"
                  :key="index"
                >
                  <!-- if on the last index create a different span -->
                  <span class="text-sm font-light">{{
                    creator.nameType === "Organizational"
                      ? creator.creatorName
                      : generateCombinedFullName(creator.creatorName)
                  }}</span>

                  <ButtonIdentifierBadge
                    v-if="creator?.nameIdentifier"
                    class="pt-1"
                    :type="creator.nameIdentifier[0] || {}"
                  />

                  <span
                    v-if="
                      dataset?.metadata.datasetDescription.creator &&
                      index !=
                        dataset?.metadata.datasetDescription.creator.length - 1
                    "
                    class="mr-1 text-sm"
                    >,
                  </span>
                </div>
              </div>

              <UBadge class="mt-2 w-max" color="primary" variant="outline">
                Version {{ dataset?.versionTitle }}
              </UBadge>
            </div>

            <div class="mt-3 flex flex-col gap-2">
              <div
                class="w-max border-b border-dashed border-slate-300 font-medium"
                v-if="
                  dataset?.metadata?.studyDescription?.conditionsModule
                    ?.keywordList &&
                  dataset?.metadata?.studyDescription?.conditionsModule
                    ?.keywordList?.length > 0
                "
              >
                Keywords
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="item in dataset?.metadata?.studyDescription
                    ?.conditionsModule?.keywordList"
                  :key="item.keywordValue"
                  color="primary"
                  size="sm"
                  variant="outline"
                >
                  {{ item.keywordValue }}
                </UBadge>
              </div>

              <div
                class="w-max border-b border-dashed border-slate-300 font-medium"
                v-if="
                  dataset?.metadata?.studyDescription?.conditionsModule
                    ?.conditionList &&
                  dataset?.metadata?.studyDescription?.conditionsModule
                    ?.conditionList?.length > 0
                "
              >
                Conditions
              </div>

              <div class="flex gap-2">
                <UBadge
                  v-for="item in dataset?.metadata?.studyDescription
                    .conditionsModule?.conditionList"
                  :key="item.conditionName"
                  color="primary"
                  size="sm"
                  variant="outline"
                >
                  {{ item.conditionName }}
                </UBadge>
              </div>

              <div
                class="w-max border-b border-dashed border-slate-300 font-medium"
              >
                License
              </div>

              <p class="text-sm text-gray-500">
                {{
                  dataset?.metadata.datasetDescription.rights[0]?.rightsName ||
                  "Unknown"
                }}
              </p>
            </div>
          </div>

          <div class="col-span-3">
            <div class="flex flex-col gap-2">
              <NuxtLink
                v-if="dataset?.external"
                :to="dataset?.externalUrl || '#'"
                target="_blank"
              >
                <UPopover mode="hover" arrow>
                  <UButton
                    label="Access Dataset"
                    icon="mingcute:external-link-fill"
                    size="xl"
                    variant="subtle"
                    color="warning"
                    class="w-full"
                  />

                  <template #content>
                    <p class="max-w-sm p-2 text-sm">
                      This dataset is hosted on an external platform. Visit the
                      link to get the dataset access details.
                    </p>
                  </template>
                </UPopover>
              </NuxtLink>

              <!-- <UDropdownMenu
                v-else
                :items="downloadDropdownItems"
                :content="{
                  align: 'end',
                  side: 'bottom',
                  sideOffset: 8,
                }"
                :ui="{
                  content: 'w-max',
                }"
              >
                <UButton
                  label="Download"
                  icon="line-md:download-loop"
                  size="xl"
                  color="primary"
                />
              </UDropdownMenu> -->

              <UButton
                v-if="!dataset?.external"
                :label="
                  dataset?.public ? 'Get access to dataset' : 'Request access'
                "
                :icon="
                  dataset?.public
                    ? 'line-md:download-loop'
                    : 'ri:git-repository-private-fill'
                "
                size="xl"
                color="primary"
                :to="`/datasets/${datasetid}/access/${dataset?.public ? 'public' : 'controlled'}`"
              />

              <p
                v-if="!dataset?.external && !dataset?.public"
                class="text-center text-xs text-gray-500"
              >
                Controlled access. The dataset team reviews each request.
              </p>

              <!-- Hidden: Cite has no action yet
              <UButton
                v-if="!dataset?.external"
                label="Cite"
                icon="flowbite:quote-solid"
                size="xl"
                color="neutral"
              />
              -->

              <USeparator class="my-1" />

              <div v-if="datasetIndexData">
                <div class="grid grid-cols-2 gap-x-4 gap-y-2.5 text-center">
                  <div class="flex flex-col items-center gap-0.5">
                    <span
                      class="text-[10px] font-medium tracking-wide text-gray-500 uppercase"
                    >
                      Dataset Index
                    </span>

                    <span class="text-base font-semibold text-emerald-700">
                      {{
                        datasetIndexData?.latestDIndex?.score != null
                          ? datasetIndexData?.latestDIndex?.score.toFixed(1)
                          : "—"
                      }}
                    </span>
                  </div>

                  <div class="flex flex-col items-center gap-0.5">
                    <span
                      class="text-[10px] font-medium tracking-wide text-gray-500 uppercase"
                    >
                      FAIR score
                    </span>

                    <span class="text-base font-semibold text-emerald-700">
                      {{
                        datasetIndexData?.fujiScore?.score != null
                          ? `${Math.round(datasetIndexData?.fujiScore?.score)}%`
                          : "—"
                      }}
                    </span>
                  </div>

                  <div class="flex flex-col items-center gap-0.5">
                    <span
                      class="text-[10px] font-medium tracking-wide text-gray-500 uppercase"
                    >
                      Citations
                    </span>

                    <span
                      class="text-base font-semibold text-emerald-700"
                      :class="{
                        'text-emerald-700': datasetIndexData?.totalCitations,
                        'text-gray-500': !datasetIndexData?.totalCitations,
                      }"
                    >
                      {{ datasetIndexData?.totalCitations }}
                    </span>
                  </div>

                  <div class="flex flex-col items-center gap-0.5">
                    <span
                      class="text-[10px] font-medium tracking-wide text-gray-500 uppercase"
                    >
                      Mentions
                    </span>

                    <span
                      class="text-base font-semibold"
                      :class="{
                        'text-emerald-700': datasetIndexData?.totalMentions,
                        'text-gray-500': !datasetIndexData?.totalMentions,
                      }"
                    >
                      {{ datasetIndexData?.totalMentions }}
                    </span>
                  </div>
                </div>

                <p
                  class="mt-3 flex items-center justify-center gap-1 text-xs text-yellow-500"
                >
                  <UIcon name="i-heroicons-exclamation-triangle" />
                  Platform is currently in beta
                </p>

                <USeparator class="my-1" type="dashed" />

                <div
                  v-if="datasetIndexData?.datasetId"
                  class="flex justify-center pt-2"
                >
                  <a
                    :href="`https://beta.scholardata.io/datasets/${datasetIndexData?.datasetId}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-xs font-medium text-teal-600 no-underline hover:text-teal-700 hover:underline"
                  >
                    View more details on Scholar Data
                    <UIcon name="i-heroicons-arrow-right" />
                  </a>
                </div>
              </div>

              <div class="flex hidden items-center gap-2 pt-2">
                <Icon name="flowbite:quote-solid" />

                <span class="text-primary font-semibold">64 citations</span>
              </div>

              <div class="flex hidden items-center gap-2">
                <Icon name="solar:eye-bold" />

                <span class="text-primary font-semibold">1.1k views</span>
              </div>
            </div>
          </div>
        </div>

        <USeparator class="my-3" />

        <div>
          <UTabs
            :items="tabItems"
            orientation="horizontal"
            class="w-full gap-4"
            :ui="{ trigger: 'cursor-pointer' }"
          >
            <template #about>
              <MarkdownRenderer
                :content="dataset?.metadata?.readme"
                class="pb-5"
              />
            </template>

            <template #study-metadata>
              <MetadataStudy :metadata="dataset?.metadata?.studyDescription" />
            </template>

            <template #dataset-metadata>
              <MetadataDataset
                :metadata="dataset!.metadata!.datasetDescription"
              />
            </template>

            <template #healthsheet>
              <MetadataHealthSheet
                :metadata="
                  (dataset?.metadata?.healthsheet || {}) as HealthsheetRecords
                "
              />
            </template>

            <template #access-conditions>
              <div class="flex flex-col gap-6 pb-5">
                <div class="flex flex-col gap-2">
                  <h3 class="font-semibold">Access type</h3>

                  <div>
                    <UBadge :color="accessType.color" variant="subtle">
                      {{ accessType.label }}
                    </UBadge>
                  </div>

                  <p class="text-sm text-gray-500">
                    {{ accessType.description }}
                  </p>
                </div>

                <div class="flex flex-col gap-2">
                  <h3 class="font-semibold">Conditions</h3>

                  <p
                    v-if="dataset?.access?.accessConditions"
                    class="text-sm whitespace-pre-line text-gray-600"
                  >
                    {{ dataset.access.accessConditions }}
                  </p>

                  <p v-else class="text-sm text-gray-400 italic">
                    No access conditions were provided for this dataset.
                  </p>
                </div>

                <div
                  v-if="dataset?.access?.embargoUntil"
                  class="flex flex-col gap-2"
                >
                  <h3 class="font-semibold">Embargo</h3>

                  <p class="text-sm text-gray-600">
                    {{ embargoActive ? "Embargoed until" : "Embargo ended on" }}
                    <time
                      :datetime="
                        dayjs(dataset.access.embargoUntil).toISOString()
                      "
                    >
                      {{
                        dayjs(dataset.access.embargoUntil).format(
                          "MMMM D, YYYY",
                        )
                      }}
                    </time>
                  </p>
                </div>

                <div class="flex flex-col gap-2">
                  <h3 class="font-semibold">License</h3>

                  <p class="text-sm text-gray-600">
                    {{
                      dataset?.metadata.datasetDescription.rights[0]
                        ?.rightsName || "Unknown"
                    }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-if="dataset?.access?.accessRequestUrl"
                    :to="dataset.access.accessRequestUrl"
                    target="_blank"
                    label="Request access"
                    icon="mingcute:external-link-fill"
                    color="warning"
                  />

                  <UButton
                    v-if="dataset?.externalUrl"
                    :to="dataset.externalUrl"
                    target="_blank"
                    :label="
                      dataset.access?.datasetSource
                        ? `View on ${dataset.access.datasetSource}`
                        : 'View on hosting platform'
                    "
                    icon="mingcute:external-link-fill"
                    variant="outline"
                  />
                </div>
              </div>
            </template>

            <template #files>
              <UTree
                v-if="!dataset?.external"
                multiple
                :items="dataset?.files || []"
              />

              <div
                v-else
                class="my-20 flex justify-center font-semibold text-gray-400 italic"
              >
                This dataset is hosted on an external platform. Click on the
                "Access Dataset" button above to get the dataset files.
              </div>
            </template>

            <template #versions>
              <SideVersionSelector
                :id="dataset?.id || ''"
                :versions="dataset?.versions || []"
              />
            </template>

            <template #metrics>
              <h2 class="mb-2 text-sm font-semibold text-gray-900 uppercase dark:text-white">Modalities</h2>

              <div v-if="dataset?.modalities.length" class="grid grid-cols-2 gap-4">
                <UCard v-for="modalityRecord in dataset?.modalities">
                  <div class="flex flex-col items-center gap-1 py-2 text-center">
                    <div class="text-3xl font-bold text-green-500">
                      {{ (modalityRecord.fileCount ?? 0).toLocaleString() }}
                    </div>
                    <p class="text-sm font-medium">{{ modalityRecord.modality }} files.</p>
                  </div>
                </UCard> 
              </div>

              <div v-else>
                <p>A modality breakdown for this dataset is not available at this moment.</p>
              </div>

            </template>
          </UTabs>
        </div>
      </div>
    </UContainer>
  </div>
</template>
