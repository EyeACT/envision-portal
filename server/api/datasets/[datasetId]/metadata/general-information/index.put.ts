import { DatasetMetadataGeneralInformationSchema } from "#shared/utils/dataset_schemas";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event);

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataGeneralInformationSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: z.treeifyError(body.error),
      statusCode: 400,
      statusMessage: "Invalid data",
    });
  }

  const { DatasetDescription, DatasetOther, DatasetTitle } = body.data;

  const descriptions = splitRows(DatasetDescription);
  const titles = splitRows(DatasetTitle);

  // Save every section together so that a failure doesn't leave only some of them updated
  await prisma.$transaction([
    ...titles.toUpdate.map((title) =>
      prisma.datasetTitle.update({
        data: {
          title: title.title,
          type: title.type,
        },
        where: { id: title.id, datasetId },
      }),
    ),
    ...titles.toCreate.map((title) =>
      prisma.datasetTitle.create({
        data: {
          title: title.title,
          datasetId,
          type: title.type,
        },
      }),
    ),
    ...titles.toDelete.map((title) =>
      prisma.datasetTitle.delete({
        where: { id: title.id, datasetId },
      }),
    ),

    ...descriptions.toUpdate.map((description) =>
      prisma.datasetDescription.update({
        data: {
          description: description.description,
          type: description.type,
        },
        where: { id: description.id, datasetId },
      }),
    ),
    ...descriptions.toCreate.map((description) =>
      prisma.datasetDescription.create({
        data: {
          datasetId,
          description: description.description,
          type: description.type,
        },
      }),
    ),
    ...descriptions.toDelete.map((description) =>
      prisma.datasetDescription.delete({
        where: { id: description.id, datasetId },
      }),
    ),

    prisma.datasetOther.update({
      data: {
        language: DatasetOther.language,
        resourceTypeName: DatasetOther.resourceTypeName,
      },
      where: { datasetId },
    }),
  ]);

  return {
    success: true,
  };
});
