<script setup lang="ts">
defineProps({
  id: {
    required: true,
    type: String,
  },
  versions: {
    required: true,
    type: Array as PropType<VersionArray>,
  },
});
</script>

<template>
  <div class="flex flex-col gap-2 rounded-xl pt-3 pb-5">
    <div class="flex flex-col gap-2">
      <div
        v-for="version in versions"
        :key="version.id"
        class="flex justify-between rounded-md px-4 py-2 transition-all hover:bg-blue-50"
        :class="{
          '!bg-teal-100': version.id === id,
        }"
      >
        <div class="flex flex-col space-y-1">
          <NuxtLink
            :to="`/datasets/${version.id}`"
            class="text-sm font-medium transition-all hover:text-slate-600 hover:underline"
          >
            Version {{ version.title }}
          </NuxtLink>

          <NuxtLink
            :to="`https://doi.org/${version.doi}`"
            target="_blank"
            class="text-sm transition-all hover:text-slate-600 hover:underline"
          >
            {{ version.doi }}
          </NuxtLink>
        </div>

        <p class="text-right text-xs text-gray-500">
          {{ $dayjs.unix(version.createdAt / 1000).format("MMM D, YYYY") }}
        </p>
      </div>
    </div>
  </div>
</template>
