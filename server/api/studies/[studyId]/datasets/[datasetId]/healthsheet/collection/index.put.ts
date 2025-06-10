import { z } from "zod";

const DatasetHealthsheetCollectionSchema = z.object({
  records: z.array(
    z.object({
      id: z.number(),
      question: z.string(),
      response: z.string(),
    }),
  ),
  version: z.number(),
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
    DatasetHealthsheetCollectionSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const { records, version } = body.data;

  const collection = await prisma.datasetHealthsheet.update({
    data: {
      collection: JSON.stringify({
        records,
        version,
      }),
    },
    where: {
      datasetId,
    },
  });

  return {
    success: true,
  };
});
