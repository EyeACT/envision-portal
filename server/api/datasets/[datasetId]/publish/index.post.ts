import { DataLakeServiceClient } from "@azure/storage-file-datalake";
import { createId } from "@paralleldrive/cuid2";

export default defineEventHandler(async (event) => {
  const { AZURE_DRAFT_CONNECTION_STRING, AZURE_PUBLISHED_CONNECTION_STRING } =
    useRuntimeConfig();

  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId,
        },
      },
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  // Start the publish process
  // 1. Validate the dataset metadata
  // 2. Validate the study metadata
  // 3. Validate the healthsheet
  // 4. Validate the dataset changelog
  // 5. Validate the dataset readme

  // 6. Create the container for the dataset in the published storage account

  const publishedDatalakeServiceClient =
    DataLakeServiceClient.fromConnectionString(
      AZURE_PUBLISHED_CONNECTION_STRING,
    );
  const publishedContainerName = createId(); // Or `published-${dataset.id}`
  const publishedFileSystemClient =
    publishedDatalakeServiceClient.getFileSystemClient(publishedContainerName);

  await publishedFileSystemClient.create(); // Always new container

  // 7. Move the dataset to the container (this probably needs to be a scheduled job)

  // Get the files from the draft storage account
  const draftDatalakeServiceClient = DataLakeServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  );
  const draftFileSystemClient =
    draftDatalakeServiceClient.getFileSystemClient("test");

  // Copy files from draft to published
  for await (const draftFile of draftFileSystemClient.listPaths({
    recursive: true,
  })) {
    if (draftFile.isDirectory) continue;

    const draftFileClient = draftFileSystemClient.getFileClient(draftFile.name);
    const content = await draftFileClient.readToBuffer();

    const publishedFileClient = publishedFileSystemClient.getFileClient(
      draftFile.name,
    );

    await publishedFileClient.create();
    await publishedFileClient.append(content, 0, content.length);
    await publishedFileClient.flush(content.length);
  }

  // 8. Generate and upload the dataset metadata file
  // 9. Generate and upload the study metadata file
  // 10. Generate and upload the healthsheet file
  // 11. Generate and upload the changelog file
  // 12. Generate and upload the readme file

  // Register the doi for the dataset

  // Update the dataset status to published
  await prisma.publishedDataset.create({
    data: {
      title: dataset.title,
      canonicalId: dataset.canonicalId,
      data: {},
      datasetId,
      description: dataset.description,
      doi: "10.1000/envision.a3sv45sd",
      external: false,
      externalUrl: null,
      files: {},
      publishedMetadata: {},
      studyTitle: dataset.title,
      versionTitle: dataset.version || "",
    },
  });

  return {
    success: true,
  };
});
