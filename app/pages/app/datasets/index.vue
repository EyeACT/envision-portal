<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

await navigateTo("/app/dashboard");
</script>
