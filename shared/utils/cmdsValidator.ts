import type {
  ScannedFile,
  ValidatorOptions,
  Issue,
  Summary,
  ValidationResult,
} from "./validatorTypes";
import { defaultConfig, type CMDSConfig } from "./cmdsConfig";

interface PathStageContext {
  allowedDatatypes: Set<string>;
  requiredRootMap: Map<string, { name: string; severity: "ERROR" | "WARNING" }>;
  allowedRootSet: Set<string>;
  allowedRootDirectories: Set<string>;
  namingRegex: RegExp;
  requiredDatatypeFiles: { name: string; severity: "ERROR" | "WARNING" }[];
  skipNested: Set<string>;
  requireParticipantsTsv: boolean;
  tsvContent?: string;
}

/**
 * Stage 1: path and filename validation.
 * Stage 2: metadata validation.
 */
export function validateCMDS(
  files: ScannedFile[],
  tsvContent?: string,
  options: ValidatorOptions = {},
  customConfig?: Partial<CMDSConfig>,
): ValidationResult {
  const ctx = buildContext(options, customConfig, tsvContent);

  const stages = [() => validatePathStage(files, ctx)];
  const { issues, summary } = stages.reduce(
    (acc, runStage) => {
      const result = runStage();
      return {
        issues: [...acc.issues, ...result.issues],
        summary: result.summary,
      };
    },
    {
      issues: [] as Issue[],
      summary: emptySummary(files.length),
    },
  );

  return {
    isValid: !issues.some((issue) => issue.severity === "ERROR"),
    issues,
    summary,
  };
}

function buildContext(
  options: ValidatorOptions,
  customConfig: Partial<CMDSConfig> | undefined,
  tsvContent?: string,
): PathStageContext {
  return {
    allowedDatatypes: new Set([
      ...defaultConfig.allowedDatatypes,
      ...(customConfig?.allowedDatatypes ?? []),
    ]),
    requiredRootMap: new Map(
      [
        ...defaultConfig.requiredRootFiles,
        ...(customConfig?.requiredRootFiles ?? []),
      ].map((item) => [item.name.toLowerCase(), item]),
    ),
    allowedRootSet: new Set([
      ...defaultConfig.allowedRootItems.map((item) => item.toLowerCase()),
      ...(customConfig?.allowedRootItems?.map((item) => item.toLowerCase()) ??
        []),
    ]),
    allowedRootDirectories: new Set([
      ...defaultConfig.allowedRootDirectories.map((item) => item.toLowerCase()),
      ...(customConfig?.allowedRootDirectories?.map((item) =>
        item.toLowerCase(),
      ) ?? []),
    ]),
    namingRegex: customConfig?.namingRegex ?? defaultConfig.namingRegex,
    requiredDatatypeFiles:
      customConfig?.requiredDatatypeFiles ??
      defaultConfig.requiredDatatypeFiles,
    skipNested: new Set([
      ...defaultConfig.nestedLayoutSkipDatatypes,
      ...(customConfig?.nestedLayoutSkipDatatypes ?? []),
    ]),
    requireParticipantsTsv: options.requireParticipantsTsv !== false,
    tsvContent,
  };
}

function emptySummary(totalFiles: number): Summary {
  return {
    totalFiles,
    datatypes: [],
    modalities: [],
    devices: [],
    participants: [],
  };
}

