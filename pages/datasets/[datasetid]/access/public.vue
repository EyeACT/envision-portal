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
const receivedInformation = ref(false);

const azureUri = ref(
  "DefaultEndpointsProtocol=https;AccountName=envisionportal;AccountKey=9UGBTsgoIVNVasG5h7DP5RwcfePgVLuz6sUyD/RdxE7CElVAIOwJ1xnFkQ7bCT1L/zR+zjFn0coVj6w2PY23NySMc0uOVdwFYT29X8oQEj2uifHyt+oU/6qrBTIjfClFd==;EndpointSuffix=core.windows.net",
);

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

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const body = {
    affiliation: event.data.affiliation,
    email: event.data.email,
    familyName: event.data.familyName,
    givenName: event.data.givenName,
    reasonForAccess: event.data.reasonForAccess,
  };

  loading.value = true;

  await $fetch(`/api/discover/dataset/${datasetid}/access/request-public`, {
    body,
    method: "POST",
  })
    .then(() => {
      toast.add({
        title: "Request submitted",
        description: "Your request has been submitted",
        icon: "material-symbols:check-circle-outline",
      });

      receivedInformation.value = true;
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

        <div v-if="!receivedInformation" class="flex flex-col gap-6">
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

        <div v-if="receivedInformation" class="flex flex-col gap-6">
          <USeparator class="my-3" />

          <div class="mt-3 flex flex-col gap-4">
            <div class="w-max">
              <h2>How to download</h2>
            </div>

            <ul class="flex list-inside list-decimal flex-col gap-3">
              <li>
                Download and install
                <a
                  href="https://azure.microsoft.com/en-us/features/storage-explorer/"
                  target="_blank"
                  class="text-blue-500"
                >
                  Azure Storage Explorer</a
                >.
              </li>

              <li>
                Open Azure Storage Explorer and connect to your Azure account.
              </li>

              <li>Navigate to the following URI to access the dataset:</li>

              <div class="relative">
                <UTextarea
                  v-model="azureUri"
                  class="w-full"
                  :rows="4"
                  disabled
                  autoresize
                />

                <UButton
                  label="Copy to clipboard"
                  icon="material-symbols:content-copy"
                  size="xs"
                  variant="outline"
                  class="absolute right-0 bottom-0 z-10 m-1 p-2"
                  @click="copyToClipboard(azureUri)"
                />
              </div>

              <li>
                Open the dataset URI in Azure Storage Explorer to browse the
                contents.
              </li>

              <li>
                Select the files you wish to download and choose "Download" from
                the context menu.

                <UAlert
                  color="info"
                  variant="subtle"
                  title="Heads up!"
                  description="You need to have free space on your device to download the files."
                  icon="i-lucide-terminal"
                  class="mt-2"
                />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
