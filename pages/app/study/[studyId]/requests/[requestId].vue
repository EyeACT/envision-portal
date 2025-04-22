<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Dataset Requests",
});

const route = useRoute();
const toast = useToast();

const items = [
  {
    icon: "material-symbols:overview-key-rounded",
    label: "Overview",
    slot: "overview",
  },
  {
    icon: "mynaui:send-solid",
    label: "Send Data Use Agreement",
    slot: "send-data-use-agreement",
  },
  {
    icon: "material-symbols:rate-review",
    label: "Review Data Use Agreement",
    slot: "review-data-use-agreement",
  },
  {
    icon: "maki:racetrack",
    label: "Finalize Data Use Agreement",
    slot: "finalize-data-use-agreement",
  },
  {
    disabled: true,
    icon: "material-symbols:folder-managed-rounded",
    label: "Manage Request",
    slot: "manage-request",
  },
];

const { requestId, studyId } = route.params as {
  requestId: string;
  studyId: string;
};

const unsignedDUA = ref("");
const requesterSignedDUA = ref("");
const submitterSignedDUA = ref("");

const { data, error } = await useFetch(
  `/api/studies/${studyId}/dataset-requests/${requestId}`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo("/");
}

if (data.value) {
  unsignedDUA.value =
    data.value.DatasetRequestDetails[0].unsignedDataUseAgreement;
  requesterSignedDUA.value =
    data.value.DatasetRequestDetails[0].requesterSignedDataUseAgreement;
}
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'My Studies', to: '/app/dashboard/studies' },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Manage this dataset request
            </h1>

            <p class="text-lg font-normal">
              This page allows you to handle the data use agreement submission
              and the approval/rejection of the request.
            </p>
          </div>
        </div>

        <div class="flex w-full items-center justify-between gap-2 pt-2">
          <div class="flex items-center gap-2">
            <UBadge variant="outline">
              Version {{ data?.dataset.version }}
            </UBadge>

            <UBadge variant="outline" color="success">
              Data use agreement sent
            </UBadge>

            <UBadge variant="soft" color="info">
              {{ data?.status }}
            </UBadge>
          </div>

          <div>
            <UButton
              label="Reject request"
              variant="soft"
              icon="material-symbols:close"
              color="error"
            />
          </div>
        </div>
      </div>

      <div
        class="flex flex-col items-start gap-3 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <UTabs
          :items="items"
          orientation="horizontal"
          variant="link"
          class="w-full gap-4"
          default-value="2"
          :ui="{ trigger: 'cursor-pointer' }"
        >
          <template #overview>
            <div class="flex flex-col gap-3">
              <p>The following details were provided by the submitter:</p>

              <DataDisplay title="Dataset" :content="data?.dataset.title" />

              <DataDisplay
                title="Name"
                :content="`${data?.givenName} ${data?.familyName}`"
              />

              <DataDisplay title="Affiliation" :content="data?.affiliation" />

              <DataDisplay
                title="Reason for Access"
                :content="data?.reasonForAccess"
              />
            </div>
          </template>

          <template #send-data-use-agreement>
            <div class="flex flex-col gap-3">
              <p>
                This dataset request requires a data use agreement. Please
                upload a DUA that will be provided to the requesting user.
              </p>

              <div class="flex gap-3">
                <UInput
                  type="file"
                  accept=".pdf,.doc,.docx"
                  :disabled="unsignedDUA"
                />

                <UButton
                  label="Upload Data Use Agreement"
                  icon="material-symbols:file-upload"
                  color="primary"
                  :disabled="unsignedDUA"
                />
              </div>

              <client-only>
                <div>
                  <USeparator class="my-3" />

                  <p class="mb-5">
                    A data use agreement was provided to the requesting user.
                    View the document below.
                  </p>

                  <embed :src="unsignedDUA" width="1440px" height="900px" />
                </div>
              </client-only>
            </div>
          </template>

          <template #review-data-use-agreement>
            <div class="flex flex-col gap-3">
              <p>
                A signed data use agreement was provided by the requesting user.
                Please review the document and confirm that it is acceptable. If
                it looks good, please add your signature to the document.
              </p>

              <div class="flex gap-3">
                <ULink
                  target="_blank"
                  :to="
                    data?.DatasetRequestDetails[0].signedDataUseAgreement ?? ''
                  "
                >
                  <Icon name="line-md:link" />
                  {{ data?.DatasetRequestDetails[0].signedDataUseAgreement }}
                </ULink>
              </div>

              <embed
                :src="data?.DatasetRequestDetails[0].signedDataUseAgreement"
                width="1440px"
                height="900px"
              />
            </div>
          </template>

          <template #finalize-data-use-agreement>
            <div class="flex flex-col gap-3">
              <p>
                The user has provided a signed data use agreement. Please review
                the document and confirm that it is acceptable. If it looks
                good, please add your signature to the document.
              </p>

              <div class="flex gap-3">
                <UInput
                  type="file"
                  accept=".pdf,.doc,.docx"
                  :disabled="unsignedDUA"
                />

                <UButton
                  label="Upload Data Use Agreement"
                  icon="material-symbols:file-upload"
                  color="primary"
                  :disabled="unsignedDUA"
                />
              </div>

              <client-only>
                <div>
                  <USeparator class="my-3" />

                  <p class="mb-5">
                    We have sent the requester a signed data use agreement. View
                    the document below.
                  </p>

                  <embed
                    :src="requesterSignedDUA"
                    width="1440px"
                    height="900px"
                  />
                </div>
              </client-only>
            </div>
          </template>

          <template #manage-request> Manage Request </template>
        </UTabs>
      </div>

      <pre>{{ data }}</pre>
    </div>
  </div>
</template>
