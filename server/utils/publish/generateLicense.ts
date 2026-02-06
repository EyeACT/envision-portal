const generateLicense = async (datasetId: string, userId: string) => {
  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetRights: true,
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

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  if (!dataset.DatasetRights?.licenseText) {
    throw createError({
      statusCode: 400,
      statusMessage: "Dataset does not have license text",
    });
  }

  return dataset.DatasetRights.licenseText;
};

export default generateLicense;
