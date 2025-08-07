import { z } from "zod";
import FORM_JSON from "@/assets/data/form.json";
import { isValidORCIDValue, isValidRORValue } from "~/utils/validations";

const accessTypeOptions = FORM_JSON.datasetAccessTypeOptions.map(
  (opt) => opt.value,
);

const deIdentTypeOptions = FORM_JSON.datasetDeIdentTypeOptions.map(
  (opt) => opt.value,
);

const consentTypeOptions = FORM_JSON.datasetConsentTypeOptions.map(
  (opt) => opt.value,
);

const titleTypeOptions = FORM_JSON.datasetTitleTypeOptions.map(
  (opt) => opt.value,
);
const descripTypeOptions = FORM_JSON.datasetDescriptionTypeOptions.map(
  (opt) => opt.value,
);

const dateTypeOptions = FORM_JSON.datasetDateTypeOptions.map(
  (opt) => opt.value,
);

const identTypeOptions = FORM_JSON.datasetIdentifierTypeOptions.map(
  (opt) => opt.value,
);

const resourceTypeOptions =
  FORM_JSON.datasetRelatedIdentifierResourceTypeOptions.map((opt) => opt.value);

const nameTypeOptions = FORM_JSON.datasetNameTypeOptions.map(
  (opt) => opt.value,
);

const contribTypeOptions = FORM_JSON.datasetContributorTypeOptions.map(
  (opt) => opt.value,
);

const funderIdentTypeOptions = FORM_JSON.datasetFunderIdentifierTypeOptions.map(
  (opt) => opt.value,
);

const validateNameIdentifier = (data: any, ctx: z.RefinementCtx) => {
  if (
    (data.nameIdentifier && !data.nameIdentifierScheme) ||
    (!data.nameIdentifier && data.nameIdentifierScheme)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Both nameIdentifierScheme and nameIdentifier must be provided together",
    });
  }

  if (
    data.nameIdentifier &&
    data.nameIdentifierScheme === "ORCID" &&
    !isValidORCIDValue(data.nameIdentifier)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Name identifier must be a valid ORCID value",
      path: ["nameIdentifier"],
    });
  }
  if (
    data.nameIdentifier &&
    data.nameIdentifierScheme === "ROR" &&
    !isValidRORValue(data.nameIdentifier)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Name identifier must be a valid ROR value",
      path: ["nameIdentifier"],
    });
  }
};

export const DatasetMetadataAboutSchema = z.object({
  acknowledgement: z.string(),
  format: z.array(z.string()),
  labelingMethod: z.string(),
  language: z.string().min(2, "Language code is required"),
  resourceType: z.string().min(1, "Resource type is required"),
  resourceTypeName: z.string().min(1, "Resource type name is required"),
  size: z.array(z.string().min(1)).min(1, "At least one size is required"),
  standardsFollowed: z.string(),
  validationInfo: z.string(),
});

const accessSchema = z
  .object({
    description: z.string().trim().min(1, "Description is required"),
    type: z
      .string()
      .trim()
      .refine((v) => accessTypeOptions.includes(v), {
        message: `Access type must be one of: ${accessTypeOptions.join(", ")}`,
      }),
    url: z.string().trim().optional(),
    urlLastChecked: z.string().trim().optional(),
  })
  .strict();

const rightsSchema = z
  .object({
    identifier: z.string().trim().optional(),
    identifierScheme: z.string().trim().optional(),
    identifierSchemeUri: z.string().trim().optional(),
    licenseText: z.string().trim().optional(),
    rights: z.string().trim().min(1, "rights is required"),
    uri: z.string().trim().optional(),
  })
  .strict();

export const DatasetMetadataAccessRightsSchema = z
  .object({
    access: accessSchema,
    rights: rightsSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.rights.identifier && !data.rights.identifierScheme) ||
      (!data.rights.identifier && data.rights.identifierScheme)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Both identifier and identifierScheme must be provided together",
      });
    }
  });

const deIdentSchema = z
  .object({
    dates: z.boolean(),
    details: z.string().optional(),
    direct: z.boolean(),
    hipaa: z.boolean(),
    kAnon: z.boolean(),
    nonarr: z.boolean(),
    type: z.string().refine((v) => deIdentTypeOptions.includes(v), {
      message: `De-identification type must be one of: ${deIdentTypeOptions.join(", ")}`,
    }),
  })
  .strict();

