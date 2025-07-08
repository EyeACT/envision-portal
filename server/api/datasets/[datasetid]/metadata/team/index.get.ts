export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetContributor: true,
      DatasetFunder: true,
      DatasetManagingOrganization: true,
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
