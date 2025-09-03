import { z } from "zod";
import FORM_JSON from "@/assets/data/form.json";
import {
  isValidORCIDValue,
  isValidRORValue,
  isValidUrl,
} from "~/utils/validations";

const identTypeOptions =
  FORM_JSON.studyMetadataIdentificationPrimaryIdentifierTypeOptions.map(
    (opt) => opt.value,
  );

const typeOptions = FORM_JSON.studyMetadataArmsTypeOptions.map(
  (opt) => opt.value,
);

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

const sexEnumValues = FORM_JSON.studyMetadataEligibilityGenderOptions.map(
  (opt) => opt.value,
);
const genderEnumValues =
  FORM_JSON.studyMetadataEligibilityGenderBasedOptions.map((opt) => opt.value);
const ageUnitEnumValues = FORM_JSON.studyMetadataEligibilityAgeUnitOptions.map(
  (opt) => opt.value,
);
const validTypes = FORM_JSON.studyMetadataInterventionsTypeOptions.map(
  (opt) => opt.value,
);
const validStatus = FORM_JSON.studyMetadataStatusOptions.map(
  (opt) => opt.value,
);
const validRoles = FORM_JSON.studyMetadataContactsOverallOfficialRole.map(
  (opt) => opt.value,
);
const validHumanStatuses =
  FORM_JSON.studyMetadataHumanSubjectReviewStatusOptions.map(
    (opt) => opt.value,
  );

const validStatuses = FORM_JSON.studyMetadataStatusOptions.map(
  (opt) => opt.value,
);

const dateTypes = FORM_JSON.studyMetadataEnrollmentTypeOptions.map(
  (opt) => opt.value,
);
const conditionalStatuses = ["Suspended", "Terminated", "Withdrawn"];
const partyTypeOptions =
  FORM_JSON.studyMetadataSponsorsResponsiblePartyTypeOptions.map(
    (opt) => opt.value,
  );

export const conditionsSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    classificationCode: z.string().optional(),
    conditionUri: z.union([z.literal(""), z.string().trim().url()]),
    deleted: z.boolean().optional(),
    local: z.boolean().optional(),
    scheme: z.string().optional(),
    schemeUri: z.union([z.literal(""), z.string().trim().url()]),
  })
  .strict();

const keywordsRefine = (data: any, ctx: z.RefinementCtx) => {
  if (
    (data.classificationCode && !data.scheme) ||
    (!data.classificationCode && data.scheme)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Both classificationCode and scheme are required if either is provided",
    });
  }

  if (
    data.classificationCode &&
    data.scheme?.toUpperCase() === "ORCID" &&
    !isValidORCIDValue(data.classificationCode)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "ORCID identifier must be a valid ORCID format",
    });
  }

  if (
    data.classificationCode &&
    data.scheme?.toUpperCase() === "ROR" &&
    !isValidRORValue(data.classificationCode)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "ROR identifier must be a valid ROR format",
    });
  }
};

export const keywordsSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    classificationCode: z.string().optional(),
    deleted: z.boolean().optional(),
    keywordUri: z.union([z.literal(""), z.string().trim().url()]),
    local: z.boolean().optional(),
    scheme: z.string().optional(),
    schemeUri: z.union([z.literal(""), z.string().trim().url()]),
  })
  .strict();

export const secondaryIdentifierSchema = z
  .object({
    id: z.string().optional(),
    deleted: z.boolean().optional(),
    domain: z.union([z.literal(""), z.string().trim().url()]),
    identifier: z.string(),
    link: z.union([z.literal(""), z.string().trim().url()]),
    local: z.boolean().optional(),
    type: z.string().refine((v) => identTypeOptions.includes(v), {
      message: `Identifier type must be one of: ${identTypeOptions.join(", ")}`,
    }),
  })
  .strict();

