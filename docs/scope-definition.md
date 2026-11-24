# Envision Portal: Scope Definition

## 1. Purpose

This document defines what the Envision Portal will and will not deliver, who it serves, the milestones through 2029, and the assumptions, constraints and risks that bound the work.

## 2. Background

Eye imaging datasets, such as optical coherence tomography (OCT), OCT angiography (OCTA), fundus photography and fluorescence lifetime imaging ophthalmoscopy (FLIO), are central to research on eye disease and on brain-related disorders such as Alzheimer's disease and dementia. They are also critical for developing AI-based diagnostic methods. Researchers struggle to find and reuse these datasets because they are scattered across repositories, rarely standardized, and often not documented well enough for AI development.

The Envision Portal is a cloud-based, open-source platform for sharing and discovering FAIR (Findable, Accessible, Interoperable, Reusable) and AI-ready eye imaging datasets. It is developed as part of the Eye ACT project, funded by the National Institute on Aging (NIA) at the National Institutes of Health (NIH) through 2029, with additional Azure cloud credits from the Microsoft AI for Good Lab.

## 3. Objectives

1. Support and simplify sharing of FAIR and AI-ready eye imaging data (OCT, OCTA, fundus photography, FLIO) with related clinical data such as demographics and diagnoses.
2. Provide convenient access to the shared datasets.
3. Act as a registry for eye imaging datasets, including those hosted elsewhere, to make them easier to discover.
4. Enable dataset citation, usage tracking and contributor recognition.
5. Support data access models that protect participant privacy and meet consent and compliance requirements.

### Success measures

| Area         | Measure                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| Data sharing | Number of datasets shared over time, number of contributors, average FAIR score          |
| Data reuse   | Views, downloads, citations, API calls, unique users requesting access                   |
| Discovery    | Number of external datasets indexed                                                      |
| Trust        | Alignment with the TRUST principles; CoreTrustSeal certification as the platform matures |

These metrics are shown publicly on the portal's metrics page.

## 4. Stakeholders and users

| Group                     | Role                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Data contributors         | Researchers, clinicians, institutions and consortia who prepare and share datasets     |
| Data users                | Researchers, AI/ML developers and students who find, assess, access and reuse datasets |
| Dataset owners and admins | Contributors who manage dataset members and approve controlled-access requests         |
| Project leadership        | Eye ACT principal investigators; set direction and approve scope                       |
| Development team          | Builds and operates the platform                                                       |
| Funders                   | NIH/NIA (Eye ACT grant), Microsoft AI for Good Lab (Azure credits)                     |
| Partners                  | AD Data Initiative (ADDI) for federated learning; other repositories for indexing      |

## 5. Scope

Status key: **Delivered** = running in production code today; **In progress** = partially built; **Planned** = not started.

### 5.1 In scope

#### Data contribution

| Capability                                                                                                                        | Status      | Target  |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------- |
| Account creation with email verification                                                                                          | Delivered   |         |
| Create a dataset; invite collaborators with owner, admin, editor or viewer roles                                                  | Delivered   |         |
| Upload data directly to cloud storage with time-limited upload links                                                              | Delivered   |         |
| Enter study and dataset metadata, README, changelog, license and Healthsheet                                                      | Delivered   |         |
| Publish a dataset version, with metadata files generated automatically                                                            | Delivered   |         |
| Choose an access level when publishing (open or controlled)                                                                       | Delivered   |         |
| Publish new versions of an existing dataset                                                                                       | In progress | 2026–27 |
| Assign a DataCite DOI to each published dataset and version (placeholder DOIs are issued today)                                   | In progress | 2026–27 |
| Bulk upload/download through Microsoft Storage Explorer, or a desktop app if needed                                               | In progress | 2026–27 |
| Automated tools to standardize data to the Clinical Dataset Structure (CDS), including conversion from proprietary device formats | Planned     | 2026–29 |
| Automated detection and removal of personal health information (PHI), including dates                                             | Planned     | 2026–27 |
| Validation of data structure, metadata, OMOP and DICOM files, and PHI removal                                                     | Planned     | 2026–28 |
| Data collection tracking dashboard for contributors                                                                               | Planned     | 2026–28 |

#### Data discovery and access

| Capability                                                                           | Status      | Target  |
| ------------------------------------------------------------------------------------ | ----------- | ------- |
| Dataset landing pages with metadata, file structure and access conditions            | Delivered   |         |
| Browse datasets and filter shared vs. external datasets                              | Delivered   |         |
| Filter datasets by imaging modality                                                  | In progress | 2026–27 |
| Index external datasets hosted on other repositories                                 | Delivered   |         |
| Open-access download with time-limited read-only links                               | Delivered   |         |
| Controlled-access requests with owner approval and signed data use agreements        | Delivered   |         |
| Public usage metrics for each dataset and for the platform                           | Delivered   |         |
| Automated pipeline that finds and indexes eye imaging datasets on other repositories | Delivered   |         |
| Advanced text search and filtering (subject features, data type, device)             | Planned     | 2027–28 |
| LLM-powered natural-language search                                                  | Planned     | 2027–28 |
| Public API for AI/ML pipelines                                                       | Planned     | 2027–28 |
| In-browser previews of CSV, XLSX, DICOM, BMP and image files                         | Planned     | 2027–28 |
| Federated learning with ADDI, so data can be used without download                   | Planned     | 2026–29 |

