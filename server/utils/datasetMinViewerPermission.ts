import type { H3Event } from "h3";

// Throws unless the user is at least viewer of the dataset in the route params
export const datasetMinViewerPermission = (event: H3Event) =>
  requireDatasetRole(event, "viewer");
