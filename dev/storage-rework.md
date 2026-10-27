# Envision Portal: Storage Architecture

This document describes how Envision Portal stores draft and published dataset files in Azure Storage, how access is granted, and the work needed to implement it.

## Overview

Envision Portal has two sides:

- **Study management:** dataset owners upload and manage raw (draft) data.
- **Data portal:** approved requesters download published datasets.

Storage is split into two accounts:

| Account   | Purpose                                                                                                       | Who has access                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Study     | Draft uploads from dataset owners, plus app-owned files (manifests, documents, previews, exports, audit logs) | Dataset owners, via short-lived directory-scoped SAS on their dataset's `data/` folder only. Everything else is backend only. |
| Published | Immutable released dataset versions                                                                           | Approved requesters, via short-lived read-only SAS                                                                            |

The two accounts stay separate because they need different settings (hierarchical namespace vs flat, mutable vs immutable, Hot vs Cool) and because a problem with uploader access should never affect released data.

Each environment (dev, staging, prod) has its own pair of accounts.

## Identifiers

Every version of a dataset is its own `Dataset` record. Versions of the same dataset share a `canonicalId`.

| ID            | Meaning                                | Used for                                                                          |
| ------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `canonicalId` | The dataset across all of its versions | The dataset's folder in the study account (`datasets/{canonicalId}/`)             |
| `datasetId`   | One version (the `Dataset` record ID)  | The frozen data folder (`data-{datasetId}/`), manifests, and published containers |

Both IDs must **never be reused**, so an old SAS token or leftover folder can never match a future dataset.

## Naming Convention

Storage account names use the `st` prefix from the [Microsoft Cloud Adoption Framework](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations) abbreviations, which marks the resource as a storage account.

Storage account names must be 3 to 24 lowercase letters and numbers, with no hyphens, and globally unique. If a name is taken, add a short org suffix (for example `stenvisionstudyprodcm2`).

## Storage Accounts

| Purpose   | Dev                  | Staging              | Prod                  |
| --------- | -------------------- | -------------------- | --------------------- |
| Study     | `stenvisionstudydev` | `stenvisionstudystg` | `stenvisionstudyprod` |
| Published | `stenvisionpubdev`   | `stenvisionpubstg`   | `stenvisionpubprod`   |

### Account settings

**Study**

- Hierarchical namespace (ADLS Gen2) **enabled at creation** (cannot be turned off later). This is what makes directory renames atomic, which the publish and new version flows depend on.
- Shared key access enabled (required for account-key SAS)
- Anonymous blob access disabled
- Hot access tier

**Published**

- Flat blob storage (no hierarchical namespace). Published data is read-only, so directory features add nothing, and flat storage has full support for versioning and immutability.
- Blob versioning enabled
- Version-level immutability enabled
- Shared key access enabled (required for account-key SAS)
- Anonymous blob access disabled
- Cool access tier

### Account keys

The backend authenticates to both accounts with storage account keys and signs SAS tokens with them.

- Keys are stored only as backend secrets (environment variables or the existing secret store), never in client code, logs, or the repo.
- Each account has two keys. The backend signs with **key1**; **key2** is held in reserve for rotation.
- An account key grants full access to every container in that account. A leaked study key exposes draft data and all app-owned files, so it must be rotated immediately.

## Containers and Folder Layout

```
stenvisionstudy{env}                     (HNS)
├── datasets/
│   └── {canonicalId}/                   backend only
│       ├── data/                        live draft uploads (the only path users can access)
│       ├── data-{datasetId}/            frozen data for a version being published or last published
│       ├── documents/                   dataset documentation (README, data dictionary, etc.)
│       ├── manifests/
│       │   └── {datasetId}.json         publish manifest per version
│       ├── previews/                    generated thumbnails and previews
│       └── exports/                     metadata exports
└── audit/
    └── {yyyy}/{mm}/                     access log exports (spans datasets)

stenvisionpub{env}                       (flat)
└── {datasetId}/                         one container per published version
    ├── data/
    ├── documents/
    └── manifest.json
```

