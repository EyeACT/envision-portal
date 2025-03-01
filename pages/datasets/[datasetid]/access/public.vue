<script setup lang="ts">
definePageMeta({
  layout: "public",
});

const route = useRoute();
const toast = useToast();

const azureUri = ref(
  "storageexplorer://v=1&accountid=/subscriptions/the_subscription_id/resourceGroups/the_resource_group_name/providers/Microsoft.Storage/storageAccounts/the_storage_account_name&subscriptionid=the_subscription_id&resourcetype=Azure.BlobContainer&resourcename=the_blob_container_name&sas=the_sas_token",
);

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
          <div class="col-span-11">
            <div class="flex flex-col gap-1">
              <h1>
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
            </div>
          </div>
        </div>

        <USeparator class="my-3" />

        <div class="mt-3 flex flex-col gap-4">
          <div class="w-max">
            <h2>How to download</h2>
          </div>

          <ul class="flex list-inside list-decimal flex-col gap-3">
            <li>
              Download and install
              <a
                href="https://azure.microsoft.com/en-us/features/storage-explorer/"
                target="_blank"
                class="text-blue-500"
                >Azure Storage Explorer</a
              >.
            </li>

            <li>
              Open Azure Storage Explorer and connect to your Azure account.
            </li>

            <li>Navigate to the following URI to access the dataset:</li>

            <UTextarea v-model="azureUri" class="w-full" />

            <li>
              Open the dataset URI in Azure Storage Explorer to browse the
              contents.
            </li>

            <li>
              Select the files you wish to download and choose "Download" from
              the context menu.
            </li>
          </ul>
        </div>
      </div>
    </UContainer>
  </div>
</template>
