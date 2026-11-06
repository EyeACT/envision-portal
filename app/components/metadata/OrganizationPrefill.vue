<script setup lang="ts">
type Organization = {
  identifier?: string | null;
  name?: string | null;
};

const props = defineProps<{
  current: Organization;
  source?: Organization | null;
  // What the source is called in the text, such as "study lead sponsor"
  sourceLabel: string;
}>();

const emit = defineEmits<{
  prefill: [organization: { identifier: string; name: string }];
}>();

const comparison = computed(() =>
  compareOrganizations(props.current, props.source ?? {}),
);

const onPrefill = () => {
  emit("prefill", {
    identifier: props.source?.identifier ?? "",
    name: props.source?.name ?? "",
  });
};
</script>

<template>
  <UAlert
    v-if="comparison.conflict"
    color="warning"
    variant="subtle"
    icon="i-lucide-triangle-alert"
    :description="`The ${sourceLabel} is ${source?.name}.`"
    :actions="
      comparison.canPrefill
        ? [
            {
              color: 'warning',
              icon: 'i-lucide-copy',
              label: `Use ${sourceLabel}`,
              size: 'xs',
              variant: 'solid',
              onClick: onPrefill,
            },
          ]
        : []
    "
  />

  <UButton
    v-else-if="comparison.canPrefill"
    icon="i-lucide-copy"
    :label="`Use ${sourceLabel}: ${source?.name}`"
    color="neutral"
    variant="soft"
    size="xs"
    class="w-fit"
    @click="onPrefill"
  />
</template>
