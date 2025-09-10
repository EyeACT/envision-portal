import {
  DataLakeServiceClient,
  StorageSharedKeyCredential,
  generateDataLakeSASQueryParameters,
  FileSystemSASPermissions,
} from "@azure/storage-file-datalake";

export default defineEventHandler(async (event) => {
  const { AZURE_PUBLISHED_ACCOUNT_KEY, AZURE_PUBLISHED_CONNECTION_STRING } =
    useRuntimeConfig();

  const { datasetid, requestid } = event.context.params as {
    datasetid: string;
    requestid: string;
  };

  const datasetId = parseInt(datasetid);

  const publishedDataset = await prisma.publishedDataset.findUnique({
    where: {
      id: datasetId,
    },
  });

  if (!publishedDataset) {
    throw createError({
      message: `Dataset ${datasetid} not found`,
      statusCode: 404,
    });
  }

  const request = await prisma.datasetRequest.findUnique({
    where: {
      id: requestid,
    },
  });

  if (!request) {
    throw createError({
      message: `Request ${requestid} not found`,
      statusCode: 404,
    });
  }

  if (request.isControlledDatasetRequest) {
    throw createError({
      message: `Request ${requestid} is a controlled dataset request`,
      statusCode: 403,
    });
  }

  const datasetMetadata =
    publishedDataset.publishedMetadata as unknown as Metadata;

  let sasUrl = "";
  let expiresOn = new Date();

  if (publishedDataset.containerId) {
    const publishedDatalakeServiceClient =
      DataLakeServiceClient.fromConnectionString(
        AZURE_PUBLISHED_CONNECTION_STRING,
      );

    const { accountName } = publishedDatalakeServiceClient;
    const fileSystemName = publishedDataset.containerId;

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      AZURE_PUBLISHED_ACCOUNT_KEY,
    );

    const now = new Date();
    expiresOn = new Date(now);
    expiresOn.setHours(now.getHours() + 1); // 1-hour expiration

    const containerSAS = generateDataLakeSASQueryParameters(
      {
        expiresOn,
        fileSystemName,
        permissions: FileSystemSASPermissions.parse("rl"), // read,  list
        startsOn: now,
      },
      sharedKeyCredential,
    ).toString();

    sasUrl = `https://${accountName}.dfs.core.windows.net/${fileSystemName}?${containerSAS}`;
  }

  return {
    id: publishedDataset.id,
    datasetId: publishedDataset.datasetId,
    canonicalId: publishedDataset.canonicalId,
    title: publishedDataset.title,
    versionTitle: publishedDataset.versionTitle,
    description: publishedDataset.description,
    doi: publishedDataset.doi,
    sasUrl,
    expiration: expiresOn.toISOString(),
    external: publishedDataset.external,
    metadata: {
      datasetDescription: datasetMetadata.datasetDescription,
      studyDescription: datasetMetadata.studyDescription,
    },
    license: "Unknown",
    request,
  };
});
