import { z } from "zod";

const createDatasetSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  type: z.string(),
  version: z.string(),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { studyId } = event.context.params as { studyId: string };

  // todo: add permissions check

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    createDatasetSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid study data",
    });
  }

  // TODO: remove this
  // delete the dataset if it already exists
  try {
    await prisma.dataset.delete({
      where: {
        id: "cm880mrva00000cl20uo80c7e",
      },
    });
  } catch (error) {
    console.error(error);
  }

  const newDataset = await prisma.dataset.create({
    data: {
      id: "cm880mrva00000cl20uo80c7e", // todo: remove this
      title: body.data.title,
      DatasetDescription: {
        create: {
          description: body.data.description,
          type: "Abstract",
        },
      },
      DatasetTitle: {
        create: {
          title: body.data.title,
          type: "MainTitle",
        },
      },
      description: body.data.description,
      studyId,
      type: body.data.type,
      version: body.data.version,
    },
  });

  return {
    data: { datasetId: newDataset.id },
    statusCode: 201,
  };
});