#### Platform and project

| Capability                                                                    | Status      | Target  |
| ----------------------------------------------------------------------------- | ----------- | ------- |
| Staging and production environments with automated deployment                 | Delivered   |         |
| User, developer, design and API documentation                                 | In progress | Ongoing |
| Alignment with the TRUST principles and FAIR principles for research software | In progress | Ongoing |
| Full security validation before open, independent data submission             | Planned     | 2028–29 |
| Community contribution guidelines                                             | Planned     | 2028–29 |
| Source code archived on Zenodo with a DOI for each major version              | Planned     | Ongoing |

### 5.2 Out of scope

- Storing identifiable clinical records or acting as a clinical system of record.
- Data types other than eye imaging and its related clinical data, unless added in a later scope revision (support for data from projects beyond Eye ACT is reviewed in 2027–28).
- Paid storage, paid downloads or automated billing before 2028–29.
- Running general-purpose compute or AI training on behalf of users, other than through the planned ADDI federated-learning integration.
- Hosting copies of external datasets. External datasets are indexed with metadata and a link only.

## 6. Deliverables and milestones

| Period           | Focus                    | Key deliverables                                                                                                                                           |
| ---------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Year 1 (2024–25) | Foundations              | Functional requirements, technical architecture, data standards (CDS, DICOM, OMOP), wireframes, base code, GitHub and Azure setup                          |
| Year 2 (2025–26) | Data access and launch   | Data storage, publishing, landing pages, access process, DOI work; first standardized dataset; ~10 external datasets indexed; public launch; documentation |
| Year 3 (2026–27) | Contribution tools       | Upload, management, standardization and sharing workflows; PHI detection and removal; versioning; automated external indexing; federated learning approach |
| Year 4 (2027–28) | Advanced access          | Controlled-data request improvements, advanced search, AI/ML API, file previews, DICOM tools, initial federated learning; datasets from outside the team   |
| Year 5 (2028–29) | Scale and sustainability | Self-service submission, full security validation, completed federated learning, contribution guidelines, repository recognition, sustainability plan      |

## 7. Assumptions

- NIH funding continues through 2029 and Azure credits cover hosting during that period.
- Contributors are responsible for having the consent and approvals required to share their data.
- Microsoft Azure remains the cloud provider.
- The platform is free to use for sharing, finding and accessing datasets during the grant period.
- External services (ORCID, ROR) remain available.

## 8. Constraints

- **Budget:** NIH grant funding and Microsoft Azure credits; open-source and free tools are preferred.
- **Licensing:** all platform code is open source under the MIT license, so third-party components must be MIT-compatible.
- **Team:** a small development team; the architecture favors one language stack (TypeScript) and simple operations.
- **Standards:** datasets must follow the CDS, with DICOM imaging and OMOP-formatted clinical data.
- **Policy:** must align with NIH data sharing and security policies and CALMI2 institutional IT policy.

## 9. Dependencies

| Dependency                     | Used for                                            |
| ------------------------------ | --------------------------------------------------- |
| Microsoft Azure                | VMs, Data Lake and Blob storage, Container Registry |
| Cloudflare                     | DNS and traffic proxy                               |
| GitHub and GitHub Actions      | Source control, CI/CD, deployment secrets           |
| ORCID, ROR, SPDX               | Contributor, organization and license metadata      |
| External dataset index service | Dataset index information by DOI                    |
| SMTP email provider            | Verification and invitation emails                  |
| DataCite                       | Dataset DOIs (integration in progress)              |
| AD Data Initiative (ADDI)      | Federated learning (planned)                        |

## 10. Scope risks

| Risk                                                                                                    | Impact | Mitigation                                                                                           |
| ------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Data classification is undecided, so contributors could upload PHI before de-identification tools exist | High   | Decide classification (see open items); require de-identified uploads in the terms until tools exist |
| Small team relative to a five-year feature list                                                         | Medium | Prioritize by year; defer features rather than compromise security work                              |
| Funding ends in 2029                                                                                    | Medium | Sustainability plan with federal, philanthropic and cloud-sponsor funding                            |
| LLM features produce inaccurate search results or misclassify external datasets                         | Medium | Confidence thresholds and human review before indexing                                               |
| Dependence on Azure credits for hosting costs                                                           | Medium | Track spend; apply for continued cloud sponsorship                                                   |

## 11. Open items

| #   | Item                                                                                                     | Owner |
| --- | -------------------------------------------------------------------------------------------------------- | ----- |
| 1   | Data classification: de-identified only, or a limited data set that may contain PHI                      | _TBD_ |
| 2   | Language for the planned data standardization service (TypeScript, or Python to reuse `pyfairdatatools`) | _TBD_ |
| 3   | Document owner and approvers                                                                             | _TBD_ |