export const StudyMetadataAboutSchema = z
  .object({
    briefSummary: z.string().min(1, "Brief summary is required"),
    conditions: z
      .array(conditionsSchema)
      .min(1, "At least one condition is required"),
    detailedDescription: z.string().optional(),
    keywords: z.array(keywordsSchema.superRefine(keywordsRefine)).optional(),
    primaryIdentifier: z.object({
      domain: z.union([z.literal(""), z.string().trim().url()]),
      identifier: z.string(),
      link: z.union([z.literal(""), z.string().trim().url()]),
      type: z.string().refine((v) => identTypeOptions.includes(v), {
        message: `Identifier type must be one of: ${identTypeOptions.join(", ")}`,
      }),
    }),
    secondaryIdentifiers: z
      .array(secondaryIdentifierSchema)
      .min(1, "At least one secondary identifier is required"),
  })
  .strict();

export const studyArmSchema = z
  .object({
    id: z.string().trim().optional(),
    deleted: z.boolean().optional(),
    description: z
      .string()
      .trim()
      .min(1, { message: "Description is required" }),
    interventionList: z.array(z.string()),
    label: z.string().trim().min(1, { message: "Label is required" }),
    local: z.boolean().optional(),
    type: z.preprocess(
      (val) => {
        // if incoming value is a string that’s just empty/whitespace, treat it as undefined
        if (typeof val === "string" && val.trim() === "") {
          return undefined;
        }

        return val;
      },
      z
        .string()
        .trim()
        .refine((val) => typeOptions.includes(val), {
          message: `Type must be one of: ${typeOptions.join(", ")}`,
        })
        .optional(),
    ),
  })
  .strict();

export const StudyMetadataArmsSchema = z
  .object({
    studyArms: z
      .array(studyArmSchema)
      .min(1, { message: "At least one study arm is required" }),
  })
  .strict();

const contractRefine = (data: any, context: z.RefinementCtx) => {
  const id = data.identifier.trim();
  const sch = data.identifierScheme.trim();
  const idScheme = data.identifierScheme.toUpperCase();
  const affiliationId = data.affiliationIdentifier.trim();
  const affilIdScheme = data.affiliationIdentifierScheme.toUpperCase();

  if ((id === "" && sch !== "") || (id !== "" && sch === "")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Identifier and Identifier scheme must be provided together",
      path: ["identifier"],
    });
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Identifier and Identifier scheme must be provided together",
      path: ["identifierScheme"],
    });
  }

  if (id && idScheme === "ORCID" && !isValidORCIDValue(id)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Identifier must be a valid ORCID value",
      path: ["identifier"],
    });
  }
  if (id && idScheme === "ROR" && !isValidRORValue(id)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Identifier must be a valid ROR value",
      path: ["identifier"],
    });
  }

  if (
    affiliationId &&
    affilIdScheme === "ORCID" &&
    !isValidORCIDValue(affiliationId)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Affiliation identifier must be a valid ORCID value",
      path: ["affiliationIdentifier"],
    });
  }
  if (
    affiliationId &&
    affilIdScheme === "ROR" &&
    !isValidRORValue(affiliationId)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Affiliation identifier must be a valid ROR value",
      path: ["affiliationIdentifier"],
    });
  }
};

export const contractSchema = z
  .object({
    id: z.string().optional(),
    affiliation: z
      .string()
      .trim()
      .min(1, { message: "Affiliation is required" }),
    affiliationIdentifier: z.string(),
    affiliationIdentifierScheme: z.string(),
    affiliationIdentifierSchemeUri: z.union([
      z.literal(""),
      z.string().trim().url(),
    ]),
    degree: z.string(),
    deleted: z.boolean().optional(),
    emailAddress: z
      .string()
      .trim()
      .min(1, { message: "Email address is required" })
      .email({ message: "Email address is not valid" }),
    familyName: z
      .string()
      .trim()
      .min(1, { message: "Family name is required" }),
    givenName: z.string().trim().min(1, { message: "Given name is required" }),
    identifier: z.string(),
    identifierScheme: z.string(),
    identifierSchemeUri: z.union([z.literal(""), z.string().trim().url()]),
    local: z.boolean().optional(),
    phone: z.string(),
    phoneExt: z.string(),
  })
  .strict();

export const StudyMetadataContactsSchema = z
  .object({
    studyContacts: z.array(contractSchema.superRefine(contractRefine)).min(1, {
      message: "At least one study central contact is required",
    }),
  })
  .strict();