const consentSchema = z
  .object({
    details: z.string().optional(),
    geneticOnly: z.boolean(),
    geogRestrict: z.boolean(),
    noMethods: z.boolean(),
    noncommercial: z.boolean(),
    researchType: z.boolean(),
    type: z.string().refine((v) => consentTypeOptions.includes(v), {
      message: `Consent type must be one of: ${consentTypeOptions.join(", ")}`,
    }),
  })
  .strict();

const subjectSchema = z
  .object({
    id: z.string().optional(),
    classificationCode: z.string().optional(),
    deleted: z.boolean().optional(),
    local: z.boolean().optional(),
    scheme: z.string().optional(),
    schemeUri: z.string().optional(),
    subject: z.string().min(1, "Subject is required"),
    valueUri: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.classificationCode && !data.scheme) ||
      (!data.classificationCode && data.scheme)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both classificationCode and scheme must be provided together",
      });
    }
  });

export const DatasetMetadataDataManagementSchema = z
  .object({
    consent: consentSchema,
    deidentLevel: deIdentSchema,
    subjects: z.array(subjectSchema).min(1, "At least one subject is required"),
  })
  .strict();

const aboutSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  deleted: z.boolean().optional(),
  information: z.string().optional(),
  type: z.string().refine((v) => dateTypeOptions.includes(v), {
    message: `Date type must be one of: ${dateTypeOptions.join(", ")}`,
  }),
});

const descriptionSchema = z.object({
  id: z.string().optional(),
  deleted: z.boolean().optional(),
  description: z.string(),
  type: z.string().refine((v) => descripTypeOptions.includes(v), {
    message: `Description type must be one of: ${descripTypeOptions.join(", ")}`,
  }),
});

const titleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  deleted: z.boolean().optional(),
  type: z
    .string()
    .optional()
    .refine(
      (v) => titleTypeOptions.includes(v as (typeof titleTypeOptions)[number]),
      {
        message: `Title type must be one of: ${titleTypeOptions.join(", ")}`,
      },
    ),
});

export const DatasetMetadataGeneralInformationSchema = z.object({
  DatasetDate: z.array(aboutSchema).min(1, "At least one date is required"),
  DatasetDescription: z
    .array(descriptionSchema)
    .min(1, "At least Abstract description is required"),
  DatasetTitle: z.array(titleSchema).min(1, "At least Main title is required"),
});

const altIdentifierSchema = z
  .object({
    id: z.string().optional(),
    deleted: z.boolean().optional(),
    identifier: z.string().min(1, "Identifier is required"),
    local: z.boolean().optional(),
    type: z.string().refine((v) => identTypeOptions.includes(v), {
      message: `Identifier type must be one of: ${identTypeOptions.join(", ")}`,
    }),
  })
  .strict();

export const DatasetMetadataIdentifiersSchema = z
  .object({
    DatasetAlternateIdentifier: z
      .array(altIdentifierSchema)
      .min(1, "At least one alternate identifier is required"),
  })
  .strict();

const relatedIdentSchema = z
  .object({
    id: z.string().optional(),
    deleted: z.boolean().optional(),
    identifier: z.string().min(1, "Identifier is required"),
    identifierType: z.string().min(1, "Identifier type is required"),
    local: z.boolean().optional(),
    relatedMetadataScheme: z.string().optional(),
    relationType: z.string().min(1, "Relation type is required"),
    resourceType: z.string().refine((v) => resourceTypeOptions.includes(v), {
      message: `Resource type must be one of: ${resourceTypeOptions.join(", ")}`,
      path: ["resourceType"],
    }),
    schemeType: z.string().optional(),
    schemeUri: z.union([z.literal(""), z.string().trim().url()]),
  })
  .strict()
  .superRefine((data, context) => {
    if (
      (data.relationType === "IsMetadataFor" ||
        data.relationType === "HasMetadata") &&
      !data.relatedMetadataScheme
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "relatedMetadataScheme is required when relationType is IsMetadataFor or HasMetadata",
        path: ["relatedMetadataScheme"],
      });
    }
  });

export const DatasetMetadataRelatedIdentifiersSchema = z
  .object({
    relatedIdentifiers: z
      .array(relatedIdentSchema)
      .min(1, "At least one related identifier is required"),
  })
  .strict();

