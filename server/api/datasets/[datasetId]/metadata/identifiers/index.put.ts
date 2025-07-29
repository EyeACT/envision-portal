import { z } from "zod";
import FORM_JSON from "@/assets/data/form.json";

const identTypeOptions = FORM_JSON.datasetIdentifierTypeOptions.map(
  (opt) => opt.value,
);

const altIdentifierSchema = z
  .object({
    id: z.string().optional(),
    deleted: z.boolean().optional(),
    identifier: z.string().min(1, "Identifier is required"),
    type: z.string().refine((v) => identTypeOptions.includes(v), {
      message: `Identifier type must be one of: ${identTypeOptions.join(", ")}`,
    }),
  })
  .strict();

const DatasetMetadataIdentifiersSchema = z
  .object({
    DatasetAlternateIdentifier: z
      .array(altIdentifierSchema)
      .min(1, "At least one alternate identifier is required"),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataIdentifiersSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const { DatasetAlternateIdentifier } = body.data;

  // get the alternate identifiers that already have an id and update them
  const alternateIdentifiersToUpdate = DatasetAlternateIdentifier.filter(
    (alternateIdentifier) => alternateIdentifier.id,
  );

  for (const alternateIdentifier of alternateIdentifiersToUpdate) {
    await prisma.datasetAlternateIdentifier.update({
      data: {
        identifier: alternateIdentifier.identifier,
        type: alternateIdentifier.type,
      },
      where: { id: alternateIdentifier.id },
    });
  }

  // get the alternate identifiers that don't have an id and create them
  const alternateIdentifiersToCreate = DatasetAlternateIdentifier.filter(
    (alternateIdentifier) => !alternateIdentifier.id,
  );

  for (const alternateIdentifier of alternateIdentifiersToCreate) {
    await prisma.datasetAlternateIdentifier.create({
      data: {
        datasetId,
        identifier: alternateIdentifier.identifier,
        type: alternateIdentifier.type,
      },
    });
  }

  // get the alternate identifiers that are deleted and delete them
  const alternateIdentifiersToDelete = DatasetAlternateIdentifier.filter(
    (alternateIdentifier) => alternateIdentifier.deleted,
  );

  for (const alternateIdentifier of alternateIdentifiersToDelete) {
    await prisma.datasetAlternateIdentifier.delete({
      where: { id: alternateIdentifier.id },
    });
  }

  return {
    success: true,
  };
});
