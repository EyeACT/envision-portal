# External dataset image analysis import

`scripts/import-image-analysis.ts` adds image classifier and file census results to
external published datasets (the ones found by the discovery pipeline). The results
are meant to be shown on the dataset page, to help people decide whether an external
dataset is worth following up.

```sh
pnpm scripts:import:image-analysis                 # dry run, prints what would change
pnpm scripts:import:image-analysis --apply         # writes to the database
pnpm scripts:import:image-analysis <dir> --apply   # CSVs somewhere other than .dev.local/extraction-csv
```

The script can be re-run safely. It updates rows in place.

## Source data

The extraction pipeline produced these files in `.dev.local/extraction-csv/`:

| File                                       | Used | Notes                                                                             |
| ------------------------------------------ | ---- | --------------------------------------------------------------------------------- |
| `figshare_v3full_eye_records_enriched.csv` | Yes  | 706 records                                                                       |
| `zenodo_v3full_eye_records_enriched.csv`   | Yes  | 248 records                                                                       |
| `v3full_filetype_census_by_record.csv`     | No   | Same census as `file_type_counts` in the enriched files, one column per extension |
| `v3full_image_filetypes_by_modality.csv`   | No   | Totals across all records, nothing per dataset                                    |

## What we store

**`PublishedDatasetModality`**: one row per eye imaging type found in the dataset.

| Field               | From the CSV                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `modality`, `label` | `present_eye_classes` (see the mapping below)                                                                 |
| `fileCount`         | `n_<class>` when every image was classified, otherwise `est_<class>` (scaled up from the sample)              |
| `fileCountComplete` | `true` only when every image was classified and the download was complete                                     |
| `fileExtensions`    | Image extensions in the record. Filled only when there is a single modality, because the census is per record |
| `detectionMethod`   | `image-classifier-v3full`                                                                                     |

| Classifier class | `modality`                 | Label                              |
| ---------------- | -------------------------- | ---------------------------------- |
| CFP              | `color_fundus_photography` | Color Fundus Photography           |
| IR               | `infrared_reflectance`     | Infrared Reflectance (IR)          |
| PSC              | `pseudo_color_fundus`      | Pseudo-color Fundus (UWF)          |
| FAF              | `fundus_autofluorescence`  | Fundus Autofluorescence (FAF)      |
| OCT              | `oct`                      | Optical Coherence Tomography (OCT) |
| OCTA             | `octa`                     | OCT Angiography (OCTA)             |

We use `present_eye_classes` rather than every class with a count above zero. The
classifier applies a threshold there, so for example 2 CFP images among 300 OCT images
are not listed as a CFP dataset.

**`PublishedDatasetFileSummary`**: a new table with one row per dataset, describing
what the record contains.

| Field            | From the CSV          | Why someone browsing cares                                                      |
| ---------------- | --------------------- | ------------------------------------------------------------------------------- |
| `imageFileCount` | `n_image_files`       | Counts images inside archives. A record listed as "2 files" can hold 30k images |
| `fileTypeCounts` | `file_type_counts`    | Shows the formats (DICOM, TIFF, MAT, ...) and whether they can be used          |
| `maskFileCount`  | `n_MASK` / `est_MASK` | Shows whether segmentation masks or annotations are included                    |
| `itemType`       | `item_type`           | Figshare only. Shows that a "dataset" is really a single figure or video        |

`fileTypeCounts` drops entries that are not real extensions (folder names, `ds_store`,
`(no extension)`, and so on) that the census picked up.

The new table is separate rather than part of `PublishedDataset.data`, because the
discovery sync reposts external datasets and overwrites `data` each time. The sync only
replaces modalities when it sends some, and it does not send any yet.

## What we skip

| CSV columns                                                                                             | Why                                                                                      |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `title`, `doi`, `url`, `license`, `access`                                                              | The dataset already has these from the discovery sync                                    |
| `repository`, `record_id`                                                                               | Used for matching only. The external URL already points at the record                    |
| `n_NEG`, `n_UNCERTAIN`, `eye_image_fraction`                                                            | Classifier details that don't help a person decide                                       |
| `dominant_eye_class`                                                                                    | Can be worked out from the modality with the highest `fileCount`                         |
| `sampling_pass`, `sampling_mode`, `triage_cap`, `remote_cap`, `max_images`, `n_sampled`, `n_classified` | How the pipeline ran                                                                     |
| `census_zips_read`, `census_zips_unreadable`, `census_tar_sampled_files`, `census_error`, `status`      | Pipeline diagnostics. They only feed into `fileCountComplete`                            |
| `model_onnx_sha256`, `finished_at`                                                                      | Provenance. The version is kept in `detectionMethod`                                     |
| `census_n_files`, `ft_*`                                                                                | Covered by `fileTypeCounts`                                                              |
| `excluded_non_ocular`, `exclusion_reason`                                                               | Records flagged as not eye imaging are skipped. None of them matched an existing dataset |

## Matching

Only datasets with `external = true` are read or written. A CSV row matches a dataset
by any of these:

- exact DOI
- Zenodo record id (from the URL or a `10.5281/zenodo.<id>` DOI)
- Figshare article id (from the URL, a `10.6084/m9.figshare.<id>.vN` DOI or `record_id`)

DOI version suffixes are **not** stripped in general. Publishers like Optica use
`.v001` / `.v006` as part of the item id, so stripping them merges different records.

Some records are registered twice, once from Figshare and once from Datacite. Both
copies get the data.

Results of the first run (2026-11-19):

- 954 CSV records, 633 matched 693 external datasets
- 746 modality rows: OCT 355, CFP 259, OCTA 60, IR 36, pseudo-color 28, FAF 8
- 321 records have no external dataset in the portal. Many are not eye imaging at all
  (pottery, museum objects). The script reports and skips them. It does not create datasets,
  because the CSV has no description or authors.
