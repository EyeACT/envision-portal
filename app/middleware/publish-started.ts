// Sends the publish wizard steps to the finalize page once publishing has been
// requested. A locked dataset can't be edited, and finalize shows the progress
export default defineNuxtRouteMiddleware(async (to) => {
  const { datasetId } = to.params as { datasetId: string };

  // Forwards the session cookie when this runs during SSR
  const requestFetch = useRequestFetch();

  const dataset = await requestFetch(
    `/api/datasets/${datasetId}/publish`,
  ).catch(() => null);

  if (dataset?.lockedAt) {
    return navigateTo(`/app/datasets/${datasetId}/publish/finalize`, {
      replace: true,
    });
  }
});