export const designRefine = (data: any, context: z.RefinementCtx) => {
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
      data.oberservationalModelList.forEach((model: any) => {
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
      data.timePerspectiveList.forEach((perspective: any) => {
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
      data.whoMaskedList.forEach((whoMasked: any) => {
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
      data.phaseList.forEach((phase: any) => {
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
};

export const DesignBase = z.object({
  id: z.string().optional(),
  allocation: z.string().trim(),
  bioSpecDescription: z.string().trim(),
  bioSpecRetention: z.string().trim(),
  created: z.coerce.date().optional(),
  datasetId: z.string().cuid2().optional(),
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
  studyType: z.string().refine((v) => studyTypeOptions.includes(v), {
    message: `Study type must be one of: ${studyTypeOptions.join(", ")}`,
  }),
  targetDuration: z.number(),
  targetDurationUnit: z.string().trim(),
  timePerspectiveList: z.array(z.string().trim()),
  updated: z.coerce.date().optional(),
  whoMaskedList: z.array(z.string().trim()),
});

export const StudyMetadataDesignSchema =
  DesignBase.strict().superRefine(designRefine);

export const StudyMetadataEligibilitySchema = z
  .object({
    exclusionCriteria: z
      .array(z.string().trim().min(1, { message: "Field cannot be empty" }))
      .min(1, { message: "At least one exclusion criteria is required" }),
    genderBased: z
      .string()
      .trim()
      .min(1, { message: "Gender based is required" })
      .refine((v) => genderEnumValues.includes(v), {
        message: `Gender based must be one of: ${genderEnumValues.join(", ")}`,
      }),
    genderDescription: z.string(),
    healthyVolunteers: z
      .string()
      .trim()
      .min(1, { message: "Healthy volunteers is required" })
      .refine((v) => validYesNo.includes(v), {
        message: `Healthy volunteers must be one of: ${validYesNo.join(", ")}`,
      }),
    inclusionCriteria: z
      .array(z.string().trim().min(1, { message: "Field cannot be empty" }))
      .min(1, { message: "At least one inclusion criteria is required" }),
    maximumAgeUnit: z
      .string()
      .trim()
      .min(1, { message: "Maximum age unit is required" })
      .refine((v) => ageUnitEnumValues.includes(v), {
        message: `Maximum age unit must be one of: ${ageUnitEnumValues.join(
          ", ",
        )}`,
      }),
    maximumAgeValue: z
      .number()
      .gt(0, { message: "Maximum age value must be greater than 0" }),
    minimumAgeUnit: z
      .string()
      .trim()
      .min(1, { message: "Minimum age unit is required" })
      .refine((v) => ageUnitEnumValues.includes(v), {
        message: `Minimum age unit must be one of: ${ageUnitEnumValues.join(
          ", ",
        )}`,
      }),
    minimumAgeValue: z
      .number()
      .gt(0, { message: "Minimum age value must be greater than 0" }),
    samplingMethod: z.string(),
    sex: z
      .string()
      .trim()
      .min(1, { message: "Sex is required" })
      .refine((v) => sexEnumValues.includes(v), {
        message: `Sex must be one of: ${sexEnumValues.join(", ")}`,
      }),
    studyPopulation: z.string(),
  })
  .strict();

export const StudyMetadataInterventionsSchema = z
  .object({
    studyInterventions: z
      .array(
        z
          .object({
            id: z.string().optional(),
            name: z.string().trim().min(1, { message: "Name is required" }),
            created: z.coerce.date().optional(),
            datasetId: z.string().cuid2().optional(),
            deleted: z.boolean().optional(),
            description: z
              .string()
              .trim()
              .min(1, { message: "Description is required" }),
            local: z.boolean().optional(),
            otherNameList: z.array(z.string()),
            type: z
              .string({
                invalid_type_error: "Type is required",
                required_error: "Type is required",
              })
              .refine((v) => validTypes.includes(v), {
                message: "Type must be a valid option",
              }),
            updated: z.coerce.date().optional(),
          })
          .strict(),
        {
          invalid_type_error: "`studyInterventions` must be an array",
          required_error: "`studyInterventions` array is required",
        },
      )
      .min(1, { message: "At least one study intervention is required" }),
  })
  .strict();

const locationRefine = (data: any, context: z.RefinementCtx) => {
  const hasId = data.identifier !== "";
  const hasScheme = data.identifierScheme !== "";
  const scheme = data.identifierScheme.toUpperCase();

  if ((hasId && !hasScheme) || (!hasId && hasScheme)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Identifier and Identifier Scheme must be provided together",
      path: ["identifier"],
    });
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Identifier and Identifier Scheme must be provided together",
      path: ["identifierScheme"],
    });
  }

  if (hasId && scheme === "ORCID" && !isValidORCIDValue(data.identifier)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid ORCID identifier",
      path: ["identifier"],
    });
  }
  if (hasId && scheme === "ROR" && !isValidRORValue(data.identifier)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid ROR identifier",
      path: ["identifier"],
    });
  }
};

