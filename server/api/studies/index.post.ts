import { z } from "zod";

const createStudySchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  imageUrl: z.string().optional(),
});

// Create new study into the prisma database
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    createStudySchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid study data",
    });
  }

  // TODO: remove this
  // delete the study if it already exists
  await prisma.study.delete({
    where: {
      id: "cm880mrva00000cl20uo80c7e",
    },
  });

  // Create the new study in the database
  const newStudy = await prisma.study.create({
    data: {
      id: "cm880mrva00000cl20uo80c7e", // todo: remove this
      title: body.data.title,
      acronym: "",
      imageUrl: body.data.imageUrl,
      StudyDescription: {
        create: {
          briefSummary: body.data.description,
          detailedDescription: "",
        },
      },
      StudyDesign: {
        create: {
          bioSpecDescription: null,
          bioSpecRetention: null,
          designAllocation: null,
          designInterventionModel: null,
          designMasking: null,
          designMaskingDescription: null,
          designOberservationalModelList: [],
          designPrimaryPurpose: null,
          designTimePerspectiveList: [],
          designWhoMaskedList: [],
          enrollmentCount: null,
          enrollmentType: null,
          isPatientRegistry: null,
          numberOfArms: null,
          phaseList: [],
          studyType: null,
          targetDuration: null,
        },
      },
      StudyMember: {
        create: {
          owner: true,
          role: "owner",
          userId,
        },
      },
    },
  });

  return {
    data: { studyId: newStudy.id },
    statusCode: 201,
  };
});
