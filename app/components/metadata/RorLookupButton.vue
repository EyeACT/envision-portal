<script setup lang="ts">
const props = defineProps<{
  // Shows only the icon, for narrow rows
  compact?: boolean;
  // The ROR field's value as typed, which may still be a full URL
  ror: string;
}>();

const emit = defineEmits<{
  found: [organization: RorOrganization];
}>();

const toast = useToast();

const loading = ref(false);

const normalizedRor = computed(() => normalizeROR(props.ror));
const canLookUp = computed(() => isValidRORValue(normalizedRor.value));

const lookUp = async () => {
  loading.value = true;

  try {
    const organization = await $fetch<RorOrganization>(
      `/api/utils/ror/${normalizedRor.value}`,
    );

    emit("found", organization);

    toast.add({
      title: "Filled in from ROR",
      color: "success",
      description: `Added details for ${organization.name} from the public record. Please review before saving.`,
    });
  } catch (error) {
    const notFound = (error as { statusCode?: number }).statusCode === 404;

    toast.add({
      title: notFound ? "ROR ID not found" : "ROR lookup failed",
      color: "error",
      description: notFound
        ? "Check the ID and try again."
        : "Please try again later, or fill in the name yourself.",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UTooltip
    text="Fill in details from this ROR record. Existing details may be replaced."
  >
    <UButton
      class="shrink-0"
      icon="i-lucide-search"
      :label="compact ? undefined : 'Fill from ROR'"
      aria-label="Fill from ROR"
      variant="soft"
      :disabled="!canLookUp"
      :loading="loading"
      @click="lookUp"
    />
  </UTooltip>
</template>
