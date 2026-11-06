type OrcidEmployment = {
  "end-date": unknown;
  organization: {
    "disambiguated-organization": {
      "disambiguated-organization-identifier": string;
      "disambiguation-source": string;
    } | null;
    name: string;
  };
};

type OrcidRecord = {
  "activities-summary"?: {
    employments?: {
      "affiliation-group"?: {
        summaries: { "employment-summary": OrcidEmployment }[];
      }[];
    };
  };
  person?: {
    name: {
      "family-name": { value: string } | null;
      "given-names": { value: string } | null;
    } | null;
  };
};

export default defineEventHandler(async (event): Promise<OrcidProfile> => {
  await requireUserSession(event);

  const { orcid } = event.context.params as { orcid: string };

  if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid ORCID iD",
    });
  }

  const record = await $fetch<OrcidRecord>(
    `https://pub.orcid.org/v3.0/${orcid}/record`,
    {
      headers: { Accept: "application/json" },
      retry: 0,
      timeout: 10000,
    },
  ).catch((error: { statusCode?: number }) => {
    throw error.statusCode === 404
      ? createError({ statusCode: 404, statusMessage: "ORCID iD not found" })
      : createError({ statusCode: 502, statusMessage: "ORCID lookup failed" });
  });

  const name = record.person?.name;

  // One organization can appear several times, once for each role held there.
  const currentOrganizations = new Map<
    string,
    { affiliation: string; identifier: string }
  >();

  const groups =
    record["activities-summary"]?.employments?.["affiliation-group"];

  for (const group of groups ?? []) {
    for (const summary of group.summaries) {
      const employment = summary["employment-summary"];
      if (employment["end-date"]) continue;

      const { name: affiliation, "disambiguated-organization": disambiguated } =
        employment.organization;
      const key = affiliation.trim().toLowerCase();

      if (!currentOrganizations.has(key)) {
        currentOrganizations.set(key, {
          affiliation,
          identifier:
            disambiguated?.["disambiguation-source"] === "ROR"
              ? disambiguated["disambiguated-organization-identifier"]
              : "",
        });
      }
    }
  }

  return {
    affiliations: [...currentOrganizations.values()],
    familyName: name?.["family-name"]?.value ?? "",
    givenName: name?.["given-names"]?.value ?? "",
  };
});
