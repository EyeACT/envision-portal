<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId, requestId } = route.params as {
  datasetId: string;
  requestId: string;
};

const baseUrl = `/api/datasets/${datasetId}/requests/${requestId}`;

const { data, error, refresh } = await useFetch(baseUrl);

if (error.value) {
  toast.add({
    title: "Error fetching data request",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo(`/app/datasets/${datasetId}/requests`);
}

useSeoMeta({
  title: data.value
    ? `Data request from ${data.value.givenName} ${data.value.familyName}`
    : "Data Request",
});

const isPending = computed(() => data.value?.status === "pending");
const canEditAgreements = computed(
  () => !!data.value?.canManage && isPending.value,
);

const showAgreements = computed(
  () =>
    !!data.value &&
    (isPending.value ||
      !!data.value.agreements.unsigned ||
      !!data.value.agreements.signed ||
      !!data.value.agreements.final),
);

// Approve, reject and revoke all go through one PATCH with a confirm step
type Action = "approve" | "reject" | "revoke";

const ACTION_COPY: Record<
  Action,
  { title: string; description: string; confirm: string; color: "success" | "error" | "warning" }
> = {
  approve: {
    title: "Approve this request?",
    description:
      "The requester will get a download link for this dataset version.",
    confirm: "Approve request",
    color: "success",
  },
  reject: {
    title: "Reject this request?",
    description:
      "The requester will be notified. Add a reason so they know what to change.",
    confirm: "Reject request",
    color: "error",
  },
  revoke: {
    title: "Revoke access?",
    description:
      "The requester will no longer be able to get new download links. Links already issued stay valid until they expire (24 hours).",
    confirm: "Revoke access",
    color: "warning",
  },
};

const pendingAction = ref<Action | null>(null);
const actionComment = ref("");
const actionLoading = ref(false);

const actionModalOpen = computed({
  get: () => pendingAction.value !== null,
  set: (open) => {
    if (!open) pendingAction.value = null;
  },
});

const openAction = (action: Action) => {
  actionComment.value = "";
  pendingAction.value = action;
};

const confirmAction = async () => {
  if (!pendingAction.value) return;

  actionLoading.value = true;

  try {
    await $fetch(baseUrl, {
      body: {
        action: pendingAction.value,
        ...(actionComment.value.trim() && { comment: actionComment.value }),
      },
      method: "PATCH",
    });

    toast.add({
      title: "Request updated",
      color: "success",
      icon: "material-symbols:check-circle-outline",
    });

    pendingAction.value = null;
    await refresh();
  } catch (err: any) {
    toast.add({
      title: "Could not update the request",
      color: "error",
      description: err.data?.statusMessage ?? "Please try again later",
      icon: "material-symbols:error",
    });
  } finally {
    actionLoading.value = false;
  }
};

// Owner uploads: the unsigned agreement, then the countersigned final copy
const unsignedFile = ref<File | null>(null);
const finalFile = ref<File | null>(null);
const uploading = ref<"unsigned" | "final" | null>(null);

const uploadAgreement = async (kind: "unsigned" | "final") => {
  const file = kind === "unsigned" ? unsignedFile.value : finalFile.value;

  if (!file) return;

  uploading.value = kind;

  try {
    await uploadAgreementFile(`${baseUrl}/agreements/${kind}`, file);

    toast.add({
      title:
        kind === "unsigned"
          ? "Data use agreement sent to the requester"
          : "Countersigned agreement uploaded",
      color: "success",
      icon: "material-symbols:check-circle-outline",
    });

    unsignedFile.value = null;
    finalFile.value = null;
    await refresh();
  } catch (err: any) {
    toast.add({
      title: "Upload failed",
      color: "error",
      description: err.data?.statusMessage ?? "Please try again later",
      icon: "material-symbols:error",
    });
  } finally {
    uploading.value = null;
  }
};
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.Dataset?.title, to: `/app/datasets/${datasetId}` },
        {
          label: 'Data Requests',
          to: `/app/datasets/${datasetId}/requests`,
        },
        { label: `${data?.givenName ?? ''} ${data?.familyName ?? ''}` },
      ]"
    />

    <div v-if="data" class="flex w-full flex-col gap-6 pb-10">
      <!-- Header and decision -->
      <div
        class="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ data.givenName }} {{ data.familyName }}
            </h1>

            <p class="text-gray-500 dark:text-gray-400">
              Submitted {{ displayDateDifference(data.created) }} ago ·
              Version {{ data.PublishedDataset.versionTitle }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <UBadge variant="outline" color="neutral">
              {{ data.PublishedDataset.public ? "Public" : "Controlled" }}
              dataset
            </UBadge>

            <UBadge
              :color="requestStatusColor(data.status)"
              variant="soft"
              size="lg"
              class="capitalize"
            >
              {{ data.status }}
            </UBadge>
          </div>
        </div>

        <UAlert
          v-if="!data.canManage"
          color="neutral"
          variant="soft"
          icon="material-symbols:info"
          description="Only dataset owners and admins can act on data requests."
        />

        <div
          v-else-if="data.status === 'pending' || data.status === 'approved'"
          class="flex flex-wrap items-center gap-3"
        >
          <template v-if="data.status === 'pending'">
            <UTooltip
              :text="data.approvalBlocker ?? undefined"
              :disabled="!data.approvalBlocker"
            >
              <UButton
                label="Approve request"
                icon="material-symbols:check"
                color="success"
                :disabled="!!data.approvalBlocker"
                @click="openAction('approve')"
              />
            </UTooltip>

            <UButton
              label="Reject request"
              icon="material-symbols:close"
              color="error"
              variant="soft"
              @click="openAction('reject')"
            />

            <p
              v-if="data.approvalBlocker"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              {{ data.approvalBlocker }}
            </p>
          </template>

          <UButton
            v-else
            label="Revoke access"
            icon="material-symbols:block"
            color="warning"
            variant="soft"
            @click="openAction('revoke')"
          />
        </div>
      </div>

      <!-- Requester details -->
      <div
        class="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">
          Request details
        </h2>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DataDisplay title="Email" :content="data.emailAddress" />

          <DataDisplay title="Affiliation" :content="data.affiliation" />

          <DataDisplay
            title="Account"
            :content="data.userId ? 'Signed in' : 'Anonymous public request'"
          />
        </div>

        <DataDisplay title="Reason for access">
          <p class="text-base whitespace-pre-wrap">
            {{ data.reasonForAccess }}
          </p>
        </DataDisplay>

        <DataDisplay v-if="data.comment" title="Reviewer comment">
          <p class="text-base whitespace-pre-wrap">{{ data.comment }}</p>
        </DataDisplay>
      </div>

      <!-- Optional data use agreement exchange -->
      <div
        v-if="showAgreements"
        class="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Data use agreement
          </h2>

          <p class="text-sm text-gray-500 dark:text-gray-400">
            Optional. Skip this to approve the request straight away. Once you
            send an agreement, approval waits until it is signed by both sides.
          </p>
        </div>

        <ol class="flex flex-col gap-5">
          <!-- 1. Send -->
          <li class="flex flex-col gap-2">
            <h3 class="font-semibold">1. Send the agreement</h3>

            <div
              v-if="data.agreements.unsigned"
              class="flex items-center gap-2 text-sm"
            >
              <Icon name="material-symbols:check-circle" class="text-green-500" />

              <ULink
                :to="`${baseUrl}/agreements/unsigned`"
                target="_blank"
                external
                class="text-primary hover:underline"
              >
                {{ data.agreements.unsigned }}
              </ULink>
            </div>

            <div
              v-if="canEditAgreements && !data.agreements.signed"
              class="flex flex-wrap items-end gap-3"
            >
              <UFileUpload
                v-model="unsignedFile"
                accept=".pdf,.doc,.docx"
                layout="list"
                :label="
                  data.agreements.unsigned
                    ? 'Replace the agreement'
                    : 'Drop a PDF or Word document'
                "
                description="PDF, DOC or DOCX, up to 15MB"
                class="w-full max-w-md"
              />

              <UButton
                :label="data.agreements.unsigned ? 'Replace' : 'Send to requester'"
                icon="mynaui:send-solid"
                :disabled="!unsignedFile"
                :loading="uploading === 'unsigned'"
                @click="uploadAgreement('unsigned')"
              />
            </div>

            <p
              v-else-if="!data.agreements.unsigned"
              class="text-sm text-gray-500"
            >
              No agreement was sent.
            </p>
          </li>

          <!-- 2. Requester signs -->
          <li v-if="data.agreements.unsigned" class="flex flex-col gap-2">
            <h3 class="font-semibold">2. Requester signs</h3>

            <div
              v-if="data.agreements.signed"
              class="flex items-center gap-2 text-sm"
            >
              <Icon name="material-symbols:check-circle" class="text-green-500" />

              <ULink
                :to="`${baseUrl}/agreements/signed`"
                target="_blank"
                external
                class="text-primary hover:underline"
              >
                {{ data.agreements.signed }}
              </ULink>
            </div>

            <p v-else class="text-sm text-gray-500">
              Waiting for the requester to upload their signed copy.
            </p>
          </li>

          <!-- 3. Countersign -->
          <li v-if="data.agreements.signed" class="flex flex-col gap-2">
            <h3 class="font-semibold">3. Countersign</h3>

            <p class="text-sm text-gray-500 dark:text-gray-400">
              Review the signed copy, add your signature, and upload the final
              agreement. The requester can download it from their request.
            </p>

            <div
              v-if="data.agreements.final"
              class="flex items-center gap-2 text-sm"
            >
              <Icon name="material-symbols:check-circle" class="text-green-500" />

              <ULink
                :to="`${baseUrl}/agreements/final`"
                target="_blank"
                external
                class="text-primary hover:underline"
              >
                {{ data.agreements.final }}
              </ULink>
            </div>

            <div v-if="canEditAgreements" class="flex flex-wrap items-end gap-3">
              <UFileUpload
                v-model="finalFile"
                accept=".pdf,.doc,.docx"
                layout="list"
                :label="
                  data.agreements.final
                    ? 'Replace the countersigned agreement'
                    : 'Drop the countersigned agreement'
                "
                description="PDF, DOC or DOCX, up to 15MB"
                class="w-full max-w-md"
              />

              <UButton
                label="Upload countersigned copy"
                icon="material-symbols:file-upload"
                :disabled="!finalFile"
                :loading="uploading === 'final'"
                @click="uploadAgreement('final')"
              />
            </div>
          </li>
        </ol>
      </div>
    </div>

    <UModal
      v-model:open="actionModalOpen"
      :title="pendingAction ? ACTION_COPY[pendingAction].title : ''"
      :description="pendingAction ? ACTION_COPY[pendingAction].description : ''"
    >
      <template #body>
        <div v-if="pendingAction" class="flex flex-col gap-4">
          <UFormField
            :label="pendingAction === 'approve' ? 'Note (optional)' : 'Reason (optional)'"
            description="Shown to the requester on their request page."
          >
            <UTextarea v-model="actionComment" class="w-full" :rows="4" />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="pendingAction = null"
            />

            <UButton
              :label="ACTION_COPY[pendingAction].confirm"
              :color="ACTION_COPY[pendingAction].color"
              :loading="actionLoading"
              @click="confirmAction"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
