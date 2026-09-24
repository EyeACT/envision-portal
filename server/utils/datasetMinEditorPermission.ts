import type { H3Event } from "h3";

// Throws unless the user is at least editor of the dataset in the route params
export const datasetMinEditorPermission = (event: H3Event) =>
  requireDatasetRole(event, "editor");
