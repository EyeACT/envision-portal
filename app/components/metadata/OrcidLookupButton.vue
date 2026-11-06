<script setup lang="ts">
const props = defineProps<{
  // The ORCID field's value as typed, which may still be a full URL
  orcid: string;
}>();

const emit = defineEmits<{
  found: [profile: OrcidProfile];
}>();

const toast = useToast();

const loading = ref(false);

const normalizedOrcid = computed(() => normalizeORCID(props.orcid));
const canLookUp = computed(() => isValidORCIDValue(normalizedOrcid.value));

const lookUp = async () => {
  loading.value = true;

  try {
    const profile = await $fetch<OrcidProfile>(
      `/api/utils/orcid/${normalizedOrcid.value}`,
    );

    const hasName = Boolean(profile.givenName || profile.familyName);
    const hasAffiliations = profile.affiliations.length > 0;

    if (!hasName && !hasAffiliations) {
      toast.add({
        title: "Nothing to fill in",
        color: "warning",
        description:
          "This ORCID record has no public name or current employment.",
      });
      return;
    }

    emit("found", profile);

    const filled = [hasName && "name", hasAffiliations && "affiliation"].filter(
      Boolean,
    );

    toast.add({
      title: "Filled in from ORCID",
      color: "success",
      description: `Added the ${filled.join(" and ")} from the public record. Please review before saving.`,
    });
  } catch (error) {
    const notFound = (error as { statusCode?: number }).statusCode === 404;

    toast.add({
      title: notFound ? "ORCID iD not found" : "ORCID lookup failed",
      color: "error",
      description: notFound
        ? "Check the iD and try again."
        : "Please try again later, or fill in the details yourself.",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UTooltip
    text="Fill in the name and affiliation from this ORCID record. Existing names will be replaced."
  >
    <UButton
      class="shrink-0"
      icon="i-lucide-search"
      label="Fill from ORCID"
      variant="soft"
      :disabled="!canLookUp"
      :loading="loading"
      @click="lookUp"
    />
  </UTooltip>
</template>