function validatePathStage(
  files: ScannedFile[],
  ctx: PathStageContext,
): { issues: Issue[]; summary: Summary } {
  const issues: Issue[] = [];
  const seenIssueKeys = new Set<string>();

  const addIssue = (issue: Omit<Issue, "stage">) => {
    const key = `${issue.code}|${issue.path}`;
    if (seenIssueKeys.has(key)) return;
    seenIssueKeys.add(key);
    issues.push({ ...issue, stage: "path" });
  };

  const datatypes = new Set<string>();
  const modalities = new Set<string>();
  const devices = new Set<string>();
  const participants = new Set<string>();
  const foundRootFiles = new Set<string>();
  const foundDatatypeFiles = new Map<string, Set<string>>();
  const foundDatatypeDirs = new Set<string>();

  const rawPaths = files.map((f) =>
    f.relativePath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\//, ""),
  );
  const prefix = stripRootPrefix(
    rawPaths,
    ctx.requiredRootMap,
    ctx.allowedRootSet,
    ctx.allowedDatatypes,
    ctx.allowedRootDirectories,
  );

  for (const rawPath of rawPaths) {
    const filePath = prefix ? rawPath.slice(prefix.length) : rawPath;
    if (!filePath) continue;

    const parts = filePath.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    if (parts.length === 1) {
      const fileName = parts[0]!;
      const lowerName = fileName.toLowerCase();
      foundRootFiles.add(lowerName);

      if (
        !ctx.requiredRootMap.has(lowerName) &&
        !ctx.allowedRootSet.has(lowerName)
      ) {
        addIssue({
          severity: "ERROR",
          code: "DISALLOWED_ROOT_FILE",
          path: filePath,
          message: `File "${fileName}" is not an allowed root file in CMDS standard.`,
        });
      }
      continue;
    }

    const topDir = parts[0]!;
    const lowerTopDir = topDir.toLowerCase();

    if (ctx.allowedRootDirectories.has(lowerTopDir)) {
      continue;
    }

    const datatype = topDir;
    foundDatatypeDirs.add(datatype);

    if (!ctx.allowedDatatypes.has(datatype)) {
      addIssue({
        severity: "ERROR",
        code: "INVALID_DATATYPE",
        path: datatype,
        message: `Invalid Datatype directory "${datatype}". Allowed types are: ${Array.from(ctx.allowedDatatypes).join(", ")}`,
      });
    }

    if (!ctx.namingRegex.test(datatype)) {
      addIssue({
        severity: "ERROR",
        code: "INVALID_DIRECTORY_NAME",
        path: datatype,
        message: `Datatype directory "${datatype}" violates naming rules.`,
      });
    }

    datatypes.add(datatype);

    if (!foundDatatypeFiles.has(datatype)) {
      foundDatatypeFiles.set(datatype, new Set());
    }

    if (parts.length === 2) {
      foundDatatypeFiles.get(datatype)!.add(parts[1]!.toLowerCase());
    }

    if (ctx.skipNested.has(datatype)) {
      continue;
    }

    const modality = parts[1];
    if (modality && parts.length > 2) {
      if (!ctx.namingRegex.test(modality)) {
        addIssue({
          severity: "ERROR",
          code: "INVALID_DIRECTORY_NAME",
          path: `${datatype}/${modality}`,
          message: `Modality directory "${modality}" violates naming rules.`,
        });
      }
      modalities.add(modality);
    }

    const device = parts[2];
    if (device && parts.length > 3) {
      if (!ctx.namingRegex.test(device)) {
        addIssue({
          severity: "ERROR",
          code: "INVALID_DIRECTORY_NAME",
          path: `${datatype}/${modality}/${device}`,
          message: `Device directory "${device}" violates naming rules.`,
        });
      }
      devices.add(device);
    }

    // Nested CMDS layout: datatype / modality / device / participant / file
    if (parts.length >= 5) {
      const participantFolder = parts[3]!;
      if (!ctx.namingRegex.test(participantFolder)) {
        addIssue({
          severity: "ERROR",
          code: "INVALID_DIRECTORY_NAME",
          path: `${datatype}/${modality}/${device}/${participantFolder}`,
          message: `Participant directory "${participantFolder}" violates naming rules.`,
        });
      }

      const id = normalizeParticipantId(participantFolder);
      if (id) participants.add(id);
    }
  }

  ctx.requiredRootMap.forEach((item, lowerName) => {
    if (lowerName === "participants.tsv" && !ctx.requireParticipantsTsv) {
      if (!foundRootFiles.has(lowerName)) {
        addIssue({
          severity: "WARNING",
          code: "MISSING_ROOT_METADATA",
          path: item.name,
          message: `Missing optional "${item.name}" file.`,
        });
      }
      return;
    }

    if (!foundRootFiles.has(lowerName)) {
      addIssue({
        severity: item.severity,
        code: "MISSING_ROOT_METADATA",
        path: item.name,
        message: `Missing required root file: "${item.name}".`,
      });
    }
  });

  foundDatatypeDirs.forEach((dt) => {
    if (ctx.skipNested.has(dt)) return;
    const filesInDt = foundDatatypeFiles.get(dt) ?? new Set<string>();
    ctx.requiredDatatypeFiles.forEach((item) => {
      if (!filesInDt.has(item.name.toLowerCase())) {
        addIssue({
          severity: item.severity,
          code: "MISSING_DATATYPE_FILE",
          path: `${dt}/${item.name}`,
          message: `Datatype directory "${dt}" is missing "${item.name}".`,
        });
      }
    });
  });

  if (foundRootFiles.has("participants.tsv") && ctx.tsvContent) {
    const parsed = parseParticipantIds(ctx.tsvContent);

    if (!parsed.hasIdColumn) {
      addIssue({
        severity: "ERROR",
        code: "INVALID_PARTICIPANTS_TSV",
        path: "participants.tsv",
        message:
          'participants.tsv must include a "participant_id" (or "person_id") column. Folder IDs were not cross-checked.',
      });
    } else {
      parsed.ids.forEach((id) => {
        if (!participants.has(id)) {
          addIssue({
            severity: "WARNING",
            code: "MISSING_PARTICIPANT_FOLDER",
            path: "participants.tsv",
            message: `Participant ID "${id}" listed in participants.tsv has no matching folder.`,
          });
        }
      });

      participants.forEach((id) => {
        if (!parsed.ids.has(id)) {
          addIssue({
            severity: "ERROR",
            code: "UNREGISTERED_PARTICIPANT_FOLDER",
            path: id,
            message: `Participant ID "${id}" found in folders but not in participants.tsv.`,
          });
        }
      });
    }
  }

  return {
    issues,
    summary: {
      totalFiles: files.length,
      datatypes: Array.from(datatypes).sort((a, b) => a.localeCompare(b)),
      modalities: Array.from(modalities).sort((a, b) => a.localeCompare(b)),
      devices: Array.from(devices).sort((a, b) => a.localeCompare(b)),
      participants: Array.from(participants).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
      ),
    },
  };
}

