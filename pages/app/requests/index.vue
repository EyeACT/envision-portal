<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "My Requests",
});

const toast = useToast();

// Search query and filter variables
const searchQuery = ref("");

const { data: requests, error } = await useFetch("/api/requests", {
  method: "GET",
});

if (error.value) {
  toast.add({
    title: "Error fetching requests",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

// Filter requests based on search query
const filteredRequests = computed(() => {
  if (!requests.value) return [];

  if (!searchQuery.value) return requests.value;

  return requests.value.filter(
    (request) =>
      request.Dataset?.title
        ?.toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      request.Dataset?.description
        ?.toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      request.reasonForAccess
        ?.toLowerCase()
        .includes(searchQuery.value.toLowerCase()),
  );
});

// Get status display text
const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "pending":
      return "Pending Review";
    case "under_review":
      return "Under Review";
    default:
      return status || "Unknown";
  }
};

const dropdownItems = ref([
  {
    icon: "i-lucide-user",
    label: "Profile",
  },
  {
    icon: "i-lucide-credit-card",
    label: "Billing",
  },
  {
    icon: "i-lucide-cog",
    label: "Settings",
  },
]);
</script>

<template>
  <div>
    <div class="flex w-full flex-col gap-6">
      <div
        class="flex flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            My Requests
          </h1>

          <p class="text-lg font-normal">View all your requests for datasets</p>
        </div>
      </div>

      <!-- Controls & Filtering -->
      <div class="flex gap-4">
        <UInput
          v-model="searchQuery"
          type="text"
          placeholder="Filter requests..."
          size="lg"
        />

        <UDropdownMenu
          :items="dropdownItems"
          :content="{
            align: 'end',
            side: 'bottom',
            sideOffset: 8,
          }"
          :ui="{
            content: 'w-48',
          }"
        >
          <UButton
            label="Filter"
            icon="material-symbols:filter-list"
            color="primary"
            variant="outline"
          />
        </UDropdownMenu>
      </div>

      <!-- Requests Grid -->
      <div class="mb-5 flex flex-col gap-3">
        <div v-if="filteredRequests.length === 0" class="py-8 text-center">
          <p class="text-gray-500 dark:text-gray-400">
            {{
              searchQuery
                ? "No requests match your search criteria."
                : "No requests found."
            }}
          </p>
        </div>

        <ULink
          v-for="request in filteredRequests"
          :key="request.id"
          :to="`/app/requests/${request.id}`"
        >
          <UCard class="transition-shadow hover:shadow-md">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <h2 class="text-primary-500 truncate text-lg font-semibold">
                    {{ request.Dataset?.title || "Untitled Dataset" }}
                  </h2>

                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Requested by {{ request.givenName }}
                    {{ request.familyName }}
                  </p>
                </div>

                <UBadge
                  :color="
                    request.status === 'approved'
                      ? 'success'
                      : request.status === 'rejected'
                        ? 'error'
                        : request.status === 'pending'
                          ? 'info'
                          : request.status === 'expired'
                            ? 'warning'
                            : 'neutral'
                  "
                  variant="subtle"
                  size="lg"
                  class="flex-shrink-0 capitalize"
                >
                  {{ request.status }}
                </UBadge>
              </div>
            </template>

            <div>
              <!-- Dataset Description -->
              <p v-if="request.Dataset?.description" class="text-default">
                {{ request.Dataset.description }}
              </p>

              <USeparator class="my-3" />

              <!-- Reason for Access -->
              <div v-if="request.reasonForAccess">
                <h4
                  class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Reason for Access:
                </h4>

                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ request.reasonForAccess }}
                </p>
              </div>
            </div>

            <USeparator class="my-3" />

            <div class="flex items-center justify-between">
              <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <p>
                  <span class="font-medium">Created:</span>
                  {{ displayDateDifference(request.created) }} ago
                </p>

                <USeparator orientation="vertical" class="h-3" />

                <p>
                  <span class="font-medium">Updated:</span>
                  {{ displayDateDifference(request.updated) }} ago
                </p>
              </div>
            </div>
          </UCard>
        </ULink>
      </div>
    </div>
  </div>
</template>
