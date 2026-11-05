import { BlobServiceClient } from "@azure/storage-blob";
import { fileTypeFromBuffer } from "file-type";
import type { H3Event } from "h3";
import type {
  DatasetRequest,
  DatasetRequestDetails,
} from "~~/shared/generated/client";
import {
  ACCEPTED_AGREEMENT_EXTENSIONS,
  AGREEMENT_KINDS,
  MAX_AGREEMENT_BYTES,
  type AgreementKind,
} from "#shared/constants/requests";
import { sanitizeFileName } from "#shared/utils/documents";

// Which DatasetRequestDetails column holds each agreement's storage path
const AGREEMENT_FIELDS = {
  unsigned: "unsignedDataUseAgreement",
  signed: "requesterSignedDataUseAgreement",
  final: "signedDataUseAgreement",
} as const satisfies Record<AgreementKind, keyof DatasetRequestDetails>;

// Detected types we accept. Old .doc files are detected as a CFB container
const ACCEPTED_AGREEMENT_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/x-cfb",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const CONTENT_TYPES: Record<string, string> = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

export const parseAgreementKind = (
  kind: string | undefined,
  allowed: readonly AgreementKind[] = AGREEMENT_KINDS,
): AgreementKind => {
  if (!kind || !allowed.includes(kind as AgreementKind)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Agreement not found",
    });
  }

  return kind as AgreementKind;
};

export const getAgreementPath = (
  details: DatasetRequestDetails | null | undefined,
  kind: AgreementKind,
) => details?.[AGREEMENT_FIELDS[kind]] ?? null;

// Each request has a single details row. Older requests may be missing it
export const getOrCreateRequestDetails = async (request: {
  id: string;
  DatasetRequestDetails: DatasetRequestDetails[];
}) =>
  request.DatasetRequestDetails[0] ??
  (await prisma.datasetRequestDetails.create({
    data: { datasetRequestId: request.id },
  }));

// Stored as `{canonicalId}/requests/{requestId}/{kind}-{name}`. Strip the prefix for display
const agreementDisplayName = (path: string | null) => {
  if (!path) return null;

  const fileName = path.split("/").pop() ?? "";

  return fileName.replace(/^(unsigned|signed|final)-/, "");
};

// Request fields that are safe to send to the browser. Storage paths stay on the server
export const serializeDatasetRequest = <
  T extends DatasetRequest & { DatasetRequestDetails: DatasetRequestDetails[] },
>(
  request: T,
) => {
  const { DatasetRequestDetails: detailRows, ...rest } = request;
  const details = detailRows[0];

  return {
    ...rest,
    agreements: {
      final: agreementDisplayName(getAgreementPath(details, "final")),
      signed: agreementDisplayName(getAgreementPath(details, "signed")),
      unsigned: agreementDisplayName(getAgreementPath(details, "unsigned")),
    },
    invalidatedOn: details?.invalidatedOn ?? null,
  };
};

// Once an agreement has been sent, approval waits for the countersigned copy
export const getApprovalBlocker = (
  details: DatasetRequestDetails | null | undefined,
) => {
  if (!getAgreementPath(details, "unsigned")) return null;

  if (!getAgreementPath(details, "signed")) {
    return "Waiting for the requester to upload the signed data use agreement";
  }

  if (!getAgreementPath(details, "final")) {
    return "Upload the countersigned data use agreement before approving";
  }

  return null;
};

const getStudyContainer = () => {
  const { AZURE_DRAFT_CONNECTION_STRING } = useRuntimeConfig();

  return BlobServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  ).getContainerClient(STUDY_FILE_SYSTEM);
};

/**
 * Read a single `file` field from a multipart upload, check it is a PDF or
 * Word document, and store it in the study account next to the dataset.
 * Returns the storage path to save on the request details.
 */
export const uploadRequestAgreement = async (
  event: H3Event,
  canonicalId: string,
  requestId: string,
  kind: AgreementKind,
) => {
  const formData = await readMultipartFormData(event);
  const file = formData?.find((part) => part.name === "file");

  if (!file?.filename) {
    throw createError({
      statusCode: 400,
      statusMessage: "No file included in the form data",
    });
  }

  const sanitizedName = sanitizeFileName(file.filename).toLocaleLowerCase();
  const extension = sanitizedName.split(".").pop() ?? "";

  if (!ACCEPTED_AGREEMENT_EXTENSIONS.includes(extension)) {
    throw createError({
      statusCode: 400,
      statusMessage: `File must be one of: ${ACCEPTED_AGREEMENT_EXTENSIONS.join(", ")}`,
    });
  }

  if (file.data.byteLength > MAX_AGREEMENT_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: "File size is larger than 15MB.",
    });
  }

  const detected = await fileTypeFromBuffer(file.data);

  if (!detected || !ACCEPTED_AGREEMENT_MIMETYPES.includes(detected.mime)) {
    throw createError({
      statusCode: 400,
      statusMessage: "File does not look like a PDF or Word document.",
    });
  }

  const storagePath = `${canonicalId}/requests/${requestId}/${kind}-${sanitizedName}`;

  await getStudyContainer()
    .getBlockBlobClient(storagePath)
    .uploadData(file.data, {
      blobHTTPHeaders: { blobContentType: CONTENT_TYPES[extension] },
    });

  return storagePath;
};

// Send a stored agreement back through the server so no SAS link is handed out
export const sendRequestAgreement = async (
  event: H3Event,
  storagePath: string | null,
) => {
  if (!storagePath) {
    throw createError({
      statusCode: 404,
      statusMessage: "Agreement not found",
    });
  }

  const blobClient = getStudyContainer().getBlobClient(storagePath);

  let buffer: Buffer;

  try {
    buffer = await blobClient.downloadToBuffer();
  } catch (error: any) {
    if (error.statusCode === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agreement not found",
      });
    }
    throw error;
  }

  const fileName = agreementDisplayName(storagePath) ?? "agreement";
  const extension = fileName.split(".").pop() ?? "";

  setResponseHeaders(event, {
    "Cache-Control": "private, no-store",
    "Content-Disposition": `inline; filename="${fileName.replace(/"/g, "")}"`,
    "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
  });

  return buffer;
};

interface RequestNotification {
  title: string;
  body: string;
  type?: "info" | "success" | "warning" | "error";
  url: string;
}

// Owners and admins of the dataset are the ones who can act on a request
export const notifyDatasetManagers = async (
  datasetId: string | null,
  notification: RequestNotification,
) => {
  if (!datasetId) return;

  const managers = await prisma.datasetMember.findMany({
    select: { userId: true },
    where: {
      datasetId,
      OR: [{ owner: true }, { role: { in: ["owner", "admin"] } }],
    },
  });

  if (managers.length === 0) return;

  await prisma.notification.createMany({
    data: managers.map(({ userId }) => ({
      ...notification,
      type: notification.type ?? "info",
      userId,
    })),
  });
};

// Anonymous public requests have no user to notify
export const notifyRequester = async (
  userId: string | null,
  notification: RequestNotification,
) => {
  if (!userId) return;

  await prisma.notification.create({
    data: { ...notification, type: notification.type ?? "info", userId },
  });
};
