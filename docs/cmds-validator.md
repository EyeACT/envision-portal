# CMDS Validator

In-browser checker for the Clinical Dataset Structure (CMDS). Users pick a local folder; files stay on the device and are never uploaded.

## Where to use it

- Dataset sidebar: **CMDS Validator**
- Route: `/app/datasets/{datasetId}/validator`
- Also linked from **Data Upload** (step 2)

Chrome and Edge use the File System Access API (permission is to *view* the folder). Other browsers fall back to a directory file input.

## What stage 1 checks

Path and filename rules only:

- Required root metadata (`README.md`, `LICENSE.txt`, `CHANGELOG.md`, `healthsheet.md`, JSON description files, `participants.tsv` / `participants.json`)
- Datatype folders and `a-z0-9_` naming
- Nested layout: `datatype / modality / device / participant`
- `clinical_data` may be a flat OMOP folder (no `manifest.tsv`)
- `participants.tsv` is required by default (Advanced options can turn this off)
- Folder IDs are cross-checked against `person_id` or `participant_id` when that file can be parsed

After a scan, the page lists datatypes, modalities, devices, sorted participant IDs, and a filterable issue list.

Metadata *content* (JSON schemas, TSV column flags, etc.) is not validated yet (stage 2).

## Code

| File | Role |
|---|---|
| [`shared/utils/cmdsValidator.ts`](../shared/utils/cmdsValidator.ts) | Stage 1 validation |
| [`shared/utils/cmdsConfig.ts`](../shared/utils/cmdsConfig.ts) | Allow-lists and required files |
| [`shared/utils/validatorTypes.ts`](../shared/utils/validatorTypes.ts) | Result types |
| [`app/pages/app/datasets/[datasetId]/validator.vue`](../app/pages/app/datasets/[datasetId]/validator.vue) | UI |

Spec: [CDS specification](https://cds-specification.readthedocs.io/en/latest/)
