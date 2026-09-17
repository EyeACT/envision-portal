import { BlobServiceClient } from "@azure/storage-blob";

// Function to convert blob paths into a tree structure for UTree
function convertBlobsToTree(blobs: any[]) {
  const tree: any[] = [];
  
  // Sort paths to ensure directories come before their files
  const sortedBlobs = blobs.sort((a, b) => {
    const aDepth = (a.name.match(/\//g) || []).length;
    const bDepth = (b.name.match(/\//g) || []).length;

    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.name.localeCompare(b.name);
  });

  for (const blob of sortedBlobs) {
    const pathParts = blob.name.split("/");
    let currentLevel = tree;
    let currentPath = "";

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = i === pathParts.length - 1;

      // Check if this level already exists
      let existingNode = currentLevel.find((node) => node.label === part);

      if (!existingNode) {
        const newNode: any = {
          children: isLastPart ? undefined : [],
          icon: isLastPart ? getFileIcon(part) : "i-heroicons-folder",
          label: part,
        };

        // Add defaultExpanded for root level directories
        if (i === 0 && !isLastPart) {
          newNode.defaultExpanded = false;
        }

        currentLevel.push(newNode);
        existingNode = newNode;
      }

      // Move to next level if it's a directory
      if (!isLastPart && existingNode.children) {
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
    case "txt":
      return "i-heroicons-document-text";
    case "zip":
      return "i-vscode-icons-file-type-zip";
    case "tsv":
      return "i-vscode-icons-file-type-csv";
    case "dcm":
      return "i-vscode-icons-file-type-dicom";
    default:
      return "i-heroicons-document";
  }
}

export default defineEventHandler(async (event) => {
  const { AZURE_DRAFT_CONNECTION_STRING } = useRuntimeConfig();
  await requireUserSession(event);

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
    },
  });

  // Check if the dataset exists in PostgreSQL
  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  // Initialize the standard BlobServiceClient
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  );

  // Azure container names must be lowercase
  const containerClient = blobServiceClient.getContainerClient(dataset.id.toLowerCase());

  const blobs: any[] = [];

  try {
    // Gracefully check if the container exists before attempting to list blobs
    if (!(await containerClient.exists())) {
      return {
        ...dataset,
        files: [],
        paths: [],
      };
    }

    // List all blobs flatly; forward slashes ("/") represent virtual directories
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push({ name: blob.name });
    }
  } catch (error: any) {
    // Fallback safeguard if Azure throws a 404 during iteration
    if (error.statusCode === 404 || error.code === 'ContainerNotFound') {
      return {
        ...dataset,
        files: [],
        paths: [],
      };
    }
    throw error;
  }

  // Convert raw blob paths into a nested tree format for your UI component
  const files = convertBlobsToTree(blobs);

  return {
    ...dataset,
    files,
    paths: blobs,
  };
});