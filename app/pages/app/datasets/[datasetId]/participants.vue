<script setup lang="ts">
import AppPlaceholder from "~/components/app/AppPlaceholder.vue";
import { definePageMeta } from "#app/composables/pages";
import { useRoute } from "#app";
import { useToast } from "#imports";
import { UBreadcrumb } from "#components";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'Participants', to: `/app/study/${studyId}/participants` },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Participants
            </h1>

            <p class="text-lg font-normal">
              Review the participants included in this dataset.
            </p>
          </div>
        </div>
      </div>

      <div>
        <AppPlaceholder>
          <p>Participant details will appear here.</p>
        </AppPlaceholder>
      </div>
    </div>
  </div>
</template>
