const sections = [
  { key: "motivation", title: "Motivation" },
  { key: "composition", title: "Data Composition" },
  { key: "collection", title: "Collection Process" },
  { key: "preprocessing", title: "Pre-processing / De-Identification" },
  { key: "uses", title: "Uses" },
  { key: "distribution", title: "Dataset Distribution" },
  { key: "maintenance", title: "Maintenance" },
] as const;

const parseRecords = (
  section: any,
): { id: number; question: string; response: string }[] => {
  if (!section) return [];
  const parsed = typeof section === "string" ? JSON.parse(section) : section;
  return parsed.records || [];
};

const generateHealthsheet = async (datasetId: string, userId: string) => {
  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetHealthsheet: true,
    },
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId,
        },
      },
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  if (!dataset.DatasetHealthsheet) {
    throw createError({
      statusCode: 400,
      statusMessage: "Dataset does not have a healthsheet",
    });
  }

  const lines: string[] = ["# Healthsheet"];

  for (const { key, title } of sections) {
    const records = parseRecords(
      dataset.DatasetHealthsheet[key as keyof typeof dataset.DatasetHealthsheet],
    );

    if (records.length === 0) {
      continue;
    }

    lines.push("", `## ${title}`);

    for (const record of records) {
      lines.push("", `${record.id}. ${record.question}`);

      const response = record.response?.trim();

      if (response) {
        const indented = response
          .split("\n")
          .map((line) => `   ${line}`)
          .join("\n");

        lines.push("", indented);
      } else {
        lines.push("", "   N/A");
      }
    }
  }

  lines.push("");

  return lines.join("\n");
};

export default generateHealthsheet;
