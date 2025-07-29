import { z } from "zod";
import FORM_JSON from "@/assets/data/form.json";

const accessTypeOptions = FORM_JSON.datasetAccessTypeOptions.map(
  (opt) => opt.value,
);

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

const DatasetMetadataAccessRightsSchema = z
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

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataAccessRightsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Invalid data",
    });
  }

  const { access, rights } = body.data;

  await prisma.datasetAccess.update({
    data: {
      description: access.description,
      type: access.type,
      url: access.url,
      urlLastChecked: access.urlLastChecked
        ? new Date(access.urlLastChecked)
        : null,
    },
    where: { datasetId },
  });

  await prisma.datasetRights.update({
    data: {
      identifier: rights.identifier,
      identifierScheme: rights.identifierScheme,
      identifierSchemeUri: rights.identifierSchemeUri,
      licenseText: rights.licenseText,
      rights: rights.rights,
      uri: rights.uri,
    },
    where: { datasetId },
  });

  return {
    success: true,
  };
});
