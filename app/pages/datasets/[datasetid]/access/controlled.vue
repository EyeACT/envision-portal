<script setup lang="ts">
import type { InternalApi } from "nitropack/types";
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

definePageMeta({
  layout: "public",
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { user } = useUserSession();

const loading = ref(false);

const { datasetid } = route.params as { datasetid: string };

const { data: dataset, error } = await useFetch<
  InternalApi["/api/discover/dataset/:datasetid"]["get"]
>(`/api/discover/dataset/${datasetid}`);

if (error.value) {
  toast.add({
    title: "Error fetching dataset",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo("/datasets");
}

// Public datasets don't need a review
if (dataset.value?.public) {
  await navigateTo(`/datasets/${datasetid}/access/public`, { replace: true });
}

if (dataset.value) {
  useSeoMeta({
    title: dataset.value.title,
  });
}

// The requester's earlier requests for this dataset version
const { data: myRequests, refresh: refreshRequests } = await useFetch(
  "/api/requests",
  {
    transform: (requests) =>
      requests.filter(
        (request) => String(request.publishedDatasetId) === datasetid,
      ),
  },
);

const openRequest = computed(() =>
  myRequests.value?.find((request) =>
    ["pending", "approved"].includes(request.status),
  ),
);

const schema = z.object({
  affiliation: z.string().trim().min(1, "Affiliation is required"),
  familyName: z.string().trim().min(1, "Family name is required"),
  givenName: z.string().trim().min(1, "Given name is required"),
  reasonForAccess: z
    .string()
    .trim()
    .min(1, "Tell the dataset team how you plan to use the data"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  affiliation: "",
  familyName: user.value?.familyName ?? "",
  givenName: user.value?.givenName ?? "",
  reasonForAccess: "",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;

  await $fetch(`/api/discover/dataset/${datasetid}/access/request-controlled`, {
    body: event.data,
    method: "POST",
  })
    .then(async (response) => {
      toast.add({
        title: "Request submitted",
        description: "The dataset team will review your request.",
        icon: "material-symbols:check-circle-outline",
      });

      await navigateTo(`/app/requests/${response.id}`);
    })
    .catch(async (err) => {
      toast.add({
        title: "Error submitting request",
        color: "error",
        description: err.data?.statusMessage ?? "Please try again later",
        icon: "material-symbols:error",
      });

      await refreshRequests();
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

<template>
  <div>
    <UContainer class="pb-12">
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
          { label: 'All Datasets', to: '/datasets' },
          { label: dataset?.title, to: `/datasets/${datasetid}` },
          { label: 'Request Access' },
        ]"
      />

      <div class="flex flex-col gap-6 pt-4">
        <div class="flex flex-col gap-1">
          <UBadge class="w-max" color="primary" variant="outline">
            Version {{ dataset?.versionTitle }}
          </UBadge>

          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ dataset?.title }}
          </h1>
        </div>

        <USeparator class="my-3" />

        <!-- Already has an open request -->
        <UAlert
          v-if="openRequest"
          icon="material-symbols:info"
          :color="openRequest.status === 'approved' ? 'success' : 'info'"
          variant="soft"
          :title="
            openRequest.status === 'approved'
              ? 'Your request was approved'
              : 'Your request is being reviewed'
          "
          :description="
            openRequest.status === 'approved'
              ? 'Open your request to get the download link.'
              : 'The dataset team will notify you when they make a decision or need a signed data use agreement.'
          "
          :actions="[
            {
              label: 'View my request',
              to: `/app/requests/${openRequest.id}`,
              color: 'neutral',
              variant: 'outline',
            },
          ]"
        />

        <template v-else>
          <UAlert
            icon="ri:git-repository-private-fill"
            color="warning"
            variant="soft"
            title="This dataset has controlled access"
            description="The dataset team reviews each request and may ask you to sign a data use agreement. You can follow your request from My Requests."
          />

          <UForm
            :schema="schema"
            :state="state"
            class="space-y-6"
            @submit="onSubmit"
          >
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <UFormField label="Given Name" name="givenName" required>
                <UInput v-model="state.givenName" class="w-full" />
              </UFormField>

              <UFormField label="Family Name" name="familyName" required>
                <UInput v-model="state.familyName" class="w-full" />
              </UFormField>
            </div>

            <UFormField label="Affiliation" name="affiliation" required>
              <UInput v-model="state.affiliation" class="w-full" />
            </UFormField>

            <UFormField
              label="Email"
              description="Requests are linked to your account email."
            >
              <UInput
                :model-value="user?.emailAddress"
                disabled
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Reason for Access"
              name="reasonForAccess"
              required
            >
              <UTextarea
                v-model="state.reasonForAccess"
                class="w-full"
                :rows="6"
                placeholder="Describe your research question and how you plan to use this dataset..."
              />
            </UFormField>

            <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <UButton
                type="button"
                size="lg"
                variant="outline"
                icon="i-lucide-arrow-left"
                @click="navigateTo(`/datasets/${datasetid}`)"
              >
                Back
              </UButton>

              <UButton
                type="submit"
                size="lg"
                :loading="loading"
                icon="i-lucide-send"
              >
                Submit request
              </UButton>
            </div>
          </UForm>
        </template>

        <!-- Earlier requests for this dataset -->
        <div v-if="myRequests?.length" class="flex flex-col gap-3">
          <USeparator class="my-3" />

          <h2 class="text-lg font-medium">Your requests for this dataset</h2>

          <NuxtLink
            v-for="request in myRequests"
            :key="request.id"
            :to="`/app/requests/${request.id}`"
          >
            <UCard class="transition-shadow hover:shadow-md">
              <div class="flex items-center justify-between gap-3">
                <p class="line-clamp-1 text-sm">
                  {{ request.reasonForAccess }}
                </p>

                <div class="flex shrink-0 items-center gap-3">
                  <span class="text-xs text-gray-500">
                    {{ $dayjs(request.updated).format("MMM D, YYYY") }}
                  </span>

                  <UBadge
                    :color="requestStatusColor(request.status)"
                    variant="soft"
                    class="capitalize"
                  >
                    {{ request.status }}
                  </UBadge>
                </div>
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </div>
    </UContainer>
  </div>
</template>
