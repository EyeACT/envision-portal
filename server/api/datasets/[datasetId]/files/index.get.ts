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

export default defineEventHandler(async (event) => {
  await datasetMinViewerPermission(event)

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

  // Paths are relative to the data folder so they match what the owner sees
  const blobs = (await listDatasetDataFiles(dataset)).map(({ path }) => ({
    name: path,
  }));

  // Convert raw blob paths into a nested tree format for your UI component
  const files = convertBlobsToTree(blobs);

  return {
    ...dataset,
    files,
    paths: blobs,
  };
});