import { z } from "zod";
import FORM_JSON from "@/assets/data/form.json";

const studyTypeOptions = FORM_JSON.studyMetadataStudyTypeOptions.map(
  (opt) => opt.value,
);
const validYesNo = ["Yes", "No"];
const allocationOptions = FORM_JSON.studyMetadataAllocationOptions.map(
  (opt) => opt.value,
);
const interventionModelOptions =
  FORM_JSON.studyMetadataInterventionModelOptions.map((opt) => opt.value);
const primaryPurposeOptions = FORM_JSON.studyMetadataPrimaryPurposeOptions.map(
  (opt) => opt.value,
);
const maskingOptions = FORM_JSON.studyMetadataMaskingOptions.map(
  (opt) => opt.value,
);
const whoMaskedOptions = FORM_JSON.studyMetadataWhoMaskedOptions.map(
  (opt) => opt.value,
);
const phaseOptions = FORM_JSON.studyMetadataPhaseOptions.map(
  (opt) => opt.value,
);
const enrollmentTypes = FORM_JSON.studyMetadataEnrollmentTypeOptions.map(
  (opt) => opt.value,
);

const oberservationalModelOptions =
  FORM_JSON.studyMetadataObservationalModelsOptions.map((opt) => opt.value);

const timePerspectiveOptions =
  FORM_JSON.studyMetadataTimePerspectiveOptions.map((opt) => opt.value);

const bioRetentionOptions = FORM_JSON.studyMetadataBioSpecRetentionOptions.map(
  (opt) => opt.value,
);

const StudyMetadataAboutSchema = z
  .object({
    allocation: z.string().trim(),
    bioSpecDescription: z.string().trim(),
    bioSpecRetention: z.string().trim(),
    enrollmentCount: z.number(),
    enrollmentType: z.string().trim(),
    interventionModel: z.string().trim(),
    interventionModelDescription: z.string().trim(),
    isPatientRegistry: z.string().trim(),
    masking: z.string().trim(),
    maskingDescription: z.string().trim(),
    numberOfArms: z.number(),
    oberservationalModelList: z.array(z.string().trim()),
    phaseList: z.array(z.string().trim()),
    primaryPurpose: z.string().trim(),
    studyType: z.string().refine((val) => studyTypeOptions.includes(val), {
      message: `Study type must be one of: ${studyTypeOptions.join(", ")}`,
    }),
    targetDuration: z.number(),
    targetDurationUnit: z.string().trim(),
    timePerspectiveList: z.array(z.string().trim()),
    whoMaskedList: z.array(z.string().trim()),
  })
  .strict()
  .superRefine((data, context) => {
    // studyType required
    if (!data.studyType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Study type is required",
        path: ["studyType"],
      });
    }

    // Observational
    if (data.studyType === "Observational") {
      if (!data.isPatientRegistry) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Is patient registry is required",
          path: ["isPatientRegistry"],
        });
      }
      if (!validYesNo.includes(data.isPatientRegistry)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Is patient registry must be one of: ${validYesNo.join(", ")}`,
          path: ["isPatientRegistry"],
        });
      }
      if (data.oberservationalModelList.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Observational model is required",
          path: ["oberservationalModelList"],
        });
      } else {
        data.oberservationalModelList.forEach((model) => {
          if (!oberservationalModelOptions.includes(model)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Observational model must be one of: ${oberservationalModelOptions.join(", ")}`,
              path: ["oberservationalModelList", model],
            });
          }
        });
      }
      if (data.timePerspectiveList.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Time perspective is required",
          path: ["timePerspectiveList"],
        });
      } else {
        data.timePerspectiveList.forEach((perspective) => {
          if (!timePerspectiveOptions.includes(perspective)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Time perspective must be one of: ${timePerspectiveOptions.join(", ")}`,
              path: ["timePerspectiveList", perspective],
            });
          }
        });
      }
      if (!data.bioSpecRetention) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bio specification retention is required",
          path: ["bioSpecRetention"],
        });
      }
      if (!bioRetentionOptions.includes(data.bioSpecRetention)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Bio specification retention must be one of: ${bioRetentionOptions.join(", ")}`,
          path: ["bioSpecRetention"],
        });
      }
      if (!data.bioSpecDescription) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bio specification description is required",
          path: ["bioSpecDescription"],
        });
      }
      if (data.targetDuration <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Target duration must be greater than 0",
          path: ["targetDuration"],
        });
      }
      if (!data.targetDurationUnit) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Target duration unit is required",
          path: ["targetDurationUnit"],
        });
      }
    }

    // Interventional
    if (data.studyType === "Interventional") {
      if (!data.allocation) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Allocation is required",
          path: ["allocation"],
        });
      }
      if (!allocationOptions.includes(data.allocation)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Allocation must be one of: ${allocationOptions.join(", ")}`,
          path: ["allocation"],
        });
      }
      if (!data.interventionModel) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Intervention model is required",
          path: ["interventionModel"],
        });
      }
      if (!interventionModelOptions.includes(data.interventionModel)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Intervention model must be one of: ${interventionModelOptions.join(", ")}`,
          path: ["interventionModel"],
        });
      }
      if (!data.primaryPurpose) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Primary purpose is required",
          path: ["primaryPurpose"],
        });
      }
      if (!primaryPurposeOptions.includes(data.primaryPurpose)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Primary purpose must be one of: ${primaryPurposeOptions.join(", ")}`,
          path: ["primaryPurpose"],
        });
      }
      if (!data.masking) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Masking is required",
          path: ["masking"],
        });
      }
      if (!maskingOptions.includes(data.masking)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Masking must be one of: ${maskingOptions.join(", ")}`,
          path: ["masking"],
        });
      }
      if (data.whoMaskedList.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Who masked is required",
          path: ["whoMaskedList"],
        });
      } else {
        data.whoMaskedList.forEach((whoMasked) => {
          if (!whoMaskedOptions.includes(whoMasked)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Who masked must be one of: ${whoMaskedOptions.join(", ")}`,
              path: ["whoMaskedList", whoMasked],
            });
          }
        });
      }
      if (data.phaseList.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phase is required",
          path: ["phaseList"],
        });
      } else {
        data.phaseList.forEach((phase) => {
          if (!phaseOptions.includes(phase)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Phase must be one of: ${phaseOptions.join(", ")}`,
              path: ["phaseList", phase],
            });
          }
        });
      }
      if (data.numberOfArms <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Number of arms must be greater than 0",
          path: ["numberOfArms"],
        });
      }
    }

    if (data.enrollmentCount <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enrollment count must be greater than 0",
        path: ["enrollmentCount"],
      });
    }
    if (!data.enrollmentType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enrollment type is required",
        path: ["enrollmentType"],
      });
    }
    if (!enrollmentTypes.includes(data.enrollmentType)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Enrollment type must be one of: ${enrollmentTypes.join(", ")}`,
        path: ["enrollmentType"],
      });
    }
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
    where: { studyId },
  });

  return {
    updatedStudyDesign,
  };
});
