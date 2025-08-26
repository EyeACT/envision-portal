import { StudyMetadataDesignSchema } from "@/server/utils/study_schemas";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataDesignSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Validation failed",
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
    where: { datasetId },
  });

  return {
    updatedStudyDesign,
  };
});