export const LocationSchema = z
  .object({
    id: z.string().optional(),
    city: z.string().trim().min(1, { message: "City is required" }),
    country: z.string().trim().min(1, { message: "Country is required" }),
    created: z.coerce.date().optional(),
    datasetId: z.string().cuid2().optional(),
    deleted: z.boolean().optional(),
    facility: z.string().trim().min(1, { message: "Facility is required" }),
    identifier: z.string().trim(),
    identifierScheme: z.string().trim(),
    identifierSchemeUri: z.union([z.literal(""), z.string().trim().url()]),
    local: z.boolean().optional(),
    state: z.string().trim().min(1, { message: "State is required" }),
    status: z
      .string({
        invalid_type_error: "Status is required",
        required_error: "Status is required",
      })
      .trim()
      .refine((v) => validStatus.includes(v), {
        message: "Status must be a valid option",
      }),
    updated: z.coerce.date().optional(),
    zip: z.string().trim(),
  })
  .strict();

export const StudyMetadataLocationsSchema = z.object({
  studyLocations: z
    .array(LocationSchema.superRefine(locationRefine), {
      invalid_type_error: "`studyLocations` must be an array",
      required_error: "`studyLocations` array is required",
    })
    .min(1, { message: "At least one study location is required" }),
});

const officialSchemaRefine = (data: any, context: z.RefinementCtx) => {
  // affiliationIdentifier and affiliationIdentifierScheme if provided must be together
  const hasAffId = data.affiliationIdentifier !== "";
  const hasAffSch = data.affiliationIdentifierScheme !== "";
  const hasId = data.identifier !== "";
  const hasIdSch = data.identifierScheme !== "";
  const idScheme = data.identifierScheme.toUpperCase();
  const affilIdScheme = data.affiliationIdentifierScheme.toUpperCase();

  if ((hasAffId && !hasAffSch) || (!hasAffId && hasAffSch)) {
    [
      "affiliationIdentifier",
      "affiliationIdentifierScheme",
      "affiliationIdentifierSchemeUri",
    ].forEach((path) =>
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Affiliation identifier and affiliation identifier scheme must be provided together",
        path: [path],
      }),
    );
  }

  if (
    hasAffId &&
    affilIdScheme === "ORCID" &&
    !isValidORCIDValue(data.affiliationIdentifier)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Affiliation identifier must be a valid ORCID",
      path: ["affiliationIdentifier"],
    });
  }
  if (
    hasAffId &&
    affilIdScheme === "ROR" &&
    !isValidRORValue(data.affiliationIdentifier)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Affiliation identifier must be a valid ROR",
      path: ["affiliationIdentifier"],
    });
  }

  // identifier and identifierScheme if provided must be together
  if ((hasId && !hasIdSch) || (!hasId && hasIdSch)) {
    ["identifier", "identifierScheme"].forEach((path) =>
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Identifier and Identifier scheme must be provided together",
        path: [path],
      }),
    );
  }

  if (hasId && idScheme === "ORCID" && !isValidORCIDValue(data.identifier)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Identifier must be a valid ORCID",
      path: ["identifier"],
    });
  }
  if (hasId && idScheme === "ROR" && !isValidRORValue(data.identifier)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Identifier must be a valid ROR",
      path: ["identifier"],
    });
  }
};

