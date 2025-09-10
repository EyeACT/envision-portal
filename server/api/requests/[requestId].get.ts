import {
  DataLakeServiceClient,
  StorageSharedKeyCredential,
  generateDataLakeSASQueryParameters,
  FileSystemSASPermissions,
} from "@azure/storage-file-datalake";

export default defineEventHandler(async (event) => {
  const { AZURE_PUBLISHED_ACCOUNT_KEY, AZURE_PUBLISHED_CONNECTION_STRING } =
    useRuntimeConfig();

  await requireUserSession(event);

  // todo: add permissions check

  const { requestId } = event.context.params as {
    requestId: string;
  };

  // Get the request from the database
  const request = await prisma.datasetRequest.findUnique({
    include: {
      Dataset: true,
      PublishedDataset: true,
    },
    where: {
      id: requestId,
    },
  });

  // Check if the request exists
  if (!request) {
    throw createError({
      statusCode: 404,
      statusMessage: "Request not found",
    });
  }

  let sasUrl = "";
  let expiresOn = new Date();

  if (request.PublishedDataset.public && request.PublishedDataset.containerId) {
    const publishedDatalakeServiceClient =
      DataLakeServiceClient.fromConnectionString(
        AZURE_PUBLISHED_CONNECTION_STRING,
      );

    const { accountName } = publishedDatalakeServiceClient;
    const fileSystemName = request.PublishedDataset.containerId;

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
  } else {
    // read the predefined sas url
    // todo: add the predefined sas url
  }

  return {
    ...request,
    expiration: expiresOn.toISOString(),
    sasUrl,
  };
});
