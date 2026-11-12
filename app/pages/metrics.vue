<script setup lang="ts">

const ogImage = `https://kalai.fairdataihub.org/api/generate?title=${encodeURIComponent("Metrics - Envision Portal")}&description=${encodeURIComponent("Usage and growth metrics for the Envision Portal platform")}&app=envision-portal&org=eye-act`;

useSeoMeta({
  title: "Metrics - Envision Portal",
  description: "Usage and growth metrics for the Envision Portal platform.",
  ogTitle: "Metrics - Envision Portal",
  ogDescription: "Usage and growth metrics for the Envision Portal platform.",
  ogImage,
});

const { data } = await useFetch("/api/discover/metrics");

// Animated counters
const displayInstitutions = ref(0);
const displayLanguages = ref(0);
const displayResearchers = ref(0);
const displayFunders = ref(0);

const animateCount = (target: number, output: Ref<number>) => {
  if (!target) return;
  const duration = 1200;
  const start = Date.now();
  const tick = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    output.value = Math.round(progress * target * (2 - progress));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

onMounted(() => {
  // animateCount(data.value?.world.researcherCount ?? 0, displayResearchers);
  // animateCount(
  //   data.value?.world.uniqueInstitutionCount ?? 0,
  //   displayInstitutions,
  // );
  // animateCount(data.value?.world.languageCount ?? 0, displayLanguages);
  // animateCount(data.value?.world.funderCount ?? 0, displayFunders);
});

</script>

<template>
  <div class="mx-auto flex w-full max-w-screen-xl flex-col gap-10 px-6 pb-10">
    <UPageCTA
      title="Metrics"
      description="Analytics & Insights about Envision Portal"
      variant="naked"
    />

    <section class="flex flex-col gap-4 lg:-mt-16">
      <div class="grid grid-cols-2 gap-4">
        <UCard>
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-pink-600">
              {{ (data?.manual ?? 0).toLocaleString() }}
            </div>

            <p class="text-sm font-medium">Manually Shared</p>

            <p class="text-muted text-xs">Uploaded directly by researchers</p>
          </div>
        </UCard>

        <UCard>
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-pink-600">
              {{ (data?.autoIndex ?? 0).toLocaleString() }}
            </div>

            <p class="text-sm font-medium">Auto-Indexed</p>

            <p class="text-muted text-xs">
              Discovered and indexed from repositories
            </p>
          </div>
        </UCard>
      </div>
    </section>

    <section>
      <h2>Dataset Breakdown by Modality</h2>
      <div class="grid grid-cols-2 gap-4">
        <UCard>
          <div class="flex flex-col items-center gap-1 py-2 text-center">
            <div class="text-3xl font-bold text-pink-600">
              {{ (data?.modalitiesToDatasetMap["oct"] ?? 0).toLocaleString() }}
            </div>

            <p class="text-sm font-medium">Datasets with OCT Images</p>

            <p class="text-muted text-xs">
              Discovered and indexed from repositories
            </p>
          </div>
        </UCard>
      </div>
    </section>


  </div>
</template>