const affiliationSchema = z
  .object({
    affiliation: z.string(),
    identifier: z.string().optional(),
    identifierScheme: z.string().optional(),
    identifierSchemeUri: z.union([z.literal(""), z.string().trim().url()]),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.identifier && !data.identifierScheme) ||
      (!data.identifier && data.identifierScheme)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Both identifierScheme and identifier must be provided together",
      });
    }

    if (
      data.identifier &&
      data.identifierScheme === "ORCID" &&
      !isValidORCIDValue(data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Identifier must be a valid ORCID value",
        path: ["identifier"],
      });
    }

    if (
      data.identifier &&
      data.identifierScheme === "ROR" &&
      !isValidRORValue(data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Identifier must be a valid ROR value",
        path: ["identifier"],
      });
    }
  });

// Create base schema for creators and contributors
const baseCreatorObjectSchema = z
  .object({
    id: z.string().optional(),
    affiliations: z.array(affiliationSchema).optional(),
    deleted: z.boolean().optional(),
    familyName: z.string(),
    givenName: z.string(),
    local: z.boolean().optional(),
    nameIdentifier: z.string().optional(),
    nameIdentifierScheme: z.string().optional(),
    nameIdentifierSchemeUri: z.union([z.literal(""), z.string().trim().url()]),
    nameType: z
      .string()
      .trim()
      .min(1, "Name type is required")
      .refine((v) => nameTypeOptions.includes(v), {
        message: `Name type must be one of: ${nameTypeOptions.join(", ")}`,
      }),
  })
  .strict();

// Add the nameIdentifier validation to the creator schema
const creatorSchema = baseCreatorObjectSchema.superRefine(
  validateNameIdentifier,
);

// Contributor schema is the same as creator schema but with an additional contributorType field
const contributorSchema = baseCreatorObjectSchema
  .extend({
    contributorType: z
      .string()
      .trim()
      .min(1, "Contributor type is required")
      .refine((v) => contribTypeOptions.includes(v), {
        message: `Contributor type must be one of: ${contribTypeOptions.join(", ")}`,
        path: ["contributorType"],
      }),
  })
  .superRefine(validateNameIdentifier);

const funderSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    awardNumber: z.string().trim().optional(),
    awardTitle: z.string().trim().optional(),
    awardUri: z.string().trim().optional(),
    deleted: z.boolean().optional(),
    identifier: z.string().trim().optional(),
    identifierSchemeUri: z.string().trim().optional(),
    identifierType: z
      .string()
      .trim()
      .optional()
      .refine((v) => funderIdentTypeOptions.includes(v as any), {
        message: `Identifier type must be one of: ${funderIdentTypeOptions.join(", ")}`,
        path: ["identifierType"],
      }),
    local: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.identifierType && !data.identifier) ||
      (!data.identifierType && data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both identifierType and identifier must be provided together",
      });
    }

    if (
      data.identifier &&
      data.identifierType === "ORCID" &&
      !isValidORCIDValue(data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Identifier must be a valid ORCID value",
        path: ["identifier"],
      });
    }

    if (
      data.identifier &&
      data.identifierType === "ROR" &&
      !isValidRORValue(data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Identifier must be a valid ROR value",
        path: ["identifier"],
      });
    }
  });

const managingOrgSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    identifier: z.string().trim().optional(),
    identifierScheme: z.string().trim().optional(),
    identifierSchemeUri: z.string().trim().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.identifierScheme && !data.identifier) ||
      (!data.identifierScheme && data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both identifierType and identifier must be provided together",
      });
    }

    if (
      data.identifier &&
      data.identifierScheme === "ORCID" &&
      !isValidORCIDValue(data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Identifier must be a valid ORCID value",
        path: ["identifier"],
      });
    }

    if (
      data.identifier &&
      data.identifierScheme === "ROR" &&
      !isValidRORValue(data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Identifier must be a valid ROR value",
        path: ["identifier"],
      });
    }
  });

export const DatasetMetadataTeamSchema = z
  .object({
    contributors: z.array(contributorSchema),
    creators: z.array(creatorSchema),
    funders: z.array(funderSchema),
    managingOrganization: managingOrgSchema,
  })
  .strict();
