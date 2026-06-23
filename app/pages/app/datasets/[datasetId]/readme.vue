<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { MdEditor } from "md-editor-v3";
import { useUnsavedChangesGuard } from "@/composables/useUnsavedChangesGuard";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as {
  datasetId: string;
};

const submitLoading = ref(false);
const isSubmitting = ref(false); // Tracked for guard exclusions

const text = ref("# Hello Editor");
const originalStateString = ref(""); // Deep comparison backup

const { data, error } = await useFetch(`/api/datasets/${datasetId}/readme`, {});

if (error.value) {
  toast.add({
    title: "Error fetching dataset readme",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo(`/app/datasets/${datasetId}`);
}

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  text.value = data.value.readme;
  // Initialize baseline string for comparison
  originalStateString.value = JSON.stringify({ text: data.value.readme });
}

// Compute if the editor content has changed from the initial payload
const isDirty = computed(() => {
  return JSON.stringify({ text: text.value }) !== originalStateString.value;
});

// Initialize the guard with state refs
const { 
  showLeaveModal, 
  confirmLeave, 
  cancelLeave 
} = useUnsavedChangesGuard({ isDirty, isSubmitting });

const onSubmit = async () => {
  submitLoading.value = true;
  isSubmitting.value = true;

  await $fetch(`/api/datasets/${datasetId}/readme`, {
    body: { readme: text.value },
    method: "PUT",
  })
    .then(() => {
      toast.add({
        title: "Readme saved",
        description: "Your readme has been saved",
      });
      // Synchronize state tracking upon successful API update
      originalStateString.value = JSON.stringify({ text: text.value });
    })
    .catch((error) => {
      console.error("Error saving readme:", error);
      toast.add({
        title: "Error saving readme",
        description: "Please try again later",
      });
    })
    .finally(() => {
      submitLoading.value = false;
      isSubmitting.value = false;
    });
};
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden">
    
    <div class="flex-1 overflow-y-auto p-4 pb-28 space-y-6">
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: data?.title, to: `/app/datasets/${datasetId}` },
          {
            label: 'Readme',
            to: `/app/datasets/${datasetId}/readme`,
          },
        ]"
      />

      <div class="flex w-full flex-col gap-6">
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full items-center justify-between gap-3">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Readme
              </h1>

              <p class="text-lg font-normal">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                quos.
              </p>
            </div>
          </div>
        </div>

        <MdEditor v-model="text" language="en-US" />
      </div>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-4">
      <UButton
        type="button"
        :disabled="submitLoading"
        :loading="submitLoading"
        class="w-full"
        size="xl"
        label="Save Readme"
        icon="i-lucide-save"
        @click="onSubmit"
      />
    </div>

    <UModal 
      v-model:open="showLeaveModal"
      title="Unsaved changes"
      :prevent-close="true"
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to leave this page? Any modifications made to your configured readme data points will be permanently discarded.
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <UButton color="error" label="Discard Changes" @click="confirmLeave" />
            <UButton color="neutral" label="Stay on Page" @click="cancelLeave" />  
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>