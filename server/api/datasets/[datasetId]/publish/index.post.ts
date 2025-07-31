import { DataLakeServiceClient } from "@azure/storage-file-datalake";
import { createId } from "@paralleldrive/cuid2";
import { faker } from "@faker-js/faker";
import DatasetRecords from "~/dev/datasetRecords.json";

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
    const filePath = draftFile.name || "";

    if (filePath === "" || draftFile.isDirectory) {
      continue;
    }

    const draftFileClient = draftFileSystemClient.getFileClient(filePath);
    const content = await draftFileClient.readToBuffer();

    const publishedFileClient =
      publishedFileSystemClient.getFileClient(filePath);

    await publishedFileClient.create();
    await publishedFileClient.upload(content);
  }

  const firstEntry = DatasetRecords[0];

  const datasetDescription = JSON.stringify(
    firstEntry.publishedMetadata.datasetDescription,
    null,
    2,
  );
  const healthsheet = JSON.stringify(
    firstEntry.publishedMetadata.healthsheet,
    null,
    2,
  );
  const readme = JSON.stringify(firstEntry.publishedMetadata.readme, null, 2);
  const studyDescription = JSON.stringify(
    firstEntry.publishedMetadata.studyDescription,
    null,
    2,
  );

  const changelog = "# Changelog\n\n## 1.0.0\n\n- Initial release";

  // 8. Generate and upload the dataset metadata file

  let publishedFileClient = publishedFileSystemClient.getFileClient(
    "dataset_description.json",
  );
  let data: Buffer = Buffer.from(datasetDescription);

  await publishedFileClient.create();
  await publishedFileClient.upload(data);

  // 9. Generate and upload the study metadata file

  publishedFileClient = publishedFileSystemClient.getFileClient(
    "study_description.json",
  );
  data = Buffer.from(studyDescription);

  await publishedFileClient.create();
  await publishedFileClient.upload(data);

  // 10. Generate and upload the healthsheet file

  publishedFileClient =
    publishedFileSystemClient.getFileClient("healthsheet.md");

  data = Buffer.from(healthsheet);

  await publishedFileClient.create();
  await publishedFileClient.upload(data);

  // 11. Generate and upload the changelog file

  publishedFileClient = publishedFileSystemClient.getFileClient("CHANGELOG.md");

  data = Buffer.from(changelog);

  await publishedFileClient.create();
  await publishedFileClient.upload(data);

  // 12. Generate and upload the readme file

  publishedFileClient = publishedFileSystemClient.getFileClient("README.md");

  data = Buffer.from(readme);

  await publishedFileClient.create();
  await publishedFileClient.upload(data);

  // Register the doi for the dataset

  // Update the dataset status to published
  await prisma.publishedDataset.create({
    data: {
      title: dataset.title,
      canonicalId: dataset.canonicalId,
      data: firstEntry.data,
      datasetId: createId(),
      description: dataset.description,
      doi: `10.1000/envision.${faker.string.alphanumeric(10)}`,
      external: false,
      externalUrl: null,
      files: firstEntry.files,
      publishedMetadata: firstEntry.publishedMetadata,
      studyTitle: firstEntry.studyTitle,
      versionTitle: faker.system.semver() || "",
    },
  });

  return {
    success: true,
  };
});
