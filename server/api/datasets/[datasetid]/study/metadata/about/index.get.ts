export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Get the study from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      StudyConditions: true,
      StudyDescription: true,
      StudyIdentification: true,
      StudyKeywords: true,
    },
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId,
        },
      },
    },
  });

  // Check if the dataset exists
  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  const primaryIdentifier = dataset.StudyIdentification.find(
    (identifier) => identifier.isSecondary === false,
  );

  const secondaryIdentifiers = dataset.StudyIdentification.filter(
    (identifier) => identifier.isSecondary === true,
  );

  return {
    primaryIdentifier,
    secondaryIdentifiers,
    ...dataset,
  };
});
