export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const { id } = getQuery(event);

  if (typeof id !== "string" || !/^[\w.+-]+$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid SPDX license ID",
    });
  }

  const license = await $fetch<{ licenseText: string }>(
    `https://spdx.org/licenses/${id}.json`,
    { retry: 0, timeout: 10000 },
  ).catch(() => {
    throw createError({
      statusCode: 502,
      statusMessage: "SPDX license lookup failed",
    });
  });

  return { licenseText: license.licenseText };
});
