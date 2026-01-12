import { z } from "zod";

/**
 * External dataset registration
 */
export const externalDatasetSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  version: z.string().min(1, "Version is required"),
  publicationYear: z.string().length(4, "Publication year must be 4 digits"),
  creatorName: z.string().min(1, "Creator name is required"),
  creatorNameType: z.enum(["Personal", "Organizational"]),
  managingOrgName: z.string().min(1, "Managing organization is required"),
  accessType: z.string().min(1, "Access type is required"),
  accessDescription: z.string().min(1, "Access description is required"),
  accessUrl: z.string().url("Valid URL is required"),
  rightsName: z.string().min(1, "License name is required"),
  publisherName: z.string().min(1, "Publisher name is required"),
  resourceTypeValue: z.string().min(1, "Resource type is required"),
  deIdentType: z.string().min(1, "De-identification type is required"),
  deIdentDirect: z.boolean(),
  deIdentHIPAA: z.boolean(),
  deIdentDates: z.boolean(),
  deIdentNonarr: z.boolean(),
  deIdentKAnon: z.boolean(),
  consentType: z.string().min(1, "Consent type is required"),
  consentNoncommercial: z.boolean(),
  consentGeogRestrict: z.boolean(),
  consentResearchType: z.boolean(),
  consentGeneticOnly: z.boolean(),
  consentNoMethods: z.boolean(),
});

export type ExternalDataset = z.infer<typeof externalDatasetSchema>;
