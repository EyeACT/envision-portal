import type { H3Event } from "h3";

// Throws unless the user is the owner of the dataset in the route params
export const datasetMinOwnerPermission = (event: H3Event) =>
  requireDatasetRole(event, "owner");
