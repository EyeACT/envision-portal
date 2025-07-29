import { DataLakeServiceClient } from "@azure/storage-file-datalake";
import type {
  DataLakeDirectoryClient,
  DataLakeFileClient,
} from "@azure/storage-file-datalake";

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

  const publishedContainerName = `published-${dataset.id}`;

  const publishedFileSystemClient =
    publishedDatalakeServiceClient.getFileSystemClient(publishedContainerName);

  // delete the container if it exists
  if (await publishedFileSystemClient.exists()) {
    // await publishedFileSystemClient.delete();

    // delete all files in the container
    const iterator = publishedFileSystemClient.listPaths({
      recursive: true,
    });
    let publishedFileSystemItem = await iterator.next();

    while (!publishedFileSystemItem.done) {
      const publishedFile = publishedFileSystemItem.value;

      const publishedFileClient = publishedFileSystemClient.getFileClient(
        publishedFile.name || "",
      );

      await publishedFileClient.delete();

      publishedFileSystemItem = await iterator.next();
    }
  }

  // Check if the container already exists
  // if (await fileSystemClient.exists()) {
  //   throw createError({
  //     statusCode: 400,
  //     statusMessage: "Dataset already published",
  //   });
  // }

  // Create the container if it doesn't exist
  if (!(await publishedFileSystemClient.exists())) {
    await publishedFileSystemClient.create();
  }

  // 7. Move the dataset to the container (this probably needs to be a scheduled job)

  // Get the files from the draft storage account
  const draftDatalakeServiceClient = DataLakeServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  );
  const draftFileSystemClient =
    draftDatalakeServiceClient.getFileSystemClient("test");

  const iterator = draftFileSystemClient.listPaths({
    recursive: true,
  });
  let draftFileSystemItem = await iterator.next();

  while (!draftFileSystemItem.done) {
    const draftFile = draftFileSystemItem.value;

    console.log(draftFile.name, draftFile.isDirectory);

    const isInADirectory = draftFile.name?.includes("/");
    let directoryClient: DataLakeDirectoryClient;
    let draftFileClient: DataLakeFileClient =
      publishedFileSystemClient.getFileClient(draftFile.name || "");

    if (isInADirectory) {
      const directories = draftFile.name?.split("/") || [];

      if (directories.length > 1) {
        directoryClient = publishedFileSystemClient.getDirectoryClient(
          directories[0] || "",
        );

        for (let i = 1; i < directories?.length; i++) {
          const directory = directories.slice(0, i).join("/");

          directoryClient =
            publishedFileSystemClient.getDirectoryClient(directory);

          if (!(await directoryClient.exists())) {
            await directoryClient.create();
          }
        }

        draftFileClient = directoryClient.getFileClient(
          directories.pop() || "",
        );
      }
    } else {
      console.log("copying file");

      draftFileClient = draftFileSystemClient.getFileClient(
        draftFile.name || "",
      );
    }

    const draftFileContent = await draftFileClient.readToBuffer();

    const publishedFileClient = publishedFileSystemClient.getFileClient(
      draftFile.name || "",
    );

    await publishedFileClient.create();
    await publishedFileClient.upload(draftFileContent);

    draftFileSystemItem = await iterator.next();
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
