<script setup lang="ts">
import * as z from "zod";
import { faker } from "@faker-js/faker";
import type { FormSubmitEvent } from "@nuxt/ui";

definePageMeta({
  layout: "public",
});

const route = useRoute();
const toast = useToast();

const { loggedIn, user } = useUserSession();

const loading = ref(false);

const { datasetid } = route.params as { datasetid: string };

const { data: dataset, error } = await useFetch(
  `/api/discover/dataset/${datasetid}`,
);

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

const schema = z.object({
  affiliation: z.string().min(1, "Must be at least 1 character"),
  email: z.string().email("Invalid email"),
  familyName: z.string().min(1, "Must be at least 1 character"),
  givenName: z.string().min(1, "Must be at least 1 character"),
  reasonForAccess: z.string().min(1, "Must be at least 1 character"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  affiliation: faker.company.name(),
  email: loggedIn.value ? user.value?.emailAddress : faker.internet.email(),
  familyName: faker.person.lastName(),
  givenName: faker.person.firstName(),
  reasonForAccess: faker.lorem.sentences(6),
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const body = {
    affiliation: event.data.affiliation,
    email: event.data.email,
    familyName: event.data.familyName,
    givenName: event.data.givenName,
    reasonForAccess: event.data.reasonForAccess,
  };

  loading.value = true;

  await $fetch(`/api/discover/dataset/${datasetid}/access/public`, {
    body,
    method: "POST",
  })
    .then(async (response) => {
      toast.add({
        title: "Request submitted",
        description: "Your request has been submitted",
        icon: "material-symbols:check-circle-outline",
      });

      await navigateTo(`/datasets/${datasetid}/access/public/${response.id}`);
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Error submitting request",
        color: "error",
        description: error.data.statusMessage,
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

<template>
  <div>
    <UContainer>
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
          { label: 'All Datasets', to: '/datasets' },
          { label: dataset?.title, to: `/datasets/${datasetid}` },
          { label: 'Public Access' },
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
                  dataset?.metadata.studyDescription.descriptionModule
                    .detailedDescription ||
                  dataset?.metadata.studyDescription.descriptionModule
                    .briefSummary ||
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

        <h2 class="text-lg font-medium">
          This dataset requires some information to be submitted. Your request
          will be approved automatically.
        </h2>

        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
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
            <UInput v-model="state.email" :disabled="loggedIn" />
          </UFormField>

          <UFormField label="Reason for Access" name="reasonForAccess">
            <UTextarea v-model="state.reasonForAccess" class="w-full" />
          </UFormField>

          <UButton type="submit"> Submit </UButton>
        </UForm>
      </div>
    </UContainer>
  </div>
</template>
