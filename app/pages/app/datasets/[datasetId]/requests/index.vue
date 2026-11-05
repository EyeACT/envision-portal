<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as { datasetId: string };

const { data, error } = await useFetch(`/api/datasets/${datasetId}/requests`);

if (error.value) {
  toast.add({
    title: "Error fetching data requests",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

useSeoMeta({
  title: data.value ? `${data.value.dataset.title} | Data Requests` : "Data Requests",
});

const statusFilter = ref("pending");

const statusTabs = computed(() => {
  const requests = data.value?.requests ?? [];
  const count = (status: string) =>
    requests.filter((request) => request.status === status).length;

  return [
    { label: `Pending (${count("pending")})`, value: "pending" },
    { label: `Approved (${count("approved")})`, value: "approved" },
    { label: `Rejected (${count("rejected")})`, value: "rejected" },
    { label: `Revoked (${count("revoked")})`, value: "revoked" },
    { label: `All (${requests.length})`, value: "all" },
  ];
});

const filteredRequests = computed(() => {
  const requests = data.value?.requests ?? [];

  if (statusFilter.value === "all") return requests;

  return requests.filter((request) => request.status === statusFilter.value);
});

const agreementStage = (request: {
  agreements: { unsigned: string | null; signed: string | null; final: string | null };
}) => {
  if (request.agreements.final) return "DUA countersigned";
  if (request.agreements.signed) return "DUA signed by requester";
  if (request.agreements.unsigned) return "DUA sent";

  return null;
};
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.dataset.title, to: `/app/datasets/${datasetId}` },
        {
          label: 'Data Requests',
          to: `/app/datasets/${datasetId}/requests`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-10">
      <div
        class="flex flex-col gap-3 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Data Requests
          </h1>

          <UBadge
            v-if="data?.dataset.status === 'published'"
            :color="data.dataset.public ? 'success' : 'warning'"
            variant="soft"
            size="lg"
          >
            {{ data.dataset.public ? "Public" : "Controlled" }} access
          </UBadge>
        </div>

        <p class="text-base text-gray-500 dark:text-gray-400">
          <template v-if="data?.dataset.status !== 'published'">
            People can request access once this version is published.
          </template>

          <template v-else-if="!data.dataset.public">
            Requests for this version wait for an owner or admin to approve
            them. Open a request to review it or send a data use agreement.
          </template>

          <template v-else>
            This version is public, so requests are approved automatically.
            You can still revoke access for any request.
          </template>
        </p>
      </div>

      <UTabs
        v-model="statusFilter"
        :items="statusTabs"
        :content="false"
        variant="link"
        class="w-full"
      />

      <div class="flex flex-col gap-3">
        <p
          v-if="filteredRequests.length === 0"
          class="py-8 text-center text-gray-500 dark:text-gray-400"
        >
          No {{ statusFilter === "all" ? "" : statusFilter }} requests.
        </p>

        <NuxtLink
          v-for="datasetRequest in filteredRequests"
          :key="datasetRequest.id"
          :to="`/app/datasets/${datasetId}/requests/${datasetRequest.id}`"
        >
          <UCard class="transition-shadow hover:shadow-md">
            <div class="flex flex-col gap-3">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 class="text-lg font-medium">
                    {{ datasetRequest.givenName }}
                    {{ datasetRequest.familyName }}
                  </h2>

                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ datasetRequest.affiliation }} ·
                    {{ datasetRequest.emailAddress }}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <UBadge
                    v-if="agreementStage(datasetRequest)"
                    variant="outline"
                    color="neutral"
                  >
                    {{ agreementStage(datasetRequest) }}
                  </UBadge>

                  <UBadge
                    :color="requestStatusColor(datasetRequest.status)"
                    variant="soft"
                    class="capitalize"
                  >
                    {{ datasetRequest.status }}
                  </UBadge>
                </div>
              </div>

              <p class="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                {{ datasetRequest.reasonForAccess }}
              </p>

              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  Submitted {{ displayDateDifference(datasetRequest.created) }}
                  ago
                </span>

                <USeparator orientation="vertical" class="h-3" />

                <span>
                  Updated {{ displayDateDifference(datasetRequest.updated) }}
                  ago
                </span>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