At any time a dataset has at most one of `data/` (a draft version is open) or `data-{datasetId}/` (the latest version is locked or published). See [Workflows](#workflows) for how it moves between the two.

| Account   | Container     | Created by          | Notes                                                                     |
| --------- | ------------- | ------------------- | ------------------------------------------------------------------------- |
| Study     | `datasets`    | Setup (once)        | App creates `{canonicalId}/` and its subfolders when a dataset is created |
| Study     | `audit`       | Setup (once)        | Kept separate so audit logs are never removed with a dataset              |
| Published | `{datasetId}` | Task queue, publish | Contains `data/`, `documents/`, and `manifest.json`                       |

`documents/` is managed by the backend (through the UI). If owners need to upload documents directly through Storage Explorer, either place them under `data/` or issue a separate directory SAS for `documents/`.

Container names must be 3 to 63 characters of lowercase letters, numbers, and hyphens, starting with a letter or number, with no consecutive hyphens. Database IDs (cuid2) fit within these rules.

## Access Model

All SAS tokens are **service SAS**, signed with the storage account key (key1).

| Use                  | Scope                                               | Permissions                                   | Lifetime           |
| -------------------- | --------------------------------------------------- | --------------------------------------------- | ------------------ |
| Dataset owner upload | Directory (`sr=d`) on `datasets/{canonicalId}/data` | `racwdl` (add `m` only if renames are needed) | 8 to 24 hours      |
| Requester download   | Container on `{datasetId}`                          | `rl`                                          | 24 hours to 7 days |

Rules:

- **Owner SAS always targets `datasets/{canonicalId}/data`, never `datasets/{canonicalId}`.** A token scoped one level higher would let owners modify or delete manifests, documents, previews, and frozen `data-{datasetId}/` folders. The SAS function hardcodes the `/data` suffix rather than accepting a path, and this is covered by a test.
- A directory SAS is bound to the path, not to the files in it. Once `data/` is renamed to `data-{datasetId}/`, an unexpired owner SAS can no longer reach those files. This is what lets publishing lock a dataset immediately instead of waiting for tokens to expire.
- Never issue an account SAS on either account. An account SAS spans every container.
- Never issue a container-scoped SAS on the study account. All study SAS generation goes through one tested function.
- Never grant `p` (set permissions) or `o` (change ownership).
- Users request a fresh link from the UI when a token expires.
- Long-term authorization lives in the database, not in the token. Revoking access means disabling the grant so no new SAS is issued.
- Download tracing relies on the app's own records of which SAS was issued to whom.
- Individual SAS tokens cannot be revoked. The emergency option is rotating the signing key, which invalidates every SAS signed with it on that account.
- Service SAS has no maximum lifetime, but tokens are still kept short because they cannot be revoked individually.

## Workflows

### Create dataset

1. Create the dataset record in the database (this assigns both `datasetId` and `canonicalId`).
2. Create `datasets/{canonicalId}/` and its subfolders (`data/`, `documents/`, `manifests/`, `previews/`, `exports/`) in the study account.

### Upload access

1. Check the dataset is a draft and not locked (`lockedAt` is not set).
2. Ensure `datasets/{canonicalId}/data/` exists, recreating it if the owner deleted it.
3. Issue a directory-scoped SAS for `datasets/{canonicalId}/data`.
4. Owner pastes the SAS URL into Azure Storage Explorer and manages files.

Because the SAS is scoped to `data/`, owners can delete files inside it (or `data/` itself) but can never delete the dataset folder or its sibling folders.

### Publish dataset

Publishing is split into a fast request, which locks the dataset, and a background task, which does the copy.

**Request (`publish/finalize.post.ts`)**

1. Set `lockedAt` on the dataset. This blocks edits, document changes, and new upload SAS.
2. Rename `datasets/{canonicalId}/data` to `datasets/{canonicalId}/data-{datasetId}`. On HNS this is a single atomic operation, and it cuts off every outstanding owner SAS immediately.
3. Generate the metadata files and queue a `publish-dataset` task with them in its payload.

**Task (`scripts/process-task-queue.ts`)**

1. Write the manifest to `datasets/{canonicalId}/manifests/{datasetId}.json`, covering `data-{datasetId}/` and `documents/`.
2. Create the `{datasetId}` container in the published account.
3. Server-side copy (AzCopy or Copy Blob From URL) of `data-{datasetId}/` into the container's `data/`, and `documents/` into its `documents/`, so file data never passes through the app.
4. Upload the metadata files and the manifest (as `manifest.json`), so requesters can verify their download.
5. Verify the copy against the manifest.
6. Apply the immutability policy.
7. Mark the version published.

`data-{datasetId}/` stays in the study account after publishing, so the next version can start from it without a copy.

The task can be retried safely: the source folder is frozen and the container is created with `createIfNotExists`. If a publish is abandoned, clear `lockedAt` and rename `data-{datasetId}` back to `data`.

An unexpired owner SAS can still create a new `data/` folder after the rename. Nothing in it is published, and the [new version](#new-version) flow and reconciliation script remove it.

Empty directories in the study account do not carry over, since flat storage has no real directories. If an empty folder is meaningful, add a placeholder file (such as `.keep`) or record it in the manifest.

### New version

1. Check the latest version's publish task has completed. The task reads from `data-{datasetId}/`, so it must not be moved mid-copy.
2. Create the new `Dataset` record with the same `canonicalId` (`new-version.post.ts`).
3. Delete any stray `datasets/{canonicalId}/data/` left by an old SAS (the rename fails if the target exists).
4. Rename `datasets/{canonicalId}/data-{previousDatasetId}` back to `datasets/{canonicalId}/data`.

The new version is editable immediately with the previous version's files, with no copy. The previous version remains available from its published container.

### Delete dataset

1. Mark the dataset deleted in the database (stops new SAS).
2. Delete `datasets/{canonicalId}/` immediately or after a short grace period. On HNS this is a single atomic directory delete.
3. If any version was published, its manifest is already preserved in the published container as `manifest.json`.
4. The reconciliation script removes any files written afterward by an unexpired SAS.

Deletion is permanent. Dataset owners are expected to keep local copies, and the UI states this.

### Requester access

1. Requester is approved and a grant is recorded (who, which version, expiry per data use agreement).
2. Requester clicks "Access data" in the portal.
3. Backend checks the grant and issues a read-only SAS for the `{datasetId}` container.

## Maintenance Scripts

Automations are handled by scripts run manually rather than Azure-specific services.

- **Task queue:** `scripts/process-task-queue.ts` runs every due task in the `Task` table, then exits. Run on a schedule or after a publish request.
- **Reconciliation:** list top-level folders in `datasets` and remove any whose `canonicalId` has no active dataset in the database. Also remove a `data/` folder in any dataset whose latest version is locked or published. Run periodically and after deletes or publishes. This catches files written by an unexpired SAS.
- **Publish verification:** compare a published container against its `manifest.json`.
- **Key rotation:** switch the backend to key2, then regenerate key1 on the affected account. This invalidates every SAS signed with key1. Active users then request fresh links from the UI. Use this if a token or key leaks, and optionally on a regular schedule.

## Notes

- Azure lifecycle management rules filter by path prefix from the start of the container, so a rule cannot target "every dataset's `previews/` folder". If per-type retention or tiering is ever needed, those folders would need to move into their own containers.
- `documents/` is shared across versions and is not renamed on publish. Only the backend writes to it, so the `lockedAt` check is enough to freeze it during the copy.

## Open Questions

- **Deleting a draft version.** If a draft created from a previous version is deleted, its `data/` has no frozen counterpart left (`data-{previousDatasetId}/` was renamed into it). Either rename `data/` back to `data-{previousDatasetId}/` (keeping the draft's edits) or delete it and copy from the published container when the next version is created.

## Implementation Checklist

### Setup (per environment)

- [ ] Study storage account with hierarchical namespace enabled
- [ ] Published storage account with versioning and version-level immutability
- [ ] `datasets` and `audit` containers in study account
- [ ] Anonymous access disabled on both accounts
- [ ] Account keys stored as backend secrets (signing with key1)

### Backend

- [ ] Study paths keyed by `canonicalId` everywhere (dataset creation, upload SAS, files listing, documents, task queue)
- [ ] Dataset creation creates `datasets/{canonicalId}/` with all subfolders
- [ ] Single function for study SAS generation (directory-scoped service SAS, hardcoded to `datasets/{canonicalId}/data`)
- [ ] `data/` recreated before issuing SAS if missing
- [ ] SAS issuance blocked for deleted, locked, and published datasets
- [ ] Publish request sets `lockedAt`, renames `data/` to `data-{datasetId}/`, and queues the task
- [ ] Publish task copies from `data-{datasetId}/` and `documents/`, writes manifest, verifies, applies immutability
- [ ] New version waits for the publish task, removes stray `data/`, and renames `data-{previousDatasetId}/` back to `data/`
- [ ] Delete flow (DB flag, then delete `datasets/{canonicalId}/`)
- [ ] Requester grants table and read-only SAS endpoint

### Scripts

- [ ] Task queue runner on a schedule
- [ ] Reconciliation script (including stray `data/` on locked datasets)
- [ ] Publish verification script
- [ ] Key rotation script

### Pre-launch tests

- [ ] An owner SAS for `datasets/{canonicalId}/data` cannot list, read, or write `data-{datasetId}/`, `documents/`, `manifests/`, `previews/`, `exports/`, the dataset folder itself, other datasets, or the `audit` container
- [ ] After the publish rename, an unexpired owner SAS cannot read or modify the frozen files
- [ ] A new version renames the frozen folder back to `data/`, and a fresh owner SAS can edit it
- [ ] An owner deleting `data/` is recovered by the backend on the next SAS request
- [ ] Writes with an unexpired SAS after deletion or locking are caught by the reconciliation script
- [ ] Storage Explorer can attach using a directory SAS URL
- [ ] Published containers cannot be modified or deleted after immutability is applied
