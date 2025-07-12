export default defineEventHandler(async (event) => {
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

  // Create the container for the dataset
  // Move the dataset to the container (this probably needs to be a scheduled job)

  // Generate and upload the dataset metadata file
  // Generate and upload the study metadata file
  // Generate and upload the healthsheet file
  // Generate and upload the changelog file
  // Generate and upload the readme file

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