export const officialSchema = z
  .object({
    id: z.string().optional(),
    affiliation: z
      .string()
      .trim()
      .min(1, { message: "Affiliation is required" }),
    affiliationIdentifier: z.string().trim(),
    affiliationIdentifierScheme: z.string().trim(),
    affiliationIdentifierSchemeUri: z.union([
      z.literal(""),
      z.string().trim().url(),
    ]),
    created: z.coerce.date().optional(),
    datasetId: z.string().cuid2().optional(),
    degree: z.string().trim(),
    deleted: z.boolean().optional(),
    familyName: z
      .string()
      .trim()
      .min(1, { message: "Family name is required" }),
    givenName: z.string().trim().min(1, { message: "Given name is required" }),
    identifier: z.string().trim(),
    identifierScheme: z.string().trim(),
    identifierSchemeUri: z.union([z.literal(""), z.string().trim().url()]),
    local: z.boolean().optional(),
    role: z
      .string({
        invalid_type_error: "Role is required",
        required_error: "Role is required",
      })
      .trim()
      .refine((v) => validRoles.includes(v), {
        message: `Role must be one of the following: ${validRoles.join(", ")}`,
      }),
    updated: z.coerce.date().optional(),
  })
  .strict();

export const StudyMetadataOverallOfficialsSchema = z.object({
  studyOverallOfficials: z
    .array(officialSchema.superRefine(officialSchemaRefine))
    .min(1, {
      message: "At least one study overall official is required",
    }),
});

export const StudyMetadataOversightSchema = z
  .object({
    humanSubjectReviewStatus: z
      .string({
        invalid_type_error: "Human Subject Review Status is required.",
        required_error: "Human Subject Review Status is required.",
      })
      .trim()
      .refine((v) => validHumanStatuses.includes(v), {
        message: `Invalid Human Subject Review Status. Must be one of: ${validHumanStatuses.join(", ")}`,
      }),

    isFDARegulatedDevice: z.preprocess(
      (val) => {
        // if incoming value is a string that’s just empty/whitespace, treat it as undefined
        if (typeof val === "string" && val.trim() === "") {
          return undefined;
        }

        return val;
      },
      z
        .string({
          invalid_type_error: "FDA Regulated Device selection is required.",
          required_error: "FDA Regulated Device selection is required.",
        })
        .trim()
        .refine((v) => validYesNo.includes(v as (typeof validYesNo)[number]), {
          message: `Invalid option for FDA Regulated Device. Must be one of: ${validYesNo.join(", ")}`,
        })
        .optional(),
    ),

    isFDARegulatedDrug: z.preprocess(
      (val) => {
        // if incoming value is a string that’s just empty/whitespace, treat it as undefined
        if (typeof val === "string" && val.trim() === "") {
          return undefined;
        }

        return val;
      },
      z
        .string({
          invalid_type_error: "FDA Regulated Drug selection is required.",
          required_error: "FDA Regulated Drug selection is required.",
        })
        .trim()
        .refine((v) => validYesNo.includes(v), {
          message: `Invalid option for FDA Regulated Drug. Must be one of: ${validYesNo.join(", ")}`,
        })
        .optional(),
    ),

    oversightHasDMC: z.preprocess(
      (val) => {
        // if incoming value is a string that’s just empty/whitespace, treat it as undefined
        if (typeof val === "string" && val.trim() === "") {
          return undefined;
        }

        return val;
      },
      z
        .string({
          invalid_type_error: "Has DMC selection is required.",
          required_error: `Has DMC selection is required. Must be one of: ${validYesNo.join(", ")}`,
        })
        .trim()
        .refine((v) => validYesNo.includes(v), {
          message: `Invalid option for Has DMC. Must be one of: ${validYesNo.join(", ")}`,
        })
        .optional(),
    ),
  })
  .strict();

export const StatusSchemaRefine = (data: any, context: z.RefinementCtx) => {
  if (conditionalStatuses.includes(data.overallStatus) && !data.whyStopped) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "A valid reason is required when the study is suspended, terminated or withdrawn",
      path: ["whyStopped"],
    });
  }
};

