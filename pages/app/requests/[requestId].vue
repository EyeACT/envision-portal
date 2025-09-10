<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { requestId } = route.params as { requestId: string };

const sasUrl = ref("");
const expiration = ref("");

const { data, error } = await useFetch(`/api/requests/${requestId}`, {});

if (error.value) {
  toast.add({
    title: "Error fetching request",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

if (data.value) {
  useSeoMeta({
    title: `Request - ${data.value.Dataset?.title || "Unknown Dataset"}`,
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

// Get status display information
const getStatusInfo = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return {
        color: "success",
        description:
          "Your request has been approved. You can now access the dataset.",
        icon: "i-mdi-check-circle",
        text: "Approved",
      };
    case "rejected":
      return {
        color: "error",
        description:
          "Your request has been rejected. Please contact the dataset owner for more information.",
        icon: "i-mdi-close-circle",
        text: "Rejected",
      };
    case "pending":
      return {
        color: "warning",
        description:
          "Your request is currently under review. You will be notified once a decision is made.",
        icon: "i-mdi-clock",
        text: "Pending Review",
      };
    case "under_review":
      return {
        color: "primary",
        description:
          "Your request is being actively reviewed by the dataset team.",
        icon: "i-mdi-eye",
        text: "Under Review",
      };
    case "expired":
      return {
        color: "neutral",
        description:
          "Your request has expired. You may need to submit a new request.",
        icon: "i-mdi-calendar-expire",
        text: "Expired",
      };
    default:
      return {
        color: "neutral",
        description: "The status of your request is currently unknown.",
        icon: "i-mdi-help-circle",
        text: status || "Unknown",
      };
  }
};

// Format date for display
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";

  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  });
};
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-6 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'My Requests', to: '/app/requests' },
        { label: data?.Dataset?.title || 'Unknown Dataset' },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-10">
      <!-- Header Section -->
      <div class="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900">
        <div class="flex flex-col gap-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ data?.Dataset?.title || "Unknown Dataset" }}
              </h1>

              <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
                {{ data?.Dataset?.description || "No description available" }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <UBadge
                v-if="data?.PublishedDataset.public"
                variant="subtle"
                size="lg"
              >
                Public Dataset
              </UBadge>

              <!-- Status Badge -->

              <UBadge
                v-if="data?.status"
                variant="soft"
                size="lg"
                :color="getStatusInfo(data.status).color as any"
              >
                {{ getStatusInfo(data.status).text }}
              </UBadge>
            </div>
          </div>

          <USeparator />

          <!-- Status Description -->
          <div v-if="data?.status">
            <p class="text-sm">
              {{ getStatusInfo(data.status).description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Request Details Section -->
      <div class="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900">
        <h2 class="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          Request Details
        </h2>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <!-- Requester Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Requester Information
            </h3>

            <div class="space-y-3">
              <div class="flex justify-between">
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-400"
                  >Name:</span
                >

                <span class="text-sm text-gray-900 dark:text-white">
                  {{ data?.givenName }} {{ data?.familyName }}
                </span>
              </div>

              <div class="flex justify-between">
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-400"
                  >Email:</span
                >

                <span class="text-sm text-gray-900 dark:text-white">
                  {{ data?.emailAddress }}
                </span>
              </div>

              <div class="flex justify-between">
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-400"
                  >Affiliation:</span
                >

                <span class="text-sm text-gray-900 dark:text-white">
                  {{ data?.affiliation || "Not specified" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Request Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Request Information
            </h3>

            <div class="space-y-3">
              <div class="flex justify-between">
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-400"
                  >Request ID:</span
                >

                <span class="font-mono text-sm text-gray-900 dark:text-white">
                  {{ data?.id }}
                </span>
              </div>

              <div class="flex justify-between">
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-400"
                  >Submitted:</span
                >

                <span class="text-sm text-gray-900 dark:text-white">
                  {{ formatDate(data?.created) }}
                </span>
              </div>

              <div class="flex justify-between">
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-400"
                  >Last Updated:</span
                >

                <span class="text-sm text-gray-900 dark:text-white">
                  {{ formatDate(data?.updated) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reason for Access -->
        <div class="mt-6 space-y-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Reason for Access
          </h3>

          <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ data?.reasonForAccess || "No reason provided" }}
            </p>
          </div>
        </div>

        <!-- Comments -->
        <div v-if="data?.comment" class="mt-6 space-y-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Additional Comments
          </h3>

          <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ data.comment }}
            </p>
          </div>
        </div>
      </div>

      <!-- Dataset Information Section -->
      <div class="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900">
        <h2 class="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          Dataset Information
        </h2>

        <div class="flex flex-col gap-2">
          <div class="flex justify-between">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
              >Version:</span
            >

            <span class="text-sm text-gray-900 dark:text-white">
              {{ data?.Dataset?.version || "Latest" }}
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
              >DOI:</span
            >

            <ULink
              :to="`https://doi.org/${data?.Dataset?.doi}`"
              target="_blank"
              class="text-sm hover:underline"
              color="info"
            >
              {{ data?.Dataset?.doi || "Not assigned" }}
            </ULink>
          </div>
        </div>
      </div>

      <!-- Access Instructions Section (only show if approved) -->
      <div
        v-if="data?.status === 'approved'"
        class="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900"
      >
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
              Azure Storage Explorer is a free tool that makes it easy to manage
              your files in Azure storage. It provides a user-friendly interface
              for uploading, downloading, and managing your data.
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
              System Requirements: Windows 10/11, macOS 10.15+, or Linux (Ubuntu
              18.04+)
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
                >{{ sasUrl }}</pre
              >

              <UButton
                icon="i-mdi-content-copy"
                color="neutral"
                variant="ghost"
                class="flex-shrink-0"
                @click="copyToClipboard(sasUrl)"
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
        </div>
      </div>
    </div>
  </div>
</template>
