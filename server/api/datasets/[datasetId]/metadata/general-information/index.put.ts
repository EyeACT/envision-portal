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

  // Save every section together so that a failure doesn't leave only some of them updated
  await prisma.$transaction([
    ...DatasetTitle.filter((title) => title.id).map((title) =>
      prisma.datasetTitle.update({
        data: {
          title: title.title,
          type: title.type,
        },
        where: { id: title.id, datasetId },
      }),
    ),
    ...DatasetTitle.filter((title) => !title.id).map((title) =>
      prisma.datasetTitle.create({
        data: {
          title: title.title,
          datasetId,
          type: title.type,
        },
      }),
    ),
    ...DatasetTitle.filter((title) => title.deleted).map((title) =>
      prisma.datasetTitle.delete({
        where: { id: title.id, datasetId },
      }),
    ),

    ...DatasetDescription.filter((description) => description.id).map(
      (description) =>
        prisma.datasetDescription.update({
          data: {
            description: description.description,
            type: description.type,
          },
          where: { id: description.id, datasetId },
        }),
    ),
    ...DatasetDescription.filter((description) => !description.id).map(
      (description) =>
        prisma.datasetDescription.create({
          data: {
            datasetId,
            description: description.description,
            type: description.type,
          },
        }),
    ),
    ...DatasetDescription.filter((description) => description.deleted).map(
      (description) =>
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
