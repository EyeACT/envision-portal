<script setup lang="ts">
definePageMeta({
  layout: "public",
});

const route = useRoute();
const toast = useToast();

const tabItems = [
  {
    icon: "solar:bill-list-bold",
    label: "Metadata",
    slot: "metadata",
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

const metadataTabItems = [
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

const { data: dataset, error } = await useFetch(`/api/datasets/${datasetid}`);

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
          { label: 'Home', to: '/' },
          { label: 'All Datasets', to: '/datasets' },
        ]"
      />

      <div class="flex flex-col gap-6">
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-10">
            <div class="flex flex-col gap-1">
              <h1>
                {{ dataset?.title }}
              </h1>

              <UBadge class="w-max" color="primary" variant="outline">
                Version {{ dataset?.versionTitle }}
              </UBadge>
            </div>

            <div class="flex flex-col gap-2">
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
                    .conditionsModule.keywordList"
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
                    .conditionsModule.conditionList"
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
              <UButton
                label="Download"
                icon="line-md:download-loop"
                size="xl"
                color="primary"
              />

              <UButton
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
            <template #metadata>
              <UTabs
                :items="metadataTabItems"
                variant="link"
                orientation="horizontal"
                class="w-full gap-4"
                :ui="{ trigger: 'cursor-pointer' }"
              >
                <template #study-metadata> study-metadata </template>

                <template #dataset-metadata> dataset-metadata </template>

                <template #healthsheet> healthsheet </template>
              </UTabs>

              <pre>
            {{ dataset?.metadata }}
          </pre
              >
            </template>

            <template #files> <UTree multiple :items="treeItems" /> </template>
          </UTabs>
        </div>
      </div>
    </UContainer>
  </div>
</template>