export const StatusBase = z.object({
  completionDate: z.coerce.date(),
  completionDateType: z
    .string()
    .trim()
    .refine((v) => dateTypes.includes(v), {
      message: `Completion date type must be one of: ${dateTypes.join(", ")}`,
    }),
  overallStatus: z
    .string()
    .trim()
    .refine((v) => validStatuses.includes(v), {
      message: `Overall status must be one of: ${validStatuses.join(", ")}`,
    }),
  startDate: z.coerce.date(),
  startDateType: z
    .string()
    .trim()
    .refine((v) => dateTypes.includes(v), {
      message: `Start date type must be one of: ${dateTypes.join(", ")}`,
    }),
  whyStopped: z.string().trim().optional(),
});

export const StudyMetadataStatusSchema =
  StatusBase.strict().superRefine(StatusSchemaRefine);

const collaboratorSchemaRefine = (data: any, ctx: z.RefinementCtx) => {
  if (!data.deleted) {
    if (!data.name || data.name.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name is required for active collaborators",
        path: ["collaborators", "name"],
      });
    }

    if (
      (data.identifier && !data.scheme) ||
      (!data.identifier && data.scheme)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "If scheme is provided, schemeUri must also be provided",
        path: ["collaborators", "schemeUri"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "If schemeUri is provided, scheme must also be provided",
        path: ["collaborators", "scheme"],
      });
    }

    if (
      data.identifier &&
      data.scheme.toUpperCase() === "ORCID" &&
      !isValidORCIDValue(data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid ORCID identifier",
        path: ["collaborators", "identifier"],
      });
    }

    if (
      data.identifier &&
      data.scheme.toUpperCase() === "ROR" &&
      !isValidRORValue(data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid ROR identifier",
        path: ["collaborators", "identifier"],
      });
    }

    if (data.schemeUri && !isValidUrl(data.schemeUri)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Scheme URI must be a valid URL",
        path: ["collaborators", "schemeUri"],
      });
    }

    // If scheme is provided, schemeUri must also be provided
    if (
      (data.scheme && !data.identifier) ||
      (!data.scheme && data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "If scheme is provided, schemeUri must also be provided",
        path: ["collaborators", "schemeUri"],
      });
    }
  }
};

export const CollaboratorSchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    deleted: z.boolean().optional(),
    identifier: z.string().optional(),
    scheme: z.string().optional(),
    schemeUri: z.union([z.literal(""), z.string().trim().url()]),
  })
  .strict();

