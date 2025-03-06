<script setup lang="ts">
import * as z from "zod";
import { faker } from "@faker-js/faker";

definePageMeta({
  layout: "public",
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { user } = useUserSession();

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

const tabItems = [
  {
    icon: "solar:folder-with-files-line-duotone",
    label: "Files",
    slot: "files",
  },
  {
    icon: "material-symbols:data-usage",
    label: "Data Use Agreement",
    slot: "data-use-agreement",
  },
  {
    icon: "icon-park-outline:list",
    label: "Access Requests",
    slot: "access-requests",
  },
];

const schema = z.object({
  affiliation: z.string().min(1, "Must be at least 1 character"),
  email: z.string().email("Invalid email"),
  familyName: z.string().min(1, "Must be at least 1 character"),
  givenName: z.string().min(1, "Must be at least 1 character"),
  reasonForAccess: z.string().min(1, "Must be at least 1 character"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  affiliation: undefined,
  email: user.value?.emailAddress,
  familyName: undefined,
  givenName: undefined,
  reasonForAccess: undefined,
});

const requests = ref({
  approved: [
    {
      id: faker.string.nanoid(10),
      reason: faker.lorem.sentences(3),
      status: "approved",
      timeChanged: faker.date.anytime(),
      timeCreated: faker.date.anytime(),
    },
  ],
  denied: [
    {
      id: faker.string.nanoid(10),
      reason: faker.lorem.sentences(3),
      status: "denied",
      timeChanged: faker.date.anytime(),
      timeCreated: faker.date.anytime(),
    },
    {
      id: faker.string.nanoid(10),
      reason: faker.lorem.sentences(3),
      status: "denied",
      timeChanged: faker.date.anytime(),
      timeCreated: faker.date.anytime(),
    },
  ],
  expired: [
    {
      id: faker.string.nanoid(10),
      reason: faker.lorem.sentences(3),
      status: "expired",
      timeChanged: faker.date.anytime(),
      timeCreated: faker.date.anytime(),
    },
    {
      id: faker.string.nanoid(10),
      reason: faker.lorem.sentences(3),
      status: "expired",
      timeChanged: faker.date.anytime(),
      timeCreated: faker.date.anytime(),
    },
  ],
  pending: [
    {
      id: faker.string.nanoid(10),
      reason: faker.lorem.sentences(3),
      status: "pending",
      timeChanged: faker.date.anytime(),
      timeCreated: faker.date.anytime(),
    },
    {
      id: faker.string.nanoid(10),
      reason: faker.lorem.sentences(3),
      status: "pending",
      timeChanged: faker.date.anytime(),
      timeCreated: faker.date.anytime(),
    },
  ],
});
</script>

<template>
  <div>
    <UContainer>
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
          { label: 'Home', to: '/' },
          { label: 'All Datasets', to: '/datasets' },
          { label: dataset?.title, to: `/datasets/${datasetid}` },
          { label: 'Controlled Access' },
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
          <UTabs
            :items="tabItems"
            default-value="2"
            orientation="horizontal"
            class="w-full gap-4"
            :ui="{ trigger: 'cursor-pointer' }"
          >
            <template #files>
              <UTree multiple :items="dataset?.files" />
            </template>

            <template #data-use-agreement>
              <UForm :schema="schema" :state="state" class="space-y-4">
                <UFormField label="Given Name" name="givenName">
                  <UInput v-model="state.givenName" />
                </UFormField>

                <UFormField label="Family Name" name="familyName">
                  <UInput v-model="state.familyName" />
                </UFormField>

                <UFormField label="Affiliation" name="affiliation">
                  <UInput v-model="state.affiliation" />
                </UFormField>

                <UFormField label="Email" name="email">
                  <UInput v-model="state.email" disabled />
                </UFormField>

                <UFormField label="Reason for Access" name="reasonForAccess">
                  <UTextarea v-model="state.reasonForAccess" class="w-full" />
                </UFormField>

                <UButton type="submit"> Submit </UButton>
              </UForm>
            </template>

            <template #access-requests>
              <div class="flex flex-col gap-8">
                <h2>All Requests</h2>

                <UCard
                  v-for="request in [
                    ...requests.approved,
                    ...requests.pending,
                    ...requests.expired,
                    ...requests.denied,
                  ]"
                  :key="request.id"
                >
                  <template #header>
                    <div class="flex items-center justify-end gap-2">
                      <span class="text-xs">
                        {{ request.id }}
                      </span>

                      <UBadge
                        :color="
                          request.status === 'approved'
                            ? 'success'
                            : request.status === 'denied'
                              ? 'error'
                              : request.status === 'expired'
                                ? 'warning'
                                : 'neutral'
                        "
                        variant="outline"
                        class="w-max"
                      >
                        {{ request.status }}
                      </UBadge>
                    </div>
                  </template>

                  <p class="text-sm">
                    {{ request.reason }}
                  </p>

                  <template #footer>
                    <div class="flex justify-between gap-2">
                      <div class="flex gap-2">
                        <span class="text-sm">
                          Updated on
                          <time>
                            {{
                              $dayjs(request.timeChanged).format("MMM D, YYYY")
                            }}
                          </time>
                        </span>
                      </div>

                      <UButton
                        v-if="request.status === 'approved'"
                        label="View access instructions"
                        icon="material-symbols:arrow-right"
                        size="sm"
                        color="primary"
                      />
                    </div>
                  </template>
                </UCard>
              </div>
            </template>
          </UTabs>
        </div>
      </div>
    </UContainer>
  </div>
</template>
