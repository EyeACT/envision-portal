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

// Written by the publish task to `{canonicalId}/manifests/{datasetId}.json` in the
// study account and as `manifest.json` in the published container
export interface PublishManifest {
  canonicalId: string;
  createdAt: string;
  datasetId: string;
  // Every file under `data/` and `documents/`, relative to the published container
  files: {
    // Base64 Content-MD5, when the uploader set one
    md5?: string;
    path: string;
    size: number;
  }[];
  version: string;
}
