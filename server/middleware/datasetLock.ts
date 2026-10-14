// Routes under /api/datasets/{datasetId}/ that stay writable while the dataset is locked.
// These manage access or create a separate dataset, so they don't change what gets published.
const UNLOCKED_SEGMENTS = new Set(["invitations", "members", "new-version"]);

// Blocks every write to a dataset once publishing has been requested
export default defineEventHandler(async (event) => {
  if (event.method === "GET" || event.method === "HEAD") return;

  const match = event.path.match(/^\/api\/datasets\/([^/?]+)(?:\/([^/?]+))?/);

  if (!match) return;

  const [, datasetId, segment] = match;

  if (segment && UNLOCKED_SEGMENTS.has(segment)) return;

  await assertDatasetUnlocked(decodeURIComponent(datasetId!));
});
