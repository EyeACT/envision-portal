import { DataLakeServiceClient } from "@azure/storage-file-datalake";

// Function to convert paths array to tree structure
function convertPathsToTree(paths: any[]) {
  const tree: any[] = [];
  const pathMap = new Map();

  // Sort paths to ensure directories come before their files
  const sortedPaths = paths.sort((a, b) => {
    const aDepth = (a.name.match(/\//g) || []).length;
    const bDepth = (b.name.match(/\//g) || []).length;

    if (aDepth !== bDepth) return aDepth - bDepth;

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
  const { AZURE_DRAFT_CONNECTION_STRING } = useRuntimeConfig();
  const session = await requireUserSession(event);

  // todo: add permissions check

  const { datasetId, studyId } = event.context.params as {
    datasetId: string;
    studyId: string;
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

  const datalakeServiceClient = DataLakeServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  );

  const fileSystemClient = datalakeServiceClient.getFileSystemClient(
    dataset.id,
  );

  const paths: any[] = [];

  const iterator = fileSystemClient.listPaths({
    recursive: true,
  });
  let fileSystemItem = await iterator.next();

  while (!fileSystemItem.done) {
    paths.push(fileSystemItem.value);

    fileSystemItem = await iterator.next();
  }

  // Convert paths to tree structure
  const files = convertPathsToTree(paths);

  return {
    ...dataset,
    files,
    paths,
  };
});
