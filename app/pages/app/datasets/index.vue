<script setup lang="ts">
import { definePageMeta } from "#app/composables/pages";
import { navigateTo } from "#app";

definePageMeta({
  middleware: ["auth"],
});

await navigateTo("/app/dashboard");
</script>
