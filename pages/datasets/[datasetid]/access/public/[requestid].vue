<script setup lang="ts">
import * as z from "zod";
import { faker } from "@faker-js/faker";
import type { FormSubmitEvent } from "@nuxt/ui";

definePageMeta({
  layout: "public",
});

const route = useRoute();
const toast = useToast();

const azureUri = ref("");
const expiration = ref("");

const { datasetid, requestid } = route.params as {
  datasetid: string;
  requestid: string;
};

const { data: dataset, error } = await useFetch(
  `/api/discover/dataset/${datasetid}/access/public/${requestid}`,
);

if (error.value) {
  toast.add({
    title: "Error fetching dataset request",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  // await navigateTo(`/datasets/${datasetid}/access/public`);
}

if (dataset.value) {
  useSeoMeta({
    title: dataset.value.title,
  });

  azureUri.value = dataset.value.sasUrl;
  expiration.value = dataset.value.expiration;
}

const copyToClipboard = (text: string) => {
  if (!navigator.clipboard) {
    toast.add({
      title: "Clipboard not supported",
      color: "error",
      description: "Please try again later",
      icon: "material-symbols:error",
    });
  }

  navigator.clipboard.writeText(text);

  toast.add({
    title: "Copied to clipboard",
    color: "success",
    icon: "material-symbols:content-copy",
  });
};
</script>

<template>
  <div>
    <UContainer>
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
          { label: 'All Datasets', to: '/datasets' },
          { label: dataset?.title, to: `/datasets/${datasetid}` },
          {
            label: 'Public Access',
            to: `/datasets/${datasetid}/access/public`,
          },
          { label: 'Approved Request' },
        ]"
      />

      <div class="flex flex-col gap-6 pt-4">
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-11">
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
                  dataset?.metadata?.studyDescription?.descriptionModule
                    ?.detailedDescription ||
                  dataset?.metadata?.studyDescription?.descriptionModule
                    ?.briefSummary ||
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
        </div>

        <USeparator class="my-3" />

        <div class="rounded-xl dark:bg-gray-900">
          <h2 class="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
            Access Instructions
          </h2>

          <div class="space-y-6">
            <!-- Download Storage Explorer -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Download Storage Explorer
              </h3>

              <p class="text-gray-600 dark:text-gray-400">
                Azure Storage Explorer is a free tool that makes it easy to
                manage your files in Azure storage. It provides a user-friendly
                interface for uploading, downloading, and managing your data.
              </p>

              <div class="flex flex-wrap gap-3">
                <UButton
                  to="https://azure.microsoft.com/en-us/products/storage/storage-explorer/#download"
                  target="_blank"
                  color="primary"
                  variant="soft"
                  icon="i-mdi-microsoft-windows"
                >
                  Windows
                </UButton>

                <UButton
                  to="https://azure.microsoft.com/en-us/products/storage/storage-explorer/#download"
                  target="_blank"
                  color="primary"
                  variant="soft"
                  icon="i-mdi-apple"
                >
                  macOS
                </UButton>

                <UButton
                  to="https://azure.microsoft.com/en-us/products/storage/storage-explorer/#download"
                  target="_blank"
                  color="primary"
                  variant="soft"
                  icon="i-mdi-linux"
                >
                  Linux
                </UButton>
              </div>

              <p class="text-sm text-gray-500 dark:text-gray-400">
                System Requirements: Windows 10/11, macOS 10.15+, or Linux
                (Ubuntu 18.04+)
              </p>
            </div>

            <USeparator />

            <!-- Access Azure Storage -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Access Azure Storage
              </h3>

              <p class="text-gray-600 dark:text-gray-400">
                Use the following Azure storage URL to connect to your study's
                storage container. You'll need this URL when setting up Azure
                Storage Explorer.
              </p>

              <div
                class="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
              >
                <pre
                  class="flex-1 overflow-x-auto rounded font-mono text-sm break-all text-gray-900 dark:text-white"
                  >{{ azureUri }}</pre
                >

                <UButton
                  icon="i-mdi-content-copy"
                  color="neutral"
                  variant="ghost"
                  class="flex-shrink-0"
                  @click="copyToClipboard(azureUri)"
                />
              </div>

              <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <p>This URL will expire at {{ expiration }}.</p>

                <p>
                  Tip: Save this URL for future reference. You'll need it each
                  time you want to access your study's storage.
                </p>
              </div>
            </div>

            <USeparator />

            <!-- Connect to Storage Explorer -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Connect to Storage Explorer
              </h3>

              <p class="text-gray-600 dark:text-gray-400">
                Follow these steps to connect Azure Storage Explorer to your
                dataset:
              </p>

              <ol class="list-inside list-decimal space-y-3">
                <li class="text-gray-900 dark:text-white">
                  Click <strong>"Attach to resource"</strong> in the "Get
                  Started" tab of Storage Explorer
                </li>
                <li class="text-gray-900 dark:text-white">
                  Select <strong>"ADLS Gen2 container or directory"</strong>
                </li>
                <li class="text-gray-900 dark:text-white">
                  Choose
                  <strong>"Shared access signature URL (SAS)"</strong>
                </li>
                <li class="text-gray-900 dark:text-white">
                  Paste the Azure storage URL from above and provide a display
                  name if desired
                </li>
              </ol>

              <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div class="flex gap-3">
                  <UIcon
                    name="i-mdi-information"
                    class="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400"
                  />
                  <div class="text-sm text-blue-800 dark:text-blue-200">
                    <p class="font-medium">Pro Tip:</p>
                    <p>
                      You can give your connection a descriptive name like "{{
                        dataset?.title
                      }}
                      Dataset" to easily identify it in Storage Explorer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
