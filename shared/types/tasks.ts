// Payload of a `publish-dataset` task. Written by publish/finalize.post.ts when the
// dataset is locked, read by scripts/process-task-queue.ts when the task runs.
export interface PublishDatasetPayload {
  // Generated metadata files, uploaded to the root of the published container
  metadataFiles: Record<string, string>;
  // Fields copied onto the PublishedDataset record
  publishedDataset: {
    title: string;
    canonicalId: string;
    description: string;
    publishedMetadata: Record<string, any>;
    studyTitle: string;
    versionTitle: string;
  };
}