export const SponsorRefine = (data: any, ctx: z.RefinementCtx) => {
  const leadSponsID = data.leadSponsorIdentifier?.trim();
  const leadSponsScheme = data.leadSponsorIdentifierScheme
    ?.trim()
    .toUpperCase();
  const respPartyInvestigatorAffilID =
    data.responsiblePartyInvestigatorAffiliationIdentifier?.trim();
  const respPartyInvestigatorAffilScheme =
    data.responsiblePartyInvestigatorAffiliationIdentifierScheme
      ?.trim()
      .toUpperCase();

  const respPartyInvestigatorID =
    data.responsiblePartyInvestigatorIdentifierValue?.trim();
  const respPartyInvestigatorScheme =
    data.responsiblePartyInvestigatorIdentifierScheme?.trim().toUpperCase();

  if (
    ["Sponsor-Investigator", "Principal Investigator"].includes(
      data.responsiblePartyType,
    )
  ) {
    // first, last name, title and affiliation required
    if (!data.responsiblePartyInvestigatorFamilyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Responsible party investigator family name is required",
        path: ["responsiblePartyInvestigatorFamilyName"],
      });
    }

    if (!data.responsiblePartyInvestigatorGivenName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Responsible party investigator given name is required",
        path: ["responsiblePartyInvestigatorGivenName"],
      });
    }

    if (!data.responsiblePartyInvestigatorTitle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Responsible party investigator title is required",
        path: ["responsiblePartyInvestigatorTitle"],
      });
    }

    if (!data.responsiblePartyInvestigatorAffiliationIdentifier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Responsible party investigator affiliation identifier is required",
        path: ["responsiblePartyInvestigatorAffiliationIdentifier"],
      });
    }
  }

  // If identifierscheme is provided, identifierSchemeUri must also be provided
  if (
    (data.leadSponsorIdentifier && !data.leadSponsorIdentifierScheme) ||
    (!data.leadSponsorIdentifier && data.leadSponsorIdentifierScheme)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "If lead sponsor identifier scheme is provided, identifier scheme URI must also be provided",
    });
  }

  if (
    (data.responsiblePartyInvestigatorAffiliationIdentifier &&
      !data.responsiblePartyInvestigatorAffiliationIdentifierScheme) ||
    (!data.responsiblePartyInvestigatorAffiliationIdentifier &&
      data.responsiblePartyInvestigatorAffiliationIdentifierScheme)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "If responsible party investigator affiliation identifier scheme is provided, identifier scheme URI must also be provided",
    });
  }

  if (
    leadSponsID &&
    leadSponsScheme === "ORCID" &&
    !isValidORCIDValue(leadSponsID)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Lead sponsor identifier must be a valid ORCID value",
    });
  }
  if (
    leadSponsID &&
    leadSponsScheme === "ROR" &&
    !isValidRORValue(leadSponsID)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Lead sponsor identifier must be a valid ROR value",
    });
  }

  if (
    respPartyInvestigatorAffilID &&
    respPartyInvestigatorAffilScheme === "ORCID" &&
    !isValidORCIDValue(respPartyInvestigatorAffilID)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Responsible party investigator affiliation identifier must be a valid ORCID value",
    });
  }
  if (
    respPartyInvestigatorAffilID &&
    respPartyInvestigatorAffilScheme === "ROR" &&
    !isValidRORValue(respPartyInvestigatorAffilID)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Responsible party investigator affiliation identifier must be a valid ROR value",
    });
  }

  if (
    respPartyInvestigatorID &&
    respPartyInvestigatorScheme === "ORCID" &&
    !isValidORCIDValue(respPartyInvestigatorID)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Responsible party investigator identifier value must be a valid ORCID value",
    });
  }
  if (
    respPartyInvestigatorID &&
    respPartyInvestigatorScheme === "ROR" &&
    !isValidRORValue(respPartyInvestigatorID)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Responsible party investigator identifier value must be a valid ROR value",
    });
  }
};

export const SponsorsBase = z.object({
  collaborators: z
    .array(CollaboratorSchema.superRefine(collaboratorSchemaRefine))
    .optional(),
  leadSponsorIdentifier: z.string().trim().optional(),
  leadSponsorIdentifierScheme: z.string().trim().optional(),
  leadSponsorIdentifierSchemeUri: z.union([
    z.literal(""),
    z.string().trim().url(),
  ]),
  leadSponsorName: z.string().trim().min(1, "Lead sponsor name is required"),
  responsiblePartyInvestigatorAffiliationIdentifier: z
    .string()
    .trim()
    .optional(),
  responsiblePartyInvestigatorAffiliationIdentifierScheme: z
    .string()
    .trim()
    .optional(),
  responsiblePartyInvestigatorAffiliationIdentifierSchemeUri: z.union([
    z.literal(""),
    z.string().trim().url(),
  ]),
  responsiblePartyInvestigatorAffiliationName: z.string().trim().optional(),
  responsiblePartyInvestigatorFamilyName: z.string().trim().optional(),
  responsiblePartyInvestigatorGivenName: z.string().trim().optional(),
  responsiblePartyInvestigatorIdentifierScheme: z.string().trim().optional(),
  responsiblePartyInvestigatorIdentifierValue: z.string().trim().optional(),
  responsiblePartyInvestigatorTitle: z.string().trim().optional(),
  responsiblePartyType: z
    .string()
    .trim()
    .refine(
      (v) => partyTypeOptions.includes(v as (typeof partyTypeOptions)[number]),
      {
        message: `Responsible party type must be one of: ${partyTypeOptions.join(", ")}`,
      },
    ),
});

export const StudyMetadataSponsorsSchema =
  SponsorsBase.strict().superRefine(SponsorRefine);

export const StudyDescriptionOnlySchema = z
  .object({
    briefSummary: z.string().min(1, "Brief summary is required"),
    detailedDescription: z.string().optional(),
  })
  .strict();

