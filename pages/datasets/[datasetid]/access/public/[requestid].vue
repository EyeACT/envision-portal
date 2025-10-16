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
  <div class="min-h-screen w-full">
    <UContainer class="relative min-h-full">
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

      <div class="flex min-h-full flex-1 flex-col gap-6 pt-4">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <UBadge class="w-max" color="primary" variant="outline">
              Version {{ dataset?.versionTitle }}
            </UBadge>

            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ dataset?.title }}
            </h1>
          </div>
        </div>

        <USeparator class="my-3" />

        <UAlert
          icon="material-symbols:check-circle"
          color="success"
          variant="soft"
          title="Access Request Approved"
          description="Your request has been approved! Follow the steps below to access your dataset."
        />

        <div class="rounded-xl dark:bg-gray-900">
          <h2 class="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
            Access Instructions
          </h2>

          <ol class="space-y-8">
            <li class="space-y-4">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                >
                  1
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Download Storage Explorer
                </h3>
              </div>

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
            </li>

            <USeparator />

            <li class="space-y-4">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                >
                  2
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Access Azure Storage
                </h3>
              </div>

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
            </li>

            <USeparator />

            <li class="space-y-4">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                >
                  3
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Connect to Storage Explorer
                </h3>
              </div>

              <p class="text-gray-600 dark:text-gray-400">
                Follow these steps to connect Azure Storage Explorer to your
                dataset:
              </p>

              <ol class="ml-4 list-inside list-decimal space-y-3">
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

              <UAlert
                icon="material-symbols:lightbulb"
                color="info"
                variant="soft"
                title="Pro Tip"
                :description="`You can give your connection a descriptive name like '${dataset?.title} Dataset' to easily identify it in Storage Explorer.`"
              />
            </li>
          </ol>
        </div>
      </div>
    </UContainer>
  </div>
</template>
