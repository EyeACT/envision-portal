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
              Step 1 - Download Azure Storage Explorer
            </h2>

            <p class="mb-4 text-gray-600">
              Azure Storage Explorer is a free desktop application from
              Microsoft that lets you connect directly to Azure Blob Storage and
              upload files without needing a command line. Download and install
              the version for your operating system before proceeding.
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
              System Requirements: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
            </p>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">
              Step 2 - Prepare and Validate Your Data
            </h2>

            <p class="mb-2 text-gray-600">
              Before uploading, run your files through the Data Validator to
              catch formatting issues early. The validator checks file
              structure, required fields, and naming conventions so that uploads
              succeed on the first attempt.
            </p>

            <div class="mb-4 flex gap-4">
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

            <p class="mb-2 text-gray-600">
              While preparing your data, make sure that:
            </p>

            <ul class="mb-4 list-inside list-disc space-y-1 text-gray-600">
              <li>
                Each file is in the expected format as specified by your study
                protocol
              </li>

              <li>
                All required fields are present and contain valid, non-empty
                values
              </li>

              <li>
                Subject identifiers and other sensitive fields are properly
                de-identified or anonymized before upload
              </li>

              <li>
                File names use only alphanumeric characters, hyphens, and
                underscores - avoid spaces and special characters
              </li>

              <li>
                No duplicate file names exist in your upload batch, as they will
                overwrite each other in the container
              </li>
            </ul>

            <p class="text-sm text-gray-500">
              Version 1.0.0 | Requires macOS 11+ or Windows 10+
            </p>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">
              Step 3 - Connect to Your Storage Container
            </h2>

            <p class="mb-2 text-gray-600">
              Use the SAS (Shared Access Signature) URL below to connect Azure
              Storage Explorer directly to this dataset's storage container. The
              URL encodes your access credentials and does not require a
              separate login.
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
              This URL expires at {{ expiration }}. Return to this page to
              generate a new one if it has expired.
            </p>

            <p class="mt-4 mb-2 text-gray-600">
              To connect in Azure Storage Explorer:
            </p>

            <ol class="mb-4 list-inside list-decimal space-y-1 text-gray-600">
              <li>Open Azure Storage Explorer</li>

              <li>
                Click the plug icon (<strong>Connect to Azure Resources</strong
                >) in the left sidebar
              </li>

              <li>
                Select <strong>ADLS Gen2 container or directory</strong>, then
                choose
                <strong>Shared access signature URL (SAS)</strong>
              </li>

              <li>Paste the SAS URL above into the URL field and click Next</li>

              <li>
                Confirm the connection details and click
                <strong>Connect</strong>
              </li>

              <li>
                The container will appear under
                <strong>Local &amp; Attached → Blob Containers</strong> in the
                left panel
              </li>
            </ol>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">Step 4 - Upload Files</h2>

            <p class="mb-2 text-gray-600">
              Once connected, upload your validated files to the container:
            </p>

            <ol class="mb-4 list-inside list-decimal space-y-1 text-gray-600">
              <li>
                Select the container you connected to in the left panel to open
                it
              </li>

              <li>
                Click the <strong>Upload</strong> button in the toolbar and
                choose <strong>Upload Files</strong> or
                <strong>Upload Folder</strong> as appropriate
              </li>

              <li>
                Browse to your validated files, select them, and confirm the
                upload
              </li>

              <li>
                Monitor upload progress in the
                <strong>Activities</strong> panel at the bottom of the window -
                each file will show a status of Completed or Failed
              </li>

              <li>
                If any files show as Failed, check the error message in the
                Activities panel and re-upload those files after resolving the
                issue
              </li>
            </ol>

            <p class="text-sm text-gray-500">
              Large uploads may take several minutes. Do not close Azure Storage
              Explorer until all files show a Completed status.
            </p>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">Step 5 - Verify Upload</h2>

            <p class="mb-2 text-gray-600">
              After the upload completes, confirm the following before closing
              Azure Storage Explorer:
            </p>

            <ul class="mb-4 list-inside list-disc space-y-1 text-gray-600">
              <li>
                All expected files appear in the container with the correct file
                names
              </li>

              <li>
                File sizes shown in Storage Explorer match the sizes of your
                local files
              </li>

              <li>
                No files are listed as 0 bytes, which would indicate a failed or
                incomplete transfer
              </li>

              <li>
                The total file count in the container matches the number of
                files you intended to upload
              </li>
            </ul>

            <p class="text-sm text-gray-500">
              If you encounter issues or see unexpected errors, contact support
              and include the error message from the Activities panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