function normalizeParticipantId(folderName: string): string {
  return folderName.replace(/^sub-/i, "").trim();
}

function stripRootPrefix(
  paths: string[],
  requiredRootMap: Map<string, unknown>,
  allowedRootSet: Set<string>,
  allowedDatatypes: Set<string>,
  allowedRootDirectories: Set<string>,
): string {
  if (paths.length === 0) return "";
  const firstPath = paths[0];
  if (!firstPath) return "";

  const segment = firstPath.split("/")[0];
  if (!segment) return "";

  const lowerSegment = segment.toLowerCase();
  const isAllPrefixed = paths.every((p) => p.startsWith(segment + "/"));

  if (
    isAllPrefixed &&
    !requiredRootMap.has(lowerSegment) &&
    !allowedRootSet.has(lowerSegment) &&
    !allowedDatatypes.has(segment) &&
    !allowedRootDirectories.has(lowerSegment)
  ) {
    return segment + "/";
  }
  return "";
}

function parseParticipantIds(tsvText: string): {
  ids: Set<string>;
  hasIdColumn: boolean;
} {
  const ids = new Set<string>();
  const lines = tsvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { ids, hasIdColumn: false };

  const headers =
    lines[0]?.split("\t").map((h) => h.trim().toLowerCase()) || [];
  const colIndex = headers.findIndex(
    (h) => h === "person_id" || h === "participant_id",
  );

  if (colIndex === -1) return { ids, hasIdColumn: false };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split("\t");
    const val = normalizeParticipantId(cols[colIndex]?.trim() ?? "");
    if (val) ids.add(val);
  }

  return { ids, hasIdColumn: true };
}
