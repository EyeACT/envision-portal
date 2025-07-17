import { z } from "zod";
import FORM_JSON from "~/assets/data/form.json";
import { isValidORCIDValue, isValidRORValue } from "~/utils/validations";

const validStatus = FORM_JSON.studyMetadataStatusOptions.map(
  (opt) => opt.value,
);

const LocationSchema = z
  .object({
    id: z.string().optional(),
    city: z.string().trim().min(1, { message: "City is required" }),
    country: z.string().trim().min(1, { message: "Country is required" }),
    deleted: z.boolean().optional(),
    facility: z.string().trim().min(1, { message: "Facility is required" }),
    identifier: z.string().trim(),
    identifierScheme: z.string().trim(),
    identifierSchemeUri: z.union([z.literal(""), z.string().trim().url()]),
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
    zip: z.string().trim(),
  })
  .superRefine((data, context) => {
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
  });

const StudyMetadataLocationsSchema = z.object({
  studyLocations: z
    .array(LocationSchema, {
      invalid_type_error: "`studyLocations` must be an array",
      required_error: "`studyLocations` array is required",
    })
    .min(1, { message: "At least one study location is required" }),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataLocationsSchema.safeParse(b),
  );

  if (!body.success) {
    console.log(body.error);

    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const { studyLocations } = body.data;

  const studyLocationsToUpdate = studyLocations.filter(
    (location) => location.id,
  );

  for (const location of studyLocationsToUpdate) {
    await prisma.studyLocation.update({
      data: {
        city: location.city,
        country: location.country,
        facility: location.facility,
        identifier: location.identifier,
        identifierScheme: location.identifierScheme,
        identifierSchemeUri: location.identifierSchemeUri,
        state: location.state,
        status: location.status,
        zip: location.zip,
      },
      where: { id: location.id },
    });
  }

  const studyLocationsToCreate = studyLocations.filter(
    (location) => !location.id,
  );

  for (const location of studyLocationsToCreate) {
    await prisma.studyLocation.create({
      data: {
        city: location.city,
        country: location.country,
        datasetId,
        facility: location.facility,
        identifier: location.identifier,
        identifierScheme: location.identifierScheme,
        identifierSchemeUri: location.identifierSchemeUri,
        state: location.state,
        status: location.status,
        zip: location.zip,
      },
    });
  }

  const studyLocationsToDelete = studyLocations.filter(
    (location) => location.deleted,
  );

  for (const location of studyLocationsToDelete) {
    await prisma.studyLocation.delete({
      where: { id: location.id },
    });
  }

  return {
    studyLocations: studyLocations.filter((item) => !item.deleted),
  };
});
