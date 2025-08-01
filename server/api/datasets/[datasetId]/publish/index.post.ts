import { DataLakeServiceClient } from "@azure/storage-file-datalake";
import { createId } from "@paralleldrive/cuid2";
import { faker } from "@faker-js/faker";
import DatasetRecords from "~/dev/datasetRecords.json";
import PublishingStatus from "~/assets/data/publishing-status.json";

const getPublishingStatusIndex = (status: string) => {
  const statusObject =
    PublishingStatus[status as keyof typeof PublishingStatus];

  return statusObject?.index;
};

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

  let publishingStatusIndex = getPublishingStatusIndex("preparing");

  const publishingStatus = await prisma.datasetPublishingStatus.findUnique({
    where: {
      datasetId,
    },
  });

  if (!publishingStatus) {
    await prisma.datasetPublishingStatus.create({
      data: {
        comment: "",
        currentFileNumber: 0,
        datasetId,
        fileCount: 0,
        status: publishingStatusIndex,
      },
    });
  } else {
    await prisma.datasetPublishingStatus.update({
      data: {
        comment: "",
        currentFileNumber: 0,
        fileCount: 0,
        status: publishingStatusIndex,
      },
      where: {
        datasetId,
      },
    });
  }

  // Start the publish process
  // 1. Validate the dataset metadata

  publishingStatusIndex = getPublishingStatusIndex(
    "validating-dataset-metadata",
  );

  await prisma.datasetPublishingStatus.update({
    data: {
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });
  // 2. Validate the study metadata

  publishingStatusIndex = getPublishingStatusIndex("validating-study-metadata");

  await prisma.datasetPublishingStatus.update({
    data: {
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });

  // 3. Validate the healthsheet

  publishingStatusIndex = getPublishingStatusIndex("validating-healthsheet");

  await prisma.datasetPublishingStatus.update({
    data: {
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });

  // 4. Create the container for the dataset in the published storage account

  const publishedDatalakeServiceClient =
    DataLakeServiceClient.fromConnectionString(
      AZURE_PUBLISHED_CONNECTION_STRING,
    );
  const publishedContainerName = createId(); // Or `published-${dataset.id}`
  const publishedFileSystemClient =
    publishedDatalakeServiceClient.getFileSystemClient(publishedContainerName);

  await publishedFileSystemClient.create(); // Always new container

  // 5. Move the dataset to the container (this probably needs to be a scheduled job)

  publishingStatusIndex = getPublishingStatusIndex("indexing-dataset");

  await prisma.datasetPublishingStatus.update({
    data: {
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });

  // Get the files from the draft storage account
  const draftDatalakeServiceClient = DataLakeServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  );
  const draftFileSystemClient =
    draftDatalakeServiceClient.getFileSystemClient("test");

  const files: string[] = [];
  let index = 0;

  for await (const draftFile of draftFileSystemClient.listPaths({
    recursive: true,
  })) {
    const filePath = draftFile.name || "";

    if (filePath === "" || draftFile.isDirectory) {
      continue;
    }

    files.push(filePath);
    index++;

    if (index % 1000 === 0) {
      await prisma.datasetPublishingStatus.update({
        data: {
          fileCount: index,
        },
        where: {
          datasetId,
        },
      });
    }
  }

  publishingStatusIndex = getPublishingStatusIndex(
    "moving-dataset-to-published-storage",
  );

  index = 0;

  await prisma.datasetPublishingStatus.update({
    data: {
      currentFileNumber: 0,
      fileCount: files.length,
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });

  // Copy files from draft to published
  for (const draftFilePath of files) {
    const filePath = draftFilePath;
    const fileName = filePath.split("/").pop();

    if (!fileName) {
      continue;
    }

    await prisma.datasetPublishingStatus.update({
      data: {
        comment: `Moving file ${fileName}`,
        currentFileNumber: index + 1,
      },
      where: {
        datasetId,
      },
    });

    const draftFileClient = draftFileSystemClient.getFileClient(filePath);
    const content = await draftFileClient.readToBuffer();

    const publishedFileClient =
      publishedFileSystemClient.getFileClient(filePath);

    await publishedFileClient.create();
    await publishedFileClient.upload(content);
  }

  publishingStatusIndex = getPublishingStatusIndex(
    "generating-uploading-metadata-files",
  );

  await prisma.datasetPublishingStatus.update({
    data: {
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });

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

  // 6. Generate and upload the dataset metadata file

  await prisma.datasetPublishingStatus.update({
    data: {
      comment: "Uploading the dataset_description.json metadata file",
    },
    where: {
      datasetId,
    },
  });

  let publishedFileClient = publishedFileSystemClient.getFileClient(
    "dataset_description.json",
  );
  let data: Buffer = Buffer.from(datasetDescription);

  await publishedFileClient.create();
  await publishedFileClient.upload(data);

  // 7. Generate and upload the study metadata file

  await prisma.datasetPublishingStatus.update({
    data: {
      comment: "Uploading the study_description.json metadata file",
    },
    where: {
      datasetId,
    },
  });

  publishedFileClient = publishedFileSystemClient.getFileClient(
    "study_description.json",
  );
  data = Buffer.from(studyDescription);

  await publishedFileClient.create();
  await publishedFileClient.upload(data);

  // 8. Generate and upload the healthsheet file

  await prisma.datasetPublishingStatus.update({
    data: {
      comment: "Uploading the healthsheet.md metadata file",
    },
    where: {
      datasetId,
    },
  });

  publishedFileClient =
    publishedFileSystemClient.getFileClient("healthsheet.md");

  data = Buffer.from(healthsheet);

  await publishedFileClient.create();
  await publishedFileClient.upload(data);

  // 9. Generate and upload the changelog file

  await prisma.datasetPublishingStatus.update({
    data: {
      comment: "Uploading the changelog.md metadata file",
    },
    where: {
      datasetId,
    },
  });

  publishedFileClient = publishedFileSystemClient.getFileClient("CHANGELOG.md");

  data = Buffer.from(changelog);

  await publishedFileClient.create();
  await publishedFileClient.upload(data);

  // 10. Generate and upload the readme file

  await prisma.datasetPublishingStatus.update({
    data: {
      comment: "Uploading the README.md metadata file",
    },
    where: {
      datasetId,
    },
  });

  publishedFileClient = publishedFileSystemClient.getFileClient("README.md");

  data = Buffer.from(readme);

  await publishedFileClient.create();
  await publishedFileClient.upload(data);

  publishingStatusIndex = getPublishingStatusIndex("registering-doi");

  await prisma.datasetPublishingStatus.update({
    data: {
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });

  // Register the doi for the dataset

  publishingStatusIndex = getPublishingStatusIndex("registering-dataset");

  // Update the dataset status to published

  await prisma.datasetPublishingStatus.update({
    data: {
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });

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

  await prisma.datasetPublishingStatus.update({
    data: {
      status: getPublishingStatusIndex("completed"),
    },
    where: {
      datasetId,
    },
  });

  return {
    success: true,
  };
});
