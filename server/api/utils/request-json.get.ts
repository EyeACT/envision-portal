export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const { url } = getQuery(event);

  const response = await fetch(url as string);

  const data = await response.json();

  return {
    data,
  };
});
