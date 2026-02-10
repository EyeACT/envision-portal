const generateChangelog = async (datasetId: string, userId: string) => {
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

  if (!dataset.changelog) {
    throw createError({
      statusCode: 400,
      statusMessage: "Dataset does not have a changelog",
    });
  }

  return dataset.changelog;
};

export default generateChangelog;
