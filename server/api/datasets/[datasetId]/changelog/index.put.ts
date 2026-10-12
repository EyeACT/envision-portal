import { z } from "zod";

const DatasetChangelogSchema = z.object({
  changelog: z.string(),
});

export default defineEventHandler(async (event) => {
  const member = await datasetMinEditorPermission(event)

  const userId = member.userId;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetChangelogSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const { changelog } = body.data;

  await prisma.dataset.update({
    data: {
      changelog,
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

  return {
    success: true,
  };
});
