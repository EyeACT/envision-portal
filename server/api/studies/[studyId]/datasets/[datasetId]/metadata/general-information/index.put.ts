import { z } from "zod";

const StudyMetadataAboutSchema = z.object({
  DatasetDate: z.array(
    z.object({
      id: z.string().optional(),
      date: z.string(),
      deleted: z.boolean().optional(),
      information: z.string(),
      type: z.string(),
    }),
  ),
  DatasetDescription: z.array(
    z.object({
      id: z.string().optional(),
      deleted: z.boolean().optional(),
      description: z.string(),
      type: z.string(),
    }),
  ),
  DatasetTitle: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string(),
      deleted: z.boolean().optional(),
      type: z.string(),
    }),
  ),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId, studyId } = event.context.params as {
    datasetId: string;
    studyId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataAboutSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const { DatasetDate, DatasetDescription, DatasetTitle } = body.data;

  // get the titles that already have an id and update them
  const titlesToUpdate = DatasetTitle.filter((title) => title.id);

  for (const title of titlesToUpdate) {
    await prisma.datasetTitle.update({
      data: {
        title: title.title,
        type: title.type,
      },
      where: { id: title.id },
    });
  }

  // get the titles that don't have an id and create them
  const titlesToCreate = DatasetTitle.filter((title) => !title.id);

  for (const title of titlesToCreate) {
    await prisma.datasetTitle.create({
      data: {
        title: title.title,
        datasetId,
        type: title.type,
      },
    });
  }

  // get the titles that are deleted and delete them
  const titlesToDelete = DatasetTitle.filter((title) => title.deleted);

  for (const title of titlesToDelete) {
    await prisma.datasetTitle.delete({
      where: { id: title.id },
    });
  }

  // get the descriptions that already have an id and update them
  const descriptionsToUpdate = DatasetDescription.filter(
    (description) => description.id,
  );

  for (const description of descriptionsToUpdate) {
    await prisma.datasetDescription.update({
      data: {
        description: description.description,
        type: description.type,
      },
      where: { id: description.id },
    });
  }

  // get the descriptions that don't have an id and create them
  const descriptionsToCreate = DatasetDescription.filter(
    (description) => !description.id,
  );

  for (const description of descriptionsToCreate) {
    await prisma.datasetDescription.create({
      data: {
        datasetId,
        description: description.description,
        type: description.type,
      },
    });
  }

  // get the descriptions that are deleted and delete them
  const descriptionsToDelete = DatasetDescription.filter(
    (description) => description.deleted,
  );

  for (const description of descriptionsToDelete) {
    await prisma.datasetDescription.delete({
      where: { id: description.id },
    });
  }

  // get the dates that already have an id and update them
  const datesToUpdate = DatasetDate.filter((date) => date.id);

  for (const date of datesToUpdate) {
    await prisma.datasetDate.update({
      data: {
        date: date.date ? new Date(date.date) : null,
        information: date.information,
        type: date.type,
      },
      where: { id: date.id },
    });
  }

  // get the dates that don't have an id and create them
  const datesToCreate = DatasetDate.filter((date) => !date.id);

  for (const date of datesToCreate) {
    await prisma.datasetDate.create({
      data: {
        datasetId,
        date: date.date ? new Date(date.date) : null,
        information: date.information,
        type: date.type,
      },
    });
  }

  // get the dates that are deleted and delete them
  const datesToDelete = DatasetDate.filter((date) => date.deleted);

  for (const date of datesToDelete) {
    await prisma.datasetDate.delete({
      where: { id: date.id },
    });
  }

  return {
    success: true,
  };
});
