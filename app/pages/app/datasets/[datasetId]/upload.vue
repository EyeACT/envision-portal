<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as { datasetId: string };

const sasUrl = ref("");
const expiration = ref("");

const { data, error } = await useFetch(`/api/datasets/${datasetId}/upload`, {});

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  // await navigateTo("/");
}

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  sasUrl.value = data.value.sasUrl;
  expiration.value = data.value.expiration;
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({
      title: "URL copied to clipboard",
      icon: "i-mdi-check",
    });
  } catch {
    toast.add({
      title: "Failed to copy URL",
      description: "Please try again",
      icon: "i-mdi-alert",
    });
  }
};
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.title, to: `/app/datasets/${datasetId}` },
        { label: 'Upload Data', to: `/app/datasets/${datasetId}/upload` },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Data Upload Guide
            </h1>

            <p class="text-lg font-normal">
              Follow this step-by-step guide to securely upload your study data
              to our Azure storage system. Each step includes important
              information to ensure a successful upload process.
            </p>
          </div>
        </div>
      </div>

      <div
        class="mb-6 flex flex-col items-start gap-3 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">
              Download Storage Explorer
            </h2>

            <p class="mb-4 text-gray-600">
              Azure Storage Explorer is a free tool that makes it easy to manage
              your files in Azure storage. It provides a user-friendly interface
              for uploading, downloading, and managing your data.
            </p>

            <div class="flex gap-4">
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

            <p class="mt-2 text-sm text-gray-500">
              System Requirements: Windows 10/11, macOS 10.15+, or Linux (Ubuntu
              18.04+)
            </p>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">Access Azure Storage</h2>

            <p class="mb-2 text-gray-600">
              Use the following Azure storage URL to connect to your study's
              storage container. You'll need this URL when setting up Azure
              Storage Explorer.
            </p>

            <div class="flex items-center gap-6 bg-gray-50 p-2">
              <pre class="rounded font-mono text-base break-all">{{
                sasUrl
              }}</pre>

              <UButton
                icon="i-mdi-content-copy"
                color="neutral"
                variant="ghost"
                @click="copyToClipboard(sasUrl)"
              />
            </div>

            <p class="mt-2 text-sm text-gray-500">
              This URL will expire at {{ expiration }}.
            </p>

            <p class="mt-2 text-sm text-gray-500">
              Tip: Save this URL for future reference. You'll need it each time
              you want to access your study's storage.
            </p>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">Validate Your Data</h2>

            <p class="mb-4 text-gray-600">
              Our Data Validator application helps ensure your data meets all
              requirements before upload. It checks file formats, data
              structure, and required fields, reducing the chance of upload
              failures and data issues.
            </p>

            <div class="flex gap-4">
              <UButton
                to="https://envisionportal.blob.core.windows.net/apps/data-validator/DataValidator.dmg"
                target="_blank"
                color="primary"
                variant="soft"
                icon="i-mdi-apple"
              >
                Download for macOS
              </UButton>

              <UButton
                to="https://envisionportal.blob.core.windows.net/apps/data-validator/DataValidator.exe"
                target="_blank"
                color="primary"
                variant="soft"
                icon="i-mdi-microsoft-windows"
              >
                Download for Windows
              </UButton>
            </div>

            <p class="mt-2 text-sm text-gray-500">
              Version 1.0.0 | Requires macOS 11+ or Windows 10+
            </p>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">Prepare Your Data</h2>

            <p class="mb-2 text-gray-600">
              Before uploading, ensure your data is properly organized:
            </p>

            <ul class="mb-4 list-inside list-disc space-y-1 text-gray-600">
              <li>
                Files should be in the correct format (CSV, JSON, or specified
                format)
              </li>

              <li>
                Data should be properly structured according to study
                requirements
              </li>

              <li>
                All required fields should be present and properly formatted
              </li>

              <li>Sensitive data should be properly anonymized</li>

              <li>File names should be clear and descriptive</li>
            </ul>

            <p class="text-sm text-gray-500">
              Use the Data Validator application to check your data meets all
              requirements.
            </p>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">Upload Files</h2>

            <p class="mb-2 text-gray-600">Using Azure Storage Explorer:</p>

            <ol class="mb-4 list-inside list-disc space-y-1 text-gray-600">
              <li>Open Azure Storage Explorer</li>

              <li>
                Connect to your study's storage using the URL provided above
              </li>

              <li>Navigate to the correct container</li>

              <li>
                Drag and drop your validated files or use the upload button
              </li>

              <li>Monitor the upload progress</li>
            </ol>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">Verify Upload</h2>

            <p class="mb-2 text-gray-600">After uploading, verify that:</p>

            <ul class="mb-4 list-inside list-disc space-y-1 text-gray-600">
              <li>All files have been successfully uploaded</li>

              <li>File sizes match your original files</li>

              <li>You can open and view the files in Azure Storage Explorer</li>

              <li>File permissions are set correctly</li>
            </ul>

            <p class="text-sm text-gray-500">
              If you encounter any issues, contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
