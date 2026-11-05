// Access level picked by the owner when publishing. Public requests are approved
// automatically. Controlled requests wait for an owner or admin to review them
export const DATASET_ACCESS_LEVELS = ["public", "controlled"] as const;

export type DatasetAccessLevel = (typeof DATASET_ACCESS_LEVELS)[number];

// pending -> approved | rejected, and approved -> revoked
export const DATASET_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "revoked",
] as const;

export type DatasetRequestStatus = (typeof DATASET_REQUEST_STATUSES)[number];

// The optional data use agreement exchange, in order:
// unsigned - uploaded by the owner for the requester to sign
// signed   - uploaded by the requester after signing
// final    - countersigned copy uploaded by the owner. Required before approval
//            once an unsigned agreement has been sent
export const AGREEMENT_KINDS = ["unsigned", "signed", "final"] as const;

export type AgreementKind = (typeof AGREEMENT_KINDS)[number];

export const ACCEPTED_AGREEMENT_EXTENSIONS = ["pdf", "doc", "docx"];

export const MAX_AGREEMENT_BYTES = 15 * 1024 * 1024;