export const IdentificationRowSchema = z
  .object({
    id: z.string().optional(),
    created: z.coerce.date().optional(),
    datasetId: z.string().cuid2().optional(),
    identifier: z.string().min(1, "Identifier is required"),
    identifierDomain: z.union([z.literal(""), z.string().url()]),
    identifierLink: z.union([z.literal(""), z.string().url()]),
    identifierType: z.string().refine((v) => identTypeOptions.includes(v), {
      message: `Identifier type must be one of: ${identTypeOptions.join(", ")}`,
    }),
    isSecondary: z.boolean(),
    updated: z.coerce.date().optional(),
  })
  .strict();

export const InterventionRowSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, { message: "Name is required" }),
    created: z.coerce.date().optional(),
    datasetId: z.string().cuid2().optional(),
    deleted: z.boolean().optional(),
    description: z
      .string()
      .trim()
      .min(1, { message: "Description is required" }),
    local: z.boolean().optional(),
    otherNameList: z.array(z.string()),
    type: z.string().refine((v) => validTypes.includes(v), {
      message: "Type must be a valid option",
    }),
    updated: z.coerce.date().optional(),
  })
  .strict();

export const PrimaryIdentifierSchema = z.object({
  domain: z.union([z.literal(""), z.string().trim().url()]),
  identifier: z.string(),
  link: z.union([z.literal(""), z.string().trim().url()]),
  type: z.string().refine((v) => identTypeOptions.includes(v), {
    message: `Identifier type must be one of: ${identTypeOptions.join(", ")}`,
  }),
});

export const StudyMetadataPublishValidation = z.object({
  id: z.string().cuid2("Invalid dataset ID"),
  title: z.string().min(1, "Dataset title is required"),
  canonicalId: z.string().cuid2("Invalid canonical ID"),
  changelog: z.union([
    z.string().min(1, "Changelog is required"),
    z.literal(""),
  ]),
  description: z.string(),
  doi: z.string().nullable(),
  imageUrl: z.string().url("Image URL must be a valid URL"),
  primaryIdentifier: PrimaryIdentifierSchema.passthrough().optional(),
  publishedId: z.string().nullable().optional(),
  readme: z.union([z.string().min(1, "README is required"), z.literal("")]),
  secondaryIdentifiers: z.array(secondaryIdentifierSchema).optional(),
  status: z.enum(["draft", "published"]),
  StudyArm: z
    .array(studyArmSchema.strip())
    .min(1, { message: "At least one study arm is required" }),
  StudyCentralContact: z
    .array(contractSchema.strip())
    .min(1, { message: "At least one study central contact is required" }),
  StudyCollaborators: z
    .array(CollaboratorSchema.strip().superRefine(collaboratorSchemaRefine))
    .optional(),
  StudyConditions: z.array(conditionsSchema.strip()).min(1),

  StudyDescription: StudyDescriptionOnlySchema.strip(),
  StudyDesign: DesignBase.strip().superRefine(designRefine),
  StudyEligibility: StudyMetadataEligibilitySchema.strip(),
  StudyIdentification: z.array(IdentificationRowSchema).min(1).optional(),
  StudyIntervention: z
    .array(InterventionRowSchema)
    .min(1, { message: "At least one study intervention is required" }),
  StudyKeywords: z.array(keywordsSchema.strip()).optional(),
  StudyLocation: z
    .array(LocationSchema)
    .min(1, { message: "At least one study location is required" }),
  StudyOverallOfficials: z
    .array(officialSchema)
    .min(1, { message: "At least one study overall official is required" }),
  StudyOversight: z
    .object({})
    .passthrough()
    .transform((o: any) => ({
      humanSubjectReviewStatus: o.humanSubjectReviewStatus,
      isFDARegulatedDevice: o.isFDARegulatedDevice ?? o.fdaRegulatedDevice,
      isFDARegulatedDrug: o.isFDARegulatedDrug ?? o.fdaRegulatedDrug,
      oversightHasDMC: o.oversightHasDMC ?? o.hasDmc,
    }))
    .pipe(StudyMetadataOversightSchema),
  StudySponsors: SponsorsBase.omit({ collaborators: true })
    .strip()
    .superRefine(SponsorRefine),
  StudyStatus: StatusBase.strip().superRefine(StatusSchemaRefine),
  type: z.string().min(1, "Type is required"),
});
