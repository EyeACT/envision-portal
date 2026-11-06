type RorRecord = {
  locations: {
    geonames_details: {
      country_name?: string | null;
      country_subdivision_name?: string | null;
      name?: string | null;
    };
  }[];
  names: { types: string[]; value: string }[];
};

export default defineEventHandler(async (event): Promise<RorOrganization> => {
  await requireUserSession(event);

  const { ror } = event.context.params as { ror: string };

  if (!/^0[a-z0-9]{6}\d{2}$/.test(ror)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid ROR ID",
    });
  }

  const organization = await $fetch<RorRecord>(
    `https://api.ror.org/v2/organizations/${ror}`,
    { retry: 0, timeout: 10000 },
  ).catch((error: { statusCode?: number }) => {
    throw error.statusCode === 404
      ? createError({ statusCode: 404, statusMessage: "ROR ID not found" })
      : createError({ statusCode: 502, statusMessage: "ROR lookup failed" });
  });

  const displayName = organization.names.find((name) =>
    name.types.includes("ror_display"),
  );

  if (!displayName) {
    throw createError({ statusCode: 502, statusMessage: "ROR lookup failed" });
  }

  // An organization can have several locations; the first is its main one.
  const location = organization.locations[0]?.geonames_details;

  return {
    city: location?.name ?? "",
    country: location?.country_name ?? "",
    name: displayName.value,
    state: location?.country_subdivision_name ?? "",
  };
});
