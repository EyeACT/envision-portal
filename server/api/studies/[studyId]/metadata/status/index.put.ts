import { z } from "zod";

const StudyMetadataStatusSchema = z.object({
  completionDate: z.string(),
  completionDateType: z.string(),
  overallStatus: z.string(),
  startDate: z.string(),
  startDateType: z.string(),
  whyStopped: z.string(),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { studyId } = event.context.params as { studyId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataStatusSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const {
    completionDate,
    completionDateType,
    overallStatus,
    startDate,
    startDateType,
    whyStopped,
  } = body.data;

  const updatedStudyStatus = await prisma.studyStatus.update({
    data: {
      completionDate,
      completionDateType,
      overallStatus,
      startDate,
      startDateType,
      whyStopped,
    },
    where: { studyId },
  });

  return {
    updatedStudyStatus,
  };
});
