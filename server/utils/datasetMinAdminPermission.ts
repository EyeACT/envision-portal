import type { H3Event } from "h3";

// Throws unless the user is at least admin of the dataset in the route params
export const datasetMinAdminPermission = (event: H3Event) =>
  requireDatasetRole(event, "admin");
