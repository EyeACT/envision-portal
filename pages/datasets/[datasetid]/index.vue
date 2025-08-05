<script setup lang="ts">
definePageMeta({
  layout: "public",
});

const route = useRoute();
const toast = useToast();

const downloadDropdownItems = ref([
  {
    icon: "material-symbols:public",
    label: "Download public dataset",
    onSelect: () => {
      navigateTo(`/datasets/${datasetid}/access/public`);
    },
  },
  {
    icon: "ri:git-repository-private-fill",
    label: "Request access to controlled dataset",
    onSelect: () => {
      navigateTo(`/datasets/${datasetid}/access/controlled`);
    },
  },
]);

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
  {
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
];

const treeItems = ref([
  {
    children: [
      {
        children: [
          {
            icon: "i-vscode-icons-file-type-typescript",
            label: "useAuth.ts",
          },
          {
            icon: "i-vscode-icons-file-type-typescript",
            label: "useUser.ts",
          },
        ],
        label: "composables/",
      },
      {
        children: [
          {
            icon: "i-vscode-icons-file-type-vue",
            label: "Card.vue",
          },
          {
            icon: "i-vscode-icons-file-type-vue",
            label: "Button.vue",
          },
        ],
        defaultExpanded: true,
        label: "components/",
      },
    ],
    defaultExpanded: true,
    label: "app/",
  },
  {
    icon: "i-vscode-icons-file-type-vue",
    label: "app.vue",
  },
  {
    icon: "i-vscode-icons-file-type-nuxt",
    label: "nuxt.config.ts",
  },
]);

const { datasetid } = route.params as { datasetid: string };

const { data: dataset, error } = await useFetch(
  `/api/discover/dataset/${datasetid}`,
);

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
          <div class="col-span-10">
            <div class="flex flex-col gap-1">
              <h1 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                {{ dataset?.title }}
              </h1>

              <UBadge class="w-max" color="primary" variant="outline">
                Version {{ dataset?.versionTitle }}
              </UBadge>
            </div>

            <div class="mt-3 flex flex-col gap-2">
              <div
                class="w-max border-b border-dashed border-slate-300 font-medium"
              >
                Description
              </div>

              <p class="text-sm text-gray-500">
                {{
                  dataset?.metadata.studyDescription.descriptionModule
                    .detailedDescription ||
                  dataset?.metadata.studyDescription.descriptionModule
                    .briefSummary ||
                  dataset?.description
                }}
              </p>

              <div
                class="w-max border-b border-dashed border-slate-300 font-medium"
              >
                Keywords
              </div>

              <div class="flex gap-2">
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
                {{ dataset?.metadata.datasetDescription.rights[0].rightsName }}
              </p>
            </div>
          </div>

          <div class="col-span-2">
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
                  />

                  <template #content>
                    <p class="max-w-sm p-2 text-sm">
                      This dataset is hosted on an external platform. Visit the
                      link to get the dataset access details.
                    </p>
                  </template>
                </UPopover>
              </NuxtLink>

              <UDropdownMenu
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
              </UDropdownMenu>

              <UButton
                v-if="!dataset?.external"
                label="Cite"
                icon="flowbite:quote-solid"
                size="xl"
                color="neutral"
              />

              <USeparator class="my-1" />

              <div class="flex items-center gap-2 pt-2">
                <Icon name="flowbite:quote-solid" />

                <span class="text-primary font-semibold">64 citations</span>
              </div>

              <div class="flex items-center gap-2">
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

            <template #files>
              <UTree multiple :items="dataset?.files || []" />
            </template>

            <template #versions>
              <DatasetVersions :metadata="dataset?.versionTitle" />
            </template>
          </UTabs>
        </div>
      </div>
    </UContainer>
  </div>
</template>
