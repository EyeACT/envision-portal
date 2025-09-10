import { DataLakeServiceClient } from "@azure/storage-file-datalake";
import { createId } from "@paralleldrive/cuid2";
import { faker } from "@faker-js/faker";
import DatasetRecords from "~/dev/datasetRecords.json";
import PublishingStatus from "~/assets/data/publishing-status.json";
import {
  validateDatasetMetadata,
  validateStudyMetadata,
} from "@/server/api/utils/validations";

const getPublishingStatusIndex = (status: string) => {
  const statusObject =
    PublishingStatus[status as keyof typeof PublishingStatus];

  return statusObject?.index;
};

function convertPathsToTree(paths: any[]) {
  const tree: any[] = [];

  // Sort paths to ensure directories come before their files
  const sortedPaths = paths.sort((a, b) => {
    const aDepth = (a.name.match(/\//g) || []).length;
    const bDepth = (b.name.match(/\//g) || []).length;

    if (aDepth !== bDepth) {
      return aDepth - bDepth;
    }

    return a.name.localeCompare(b.name);
  });

  for (const path of sortedPaths) {
    const pathParts = path.name.split("/");
    let currentLevel = tree;
    let currentPath = "";

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];

      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = i === pathParts.length - 1;
      const isDirectory = !isLastPart || path.isDirectory;

      // Check if this level already exists
      let existingNode = currentLevel.find((node) => node.label === part);

      if (!existingNode) {
        // Create new node
        const newNode: any = {
          children: isDirectory ? [] : undefined,
          icon: isDirectory
            ? part.includes(".")
              ? "i-heroicons-folder"
              : "i-heroicons-folder"
            : getFileIcon(part),
          label: part,
          // Add file metadata if it's a file
          ...(isLastPart && !isDirectory
            ? {
                // lastModified: path.lastModified,
                // size: path.contentLength,
              }
            : {}),
        };

        // Add defaultExpanded for root level directories
        if (i === 0 && isDirectory) {
          newNode.defaultExpanded = false;
        }

        currentLevel.push(newNode);
        existingNode = newNode;
      }

      // Move to next level if it's a directory
      if (isDirectory && existingNode.children) {
        currentLevel = existingNode.children;
      }
    }
  }

  return tree;
}

// Function to get appropriate icon based on file extension
function getFileIcon(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "csv":
      return "i-vscode-icons-file-type-csv";
    case "json":
      return "i-vscode-icons-file-type-json";
    case "xlsx":
    case "xls":
      return "i-vscode-icons-file-type-excel";
    case "md":
      return "i-heroicons-document-text";
    case "txt":
      return "i-heroicons-document-text";
    case "zip":
      return "i-vscode-icons-file-type-zip";
    case "dcm":
      return "i-vscode-icons-file-type-dicom";
    case "tsv":
      return "i-vscode-icons-file-type-csv";
    default:
      return "i-heroicons-document";
  }
}

export default defineEventHandler(async (event) => {
  const { AZURE_DRAFT_CONNECTION_STRING, AZURE_PUBLISHED_CONNECTION_STRING } =
    useRuntimeConfig();

  const { environment } = useRuntimeConfig().public;

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

  if (environment !== "development") {
    const datasetValidation = await validateDatasetMetadata(datasetId, userId);

    if (!datasetValidation.valid.success) {
      throw createError({
        data: datasetValidation,
        statusCode: 400,
        statusMessage: "Dataset validation failed",
      });
    }
  }

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

  if (environment !== "development") {
    const studyValidation = await validateStudyMetadata(datasetId, userId);

    if (!studyValidation.valid.success) {
      throw createError({
        data: studyValidation,
        statusCode: 400,
        statusMessage: "Study validation failed",
      });
    }
  }

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
  const draftFileSystemClient = draftDatalakeServiceClient.getFileSystemClient(
    dataset.id,
  );

  const files: {
    name: string;
    isDirectory: boolean;
  }[] = [];
  let index = 0;

  for await (const draftFile of draftFileSystemClient.listPaths({
    recursive: true,
  })) {
    const filePath = draftFile.name || "";

    if (filePath === "" || draftFile.isDirectory) {
      continue;
    }

    files.push({
      name: filePath,
      isDirectory: false,
    });
    index++;

    if (index % 1000 === 0) {
      await prisma.datasetPublishingStatus.update({
        data: {
          comment: `Discovered ${index} files...`,
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
    const filePath = draftFilePath.name;
    const fileName = filePath.split("/").pop();

    if (!fileName) {
      continue;
    }

    await prisma.datasetPublishingStatus.update({
      data: {
        comment: `Moving file ${fileName}`,
        currentFileNumber: index++,
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

  // Generate a file tree for the dataset
  const fileTree = await convertPathsToTree([
    ...files,
    {
      name: "dataset_description.json",
      isDirectory: false,
    },
    {
      name: "study_description.json",
      isDirectory: false,
    },
    {
      name: "healthsheet.md",
      isDirectory: false,
    },
    {
      name: "CHANGELOG.md",
      isDirectory: false,
    },
    {
      name: "README.md",
      isDirectory: false,
    },
  ]);

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

  const publishedDataset = await prisma.publishedDataset.create({
    data: {
      title: dataset.title,
      canonicalId: dataset.canonicalId,
      containerId: publishedContainerName,
      data: firstEntry.data,
      datasetId: dataset.id,
      description: dataset.description,
      doi: `10.1000/envision.${faker.string.alphanumeric(10)}`,
      external: false,
      externalUrl: null,
      files: JSON.stringify(fileTree),
      public: true,
      publishedMetadata: firstEntry.publishedMetadata,
      status: "ready",
      studyTitle: firstEntry.studyTitle,
      versionTitle: faker.system.semver() || "",
    },
  });

  await prisma.publishedDataset.update({
    data: {
      doi: `10.1000/envision.${publishedDataset.id}`,
    },
    where: {
      id: publishedDataset.id,
    },
  });

  await prisma.datasetPublishingStatus.update({
    data: {
      comment: "Publishing workflow completed",
      currentFileNumber: 0,
      fileCount: 0,
      status: getPublishingStatusIndex("completed"),
    },
    where: {
      datasetId,
    },
  });

  await prisma.dataset.update({
    data: {
      doi: `10.1000/envision.${publishedDataset.id}`,
      publishedId: publishedDataset.id,
      status: "published",
    },
    where: {
      id: datasetId,
    },
  });

  return {
    success: true,
  };
});
