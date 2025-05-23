import { z } from "zod";

const StudyMetadataAboutSchema = z.object({
  allocation: z.string(),
  bioSpecDescription: z.string(),
  bioSpecRetention: z.string(),
  enrollmentCount: z.number(),
  enrollmentType: z.string(),
  interventionModel: z.string(),
  interventionModelDescription: z.string(),
  isPatientRegistry: z.string(),
  masking: z.string(),
  maskingDescription: z.string(),
  numberOfArms: z.number(),
  oberservationalModelList: z.array(z.string()),
  phaseList: z.array(z.string()),
  primaryPurpose: z.string(),
  studyType: z.string(),
  targetDuration: z.number(),
  targetDurationUnit: z.string(),
  timePerspectiveList: z.array(z.string()),
  whoMaskedList: z.array(z.string()),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { studyId } = event.context.params as { studyId: string };

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

  const { enrollmentCount, enrollmentType, studyType } = body.data;

  let {
    allocation,
    bioSpecDescription,
    bioSpecRetention,
    interventionModel,
    interventionModelDescription,
    isPatientRegistry,
    masking,
    maskingDescription,
    numberOfArms,
    oberservationalModelList,
    phaseList,
    primaryPurpose,
    targetDuration,
    targetDurationUnit,
    timePerspectiveList,
    whoMaskedList,
  } = body.data;

  // validate the data
  const errors = [];

  if (!studyType) {
    errors.push({
      message: "Study type is required",
      path: "studyType",
    });
  }

  if (studyType === "Observational") {
    if (!isPatientRegistry) {
      errors.push({
        message: "Is patient registry is required",
        path: "isPatientRegistry",
      });
    }

    if (!oberservationalModelList.length) {
      errors.push({
        message: "Observational model is required",
        path: "oberservationalModelList",
      });
    }

    if (!timePerspectiveList.length) {
      errors.push({
        message: "Time perspective is required",
        path: "timePerspectiveList",
      });
    }

    if (!bioSpecRetention) {
      errors.push({
        message: "Bio specification retention is required",
        path: "bioSpecRetention",
      });
    }

    if (!bioSpecDescription) {
      errors.push({
        message: "Bio specification description is required",
        path: "bioSpecDescription",
      });
    }
  }

  if (studyType === "Interventional") {
    if (!allocation) {
      errors.push({
        message: "Allocation is required",
        path: "allocation",
      });
    }

    if (!interventionModel) {
      errors.push({
        message: "Intervention model is required",
        path: "interventionModel",
      });
    }

    if (!primaryPurpose) {
      errors.push({
        message: "Primary purpose is required",
        path: "primaryPurpose",
      });
    }

    if (!masking) {
      errors.push({
        message: "Masking is required",
        path: "masking",
      });
    }

    if (!whoMaskedList.length) {
      errors.push({
        message: "Who masked is required",
        path: "whoMaskedList",
      });
    }

    if (!phaseList.length) {
      errors.push({
        message: "Phase is required",
        path: "phaseList",
      });
    }

    if (!enrollmentCount) {
      errors.push({
        message: "Enrollment count is required",
        path: "enrollmentCount",
      });
    }

    if (!numberOfArms) {
      errors.push({
        message: "Number of arms is required",
        path: "numberOfArms",
      });
    }
  }

  if (!enrollmentType) {
    errors.push({
      message: "Enrollment type is required",
      path: "enrollmentType",
    });
  }

  if (errors.length > 0) {
    throw createError({
      data: { errors },
      statusCode: 400,
      statusMessage: "Invalid study design data",
    });
  }

  // reset all values that are not relevant to the study type
  if (studyType === "Observational") {
    allocation = "";
    interventionModel = "";
    interventionModelDescription = "";
    primaryPurpose = "";
    masking = "";
    maskingDescription = "";
    whoMaskedList = [];
    phaseList = [];
    numberOfArms = 0;
  }

  if (studyType === "Interventional") {
    isPatientRegistry = "";
    oberservationalModelList = [];
    timePerspectiveList = [];
    bioSpecDescription = "";
    bioSpecRetention = "";
    targetDuration = 0;
    targetDurationUnit = "";
  }

  const updatedStudyDesign = await prisma.studyDesign.update({
    data: {
      allocation,
      bioSpecDescription,
      bioSpecRetention,
      enrollmentCount,
      enrollmentType,
      interventionModel,
      interventionModelDescription,
      isPatientRegistry,
      masking,
      maskingDescription,
      numberOfArms,
      oberservationalModelList,
      phaseList,
      primaryPurpose,
      studyType,
      targetDuration,
      targetDurationUnit,
      timePerspectiveList,
      whoMaskedList,
    },
    where: { studyId },
  });

  return {
    updatedStudyDesign,
  };
});
