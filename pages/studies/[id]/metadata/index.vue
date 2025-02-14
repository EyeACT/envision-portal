<script setup lang="ts">
useSeoMeta({
  title: "Study Metadata",
});

const metadata = ref({});
const route = useRoute();
const studyId = route.params.id;

// Fetch metadata from the API
// try {
//   const { data, error } = await useFetch(`/api/studies/${studyId}/metadata`, {
//     method: "GET",
//   });

//   if (error.value) {
//     console.error("Error fetching metadata:", error.value);
//   } else {
//     metadata.value = data.value;
//   }
// }
</script>

<template>
  <div class="p-6">
    <h1 class="mb-4 text-2xl font-bold">Metadata</h1>
    <!-- Metadata content or form goes here -->
    <p>Here you can view or edit metadata related to your studies.</p>
  </div>
</template>
