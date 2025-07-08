import { z } from "zod";

const DatasetHealthsheetCompositionSchema = z.object({
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

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetHealthsheetCompositionSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const { records, version } = body.data;

  const composition = await prisma.datasetHealthsheet.update({
    data: {
      composition: JSON.stringify({
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
