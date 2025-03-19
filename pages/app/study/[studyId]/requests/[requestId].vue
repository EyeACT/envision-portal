<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Dataset Requests",
});

const route = useRoute();
const toast = useToast();

const { requestId, studyId } = route.params as {
  requestId: string;
  studyId: string;
};

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
            <h1>Manage this dataset request</h1>

            <p>
              This page allows you to handle the data use agreement submission
              and the approval/rejection of the request.
            </p>
          </div>
        </div>

        <div class="flex flex-col items-end gap-2">
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

      <div class="flex flex-col gap-3">
        <div
          class="flex flex-col items-start gap-3 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <h2>Request details</h2>

          <p>
            This dataset request is currently in the review stage. The following
            details were provided by the submitter:
          </p>

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

          <USeparator class="my-3" />

          <h2>Send data use agreement</h2>

          <p>
            This dataset request requires a data use agreement. Please upload a
            DUA that will be provided to the requesting user.
          </p>

          <div class="flex gap-3">
            <UInput type="file" accept=".pdf,.doc,.docx" />

            <UButton
              label="Upload Data Use Agreement"
              icon="material-symbols:file-upload"
              color="primary"
            />
          </div>

          <USeparator class="my-3" />

          <h2>Review data use agreement</h2>

          <p>
            The user has provided a signed data use agreement. Please review the
            document and confirm that it is acceptable.
          </p>

          <div class="flex gap-3">
            <ULink
              target="_blank"
              :to="data?.DatasetRequestDetails[0].signedDataUseAgreement ?? ''"
            >
              <Icon name="line-md:link" />
              {{ data?.DatasetRequestDetails[0].signedDataUseAgreement }}
            </ULink>
          </div>
        </div>

        <pre>{{ data }}</pre>
      </div>
    </div>
  </div>
</template>
