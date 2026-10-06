import {
  BlobServiceClient,
  ContainerSASPermissions,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

// Requester download links are valid for 24 hours (see dev/storage-rework.md)
const PUBLISHED_SAS_LIFETIME_HOURS = 24;

/**
 * Generate a read-only SAS URL for a published dataset version container.
 * The published account is flat blob storage (no HNS), so this uses the blob endpoint.
 */
export function getPublishedContainerSasUrl(containerName: string) {
  const { AZURE_PUBLISHED_ACCOUNT_KEY, AZURE_PUBLISHED_CONNECTION_STRING } =
    useRuntimeConfig();

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_PUBLISHED_CONNECTION_STRING,
  );

  const { accountName } = blobServiceClient;

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    AZURE_PUBLISHED_ACCOUNT_KEY,
  );

  const now = new Date();
  const expiresOn = new Date(now);

  expiresOn.setHours(now.getHours() + PUBLISHED_SAS_LIFETIME_HOURS);

  const containerSAS = generateBlobSASQueryParameters(
    {
      containerName,
      expiresOn,
      permissions: ContainerSASPermissions.parse("rl"), // read, list
      startsOn: now,
    },
    sharedKeyCredential,
  ).toString();

  const containerUrl = blobServiceClient.getContainerClient(containerName).url;

  return {
    expiresOn,
    sasUrl: `${containerUrl}?${containerSAS}`,
  };
}
