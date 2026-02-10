const generateReadme = async (datasetId: string, userId: string) => {
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

  if (!dataset.readme) {
    throw createError({
      statusCode: 400,
      statusMessage: "Dataset does not have a README",
    });
  }

  return dataset.readme;
};

export default generateReadme;
