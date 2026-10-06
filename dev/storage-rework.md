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

- Hierarchical namespace (ADLS Gen2) **enabled at creation** (cannot be turned off later)
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

`{datasetId}` is the dataset's database record ID. IDs must **never be reused**, so an old SAS token or leftover folder can never match a future dataset.

```
stenvisionstudy{env}                     (HNS)
├── datasets/
│   └── {datasetId}/                     backend only
│       ├── data/                        owner uploads (the only path users can access)
│       ├── documents/                   dataset documentation (README, data dictionary, etc.)
│       ├── manifests/
│       │   └── v{n}.json                publish manifest per version
│       ├── previews/                    generated thumbnails and previews
│       └── exports/                     metadata exports
└── audit/
    └── {yyyy}/{mm}/                     access log exports (spans datasets)

stenvisionpub{env}                       (flat)
└── {datasetId}-v{n}/                    one container per published version
    ├── data/
    ├── documents/
    └── manifest.json
```

| Account   | Container          | Created by      | Notes                                                                   |
| --------- | ------------------ | --------------- | ----------------------------------------------------------------------- |
| Study     | `datasets`         | Setup (once)    | App creates `{datasetId}/` and its subfolders when a dataset is created |
| Study     | `audit`            | Setup (once)    | Kept separate so audit logs are never removed with a dataset            |
| Published | `{datasetId}-v{n}` | App, on publish | Contains `data/`, `documents/`, and `manifest.json`                     |

`documents/` is managed by the backend (through the UI). If owners need to upload documents directly through Storage Explorer, either place them under `data/` or issue a separate directory SAS for `documents/`.

Container names must be 3 to 63 characters of lowercase letters, numbers, and hyphens, starting with a letter or number, with no consecutive hyphens. Database IDs fit within these rules.

## Access Model

All SAS tokens are **service SAS**, signed with the storage account key (key1).

| Use                  | Scope                                             | Permissions                                   | Lifetime           |
| -------------------- | ------------------------------------------------- | --------------------------------------------- | ------------------ |
| Dataset owner upload | Directory (`sr=d`) on `datasets/{datasetId}/data` | `racwdl` (add `m` only if renames are needed) | 8 to 24 hours      |
| Requester download   | Container on `{datasetId}-v{n}`                   | `rl`                                          | 24 hours to 7 days |

Rules:

- **Owner SAS always targets `datasets/{datasetId}/data`, never `datasets/{datasetId}`.** A token scoped one level higher would let owners modify or delete manifests, documents, and previews. The SAS function hardcodes the `/data` suffix rather than accepting a path, and this is covered by a test.
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

1. Create the dataset record in the database.
2. Create `datasets/{datasetId}/` and its subfolders (`data/`, `documents/`, `manifests/`, `previews/`, `exports/`) in the study account.

### Upload access

1. Check the dataset is active (not deleted, frozen, or published).
2. Ensure `datasets/{datasetId}/data/` exists, recreating it if the owner deleted it.
3. Issue a directory-scoped SAS for `datasets/{datasetId}/data`.
4. Owner pastes the SAS URL into Azure Storage Explorer and manages files.

Because the SAS is scoped to `data/`, owners can delete files inside it (or `data/` itself) but can never delete the dataset folder or its sibling folders.

### Delete dataset

1. Mark the dataset deleted in the database (stops new SAS).
2. Delete `datasets/{datasetId}/` immediately or after a short grace period. On HNS this is a single atomic directory delete.
3. If any version was published, the manifest is already preserved in the published container as `manifest.json`.
4. The reconciliation script removes any files written afterward by an unexpired SAS.

Deletion is permanent. Dataset owners are expected to keep local copies, and the UI states this.

### Publish dataset

1. Freeze the dataset (stop issuing write SAS).
2. Wait out the maximum SAS lifetime, or build the manifest from a known point in time so late writes are excluded.
3. Write the manifest to `datasets/{datasetId}/manifests/v{n}.json`, covering both `data/` and `documents/`.
4. Create `{datasetId}-v{n}` in the published account.
5. Server-side copy (AzCopy or Copy Blob From URL) of `data/` and `documents/` into the published container, so file data never passes through the app.
6. Copy the manifest into the published container as `manifest.json`, so requesters can verify their download.
7. Verify the copy against the manifest.
8. Apply the immutability policy.
9. Mark the version published.

Empty directories in the study account do not carry over, since flat storage has no real directories. If an empty folder is meaningful, add a placeholder file (such as `.keep`) or record it in the manifest.

### Requester access

1. Requester is approved and a grant is recorded (who, which version, expiry per data use agreement).
2. Requester clicks "Access data" in the portal.
3. Backend checks the grant and issues a read-only SAS for the version container.

## Maintenance Scripts

Automations are handled by scripts run manually rather than Azure-specific services.

- **Reconciliation:** list top-level folders in `datasets` and remove any whose dataset is not active in the database. Run periodically and after deletes or publishes. This catches files written by an unexpired SAS after a dataset was deleted or frozen.
- **Publish verification:** compare a published container against its `manifest.json`.
- **Key rotation:** switch the backend to key2, then regenerate key1 on the affected account. This invalidates every SAS signed with key1. Active users then request fresh links from the UI. Use this if a token or key leaks, and optionally on a regular schedule.

## Notes

- Azure lifecycle management rules filter by path prefix from the start of the container, so a rule cannot target "every dataset's `previews/` folder". If per-type retention or tiering is ever needed, those folders would need to move into their own containers.

## Implementation Checklist

### Setup (per environment)

- [ ] Study storage account with hierarchical namespace enabled
- [ ] Published storage account with versioning and version-level immutability
- [ ] `datasets` and `audit` containers in study account
- [ ] Anonymous access disabled on both accounts
- [ ] Account keys stored as backend secrets (signing with key1)

### Backend

- [ ] Dataset creation creates `datasets/{datasetId}/` with all subfolders
- [ ] Single function for study SAS generation (directory-scoped service SAS, hardcoded to `datasets/{datasetId}/data`)
- [ ] `data/` recreated before issuing SAS if missing
- [ ] SAS issuance blocked for deleted, frozen, and published datasets
- [ ] Delete flow (DB flag, then delete `datasets/{datasetId}/`)
- [ ] Publish flow (freeze, manifest, copy `data/` and `documents/`, copy manifest, verify, immutability)
- [ ] Requester grants table and read-only SAS endpoint

### Scripts

- [ ] Reconciliation script
- [ ] Publish verification script
- [ ] Key rotation script

### Pre-launch tests

- [ ] An owner SAS for `datasets/{datasetId}/data` cannot list, read, or write `documents/`, `manifests/`, `previews/`, `exports/`, the dataset folder itself, other datasets, or the `audit` container
- [ ] An owner deleting `data/` is recovered by the backend on the next SAS request
- [ ] Writes with an unexpired SAS after deletion are caught by the reconciliation script
- [ ] Storage Explorer can attach using a directory SAS URL
- [ ] Published containers cannot be modified or deleted after immutability is applied
