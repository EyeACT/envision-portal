export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId, studyId } = event.context.params as {
    datasetId: string;
    studyId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetContributor: true,
      DatasetFunder: true,
      DatasetManagingOrganization: true,
      study: true,
    },
    where: {
      id: datasetId,
      study: {
        StudyMember: {
          some: {
            userId,
          },
        },
      },
      studyId,
    },
  });

  // Check if the dataset exists
  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  const creators = dataset.DatasetContributor.filter(
    (contributor) => contributor.creator,
  );

  const contributors = dataset.DatasetContributor.filter(
    (contributor) => !contributor.creator,
  );

  const funders = dataset.DatasetFunder;

  const d = {
    ...dataset,
    contributors: contributors.map((contributor) => ({
      ...contributor,
      affiliations: JSON.parse(String(contributor.affiliations || "[]")),
    })),
    creators: creators.map((creator) => ({
      ...creator,
      affiliations: JSON.parse(String(creator.affiliations || "[]")),
    })),
    funders,
    managingOrganization: dataset.DatasetManagingOrganization,
  };

  return {
    ...d,
  };
});
