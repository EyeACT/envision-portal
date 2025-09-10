import {
  DataLakeServiceClient,
  StorageSharedKeyCredential,
  generateDataLakeSASQueryParameters,
  FileSystemSASPermissions,
} from "@azure/storage-file-datalake";

export default defineEventHandler(async (event) => {
  const { AZURE_DRAFT_ACCOUNT_KEY, AZURE_DRAFT_CONNECTION_STRING } =
    useRuntimeConfig();
  const session = await requireUserSession(event);

  // todo: add permissions check
  // only allow users with the role of data-curator or higher

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
    },
  });

  // Check if the dataset exists
  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  const draftDatalakeServiceClient = DataLakeServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  );

  const { accountName } = draftDatalakeServiceClient;
  const fileSystemName = dataset.id;

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    AZURE_DRAFT_ACCOUNT_KEY,
  );

  const now = new Date();
  const expiresOn = new Date(now);

  expiresOn.setHours(now.getHours() + 1); // 1-hour expiration

  const containerSAS = generateDataLakeSASQueryParameters(
    {
      expiresOn,
      fileSystemName,
      // isDirectory: true,
      // pathName: "/",
      permissions: FileSystemSASPermissions.parse("racwdl"), // read, add, create, write, delete, list
      startsOn: now,
    },
    sharedKeyCredential,
  ).toString();

  const sasUrl = `https://${accountName}.dfs.core.windows.net/${fileSystemName}?${containerSAS}`;

  // replace the string `sp=r` with `sp=rl`
  // sasUrl = sasUrl.replace("sp=racwm&", "sp=racwml&");

  return {
    ...dataset,
    expiration: expiresOn.toISOString(),
    sasUrl,
  };
});
