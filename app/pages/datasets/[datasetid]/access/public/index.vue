<script setup lang="ts">
import * as z from "zod";
import { faker } from "@faker-js/faker";
import type { FormSubmitEvent } from "@nuxt/ui";

const { environment } = useRuntimeConfig().public;

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
  affiliation: environment === "development" ? faker.company.name() : "",
  email: loggedIn.value
    ? user.value?.emailAddress
    : environment === "development"
      ? faker.internet.email()
      : "",
  familyName: environment === "development" ? faker.person.lastName() : "",
  givenName: environment === "development" ? faker.person.firstName() : "",
  reasonForAccess:
    environment === "development" ? faker.lorem.sentences(6) : "",
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
  <div class="min-h-screen w-full">
    <UContainer class="relative min-h-full">
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
          { label: 'All Datasets', to: '/datasets' },
          { label: dataset?.title, to: `/datasets/${datasetid}` },
          { label: 'Public Access' },
        ]"
      />

      <div class="flex flex-1 flex-col gap-6 pt-4">
        <div class="flex flex-col gap-1">
          <UBadge class="w-max" color="primary" variant="outline">
            Version {{ dataset?.versionTitle }}
          </UBadge>

          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ dataset?.title }}
          </h1>
        </div>

        <USeparator class="my-3" />

        <UAlert
          icon="material-symbols:info"
          color="info"
          variant="soft"
          title="Request Access to Dataset"
          description="Please provide the following information to request access to this dataset. Your request will be approved automatically."
        />

        <UForm
          :schema="schema"
          :state="state"
          class="space-y-6"
          @submit="onSubmit"
        >
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <UFormField label="Given Name" name="givenName">
              <UInput v-model="state.givenName" />
            </UFormField>

            <UFormField label="Family Name" name="familyName">
              <UInput v-model="state.familyName" />
            </UFormField>
          </div>

          <UFormField label="Affiliation" name="affiliation">
            <UInput v-model="state.affiliation" />
          </UFormField>

          <UFormField label="Email" name="email">
            <UInput v-model="state.email" :disabled="loggedIn" />
          </UFormField>

          <UFormField label="Reason for Access" name="reasonForAccess">
            <UTextarea
              v-model="state.reasonForAccess"
              class="w-full"
              placeholder="Please describe your intended use of this dataset..."
            />
          </UFormField>

          <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <UButton
              type="button"
              size="lg"
              variant="outline"
              class="w-full sm:w-auto"
              icon="i-lucide-arrow-left"
              @click="navigateTo(`/datasets/${datasetid}`)"
            >
              Back
            </UButton>

            <UButton
              type="submit"
              size="lg"
              class="w-full sm:w-auto"
              :loading="loading"
              icon="i-lucide-send"
            >
              Request Access
            </UButton>
          </div>
        </UForm>
      </div>
    </UContainer>
  </div>
</template>
