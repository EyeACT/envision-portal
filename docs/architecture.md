# Envision Portal architecture

Envision Portal is a Nuxt application deployed with [Kamal](https://kamal-deploy.org) to Azure VMs. GitHub Actions builds and deploys everything. A separate task-queue worker handles long-running dataset work, such as publishing.

- [Environments](#environments)
- [CI/CD pipeline](#cicd-pipeline)
- [Runtime topology](#runtime-topology)
- [Dataset publishing flow](#dataset-publishing-flow)
- [Published dataset layout](#published-dataset-layout)
- [Planned architecture](#planned-architecture)

The first four sections describe what is deployed today. The last section describes planned components that the code doesn't have yet.

## Environments

There are three environments. Each one has its own Postgres database and its own Azure Storage accounts, one for drafts and one for published data.

| Environment | App runs on                       | Deployed by                               | Git trigger       |
| ----------- | --------------------------------- | ----------------------------------------- | ----------------- |
| `dev`       | Developer machine (`pnpm dev`)    | Nobody; it runs locally                   | none              |
| `stg`       | Azure VMs (app, worker, database) | `deploy-stg.yml`, `deploy-worker-stg.yml` | push to `staging` |
| `prd`       | Azure VMs (app, worker, database) | `deploy-prd.yml`, `deploy-worker-prd.yml` | push to `main`    |

```mermaid
flowchart LR
    subgraph DEV["dev"]
        direction TB
        devApp["Nuxt dev server<br/>developer machine"]
        devDb[("Postgres<br/>dev")]
        devStore[["Azure Storage<br/>dev draft + published"]]
        devApp --> devDb
        devApp --> devStore
    end

    subgraph STG["stg"]
        direction TB
        stgApp["App VM"]
        stgWorker["Worker VM"]
        stgDb[("DB VM<br/>Postgres")]
        stgStore[["Azure Storage<br/>stg draft + published"]]
        stgApp --> stgDb
        stgWorker --> stgDb
        stgApp --> stgStore
        stgWorker --> stgStore
    end

    subgraph PRD["prd"]
        direction TB
        prdApp["App VM"]
        prdWorker["Worker VM"]
        prdDb[("DB VM<br/>Postgres")]
        prdStore[["Azure Storage<br/>prd draft + published"]]
        prdApp --> prdDb
        prdWorker --> prdDb
        prdApp --> prdStore
        prdWorker --> prdStore
    end

    staging(["branch: staging"]) -.->|GitHub Actions| STG
    main(["branch: main"]) -.->|GitHub Actions| PRD
```

## CI/CD pipeline

Every deploy runs `kamal setup` from a GitHub Actions runner. Kamal builds the image for `amd64`, pushes it to Azure Container Registry, then connects to the target VM over SSH as `azureuser`, where the VM pulls the image and swaps containers. Secrets come from the GitHub environment (`prd` or `stg`) and reach the containers through `.kamal/secrets`.

```mermaid
flowchart LR
    dev(["Developer"]) -->|push| gh["GitHub repo"]

    gh -->|"push main / staging<br/>or manual dispatch"| wfApp["deploy-prd.yml<br/>deploy-stg.yml"]
    gh -->|"push main / staging<br/>only when worker files change"| wfWorker["deploy-worker-prd.yml<br/>deploy-worker-stg.yml"]
    gh -->|manual dispatch| wfProxy["kamal-proxy-reboot-prd.yml<br/>kamal-proxy-reboot-stg.yml"]
    cron(["Daily 08:00 UTC cron"]) --> wfMetrics["metrics-snapshot.yml<br/>matrix: prd, stg"]

    subgraph GHA["GitHub Actions runner"]
        wfApp -->|"kamal setup<br/>config/deploy.yml<br/>Dockerfile"| kamalApp["Kamal"]
        wfWorker -->|"kamal setup<br/>config/deploy-worker.yml<br/>Dockerfile.task-queue"| kamalWorker["Kamal"]
        wfProxy -->|kamal proxy reboot| kamalProxy["Kamal"]
        wfMetrics -->|pnpm metrics:snapshot| metricsScript["compute-metrics-snapshot.ts"]
    end

    secrets[["GitHub environment secrets<br/>prd / stg"]] -.-> GHA

    kamalApp -->|build + push image| acr[["Azure Container Registry"]]
    kamalWorker -->|build + push image| acr

    kamalApp -->|SSH| appVm["App VM"]
    kamalProxy -->|SSH| appVm
    kamalWorker -->|SSH| workerVm["Worker VM"]

    acr -->|pull image| appVm
    acr -->|pull image| workerVm

    metricsScript -->|"writes MetricsSnapshot row"| db[("Postgres<br/>DB VM")]
```

## Runtime topology

This shows one deployed environment (`stg` and `prd` look the same). Cloudflare proxies traffic to `kamal-proxy`, which terminates TLS with a Let's Encrypt certificate and forwards to the Nuxt container on port 3000.

```mermaid
flowchart TB
    user(["Browser"])
    extClient(["External API client<br/>EXTERNAL_API_KEY"])

    user -->|HTTPS| cf
    extClient -->|HTTPS| cf

    cf["Cloudflare<br/>DNS + proxy"]

    subgraph AZ["Azure"]
        subgraph APPVM["App VM"]
            proxy["kamal-proxy<br/>TLS via Let's Encrypt<br/>healthcheck: /up"]
            app["Nuxt app container<br/>:3000<br/>pages + server/api"]
            proxy -->|HTTP :3000| app
        end

        subgraph WORKERVM["Worker VM"]
            worker["Task queue worker container<br/>process-task-queue.ts --watch<br/>no proxy"]
        end

        subgraph DBVM["DB VM"]
            db[("Postgres container")]
        end

        subgraph STORAGE["Azure Storage"]
            draft[["Draft account<br/>Data Lake Gen2<br/>filesystem: datasets"]]
            published[["Published account<br/>Blob, one container<br/>per dataset version"]]
        end

        acr[["Azure Container Registry"]]
    end

    cf -->|HTTPS| proxy

    app -->|Prisma| db
    worker -->|"Prisma<br/>claims Task rows"| db

    app -->|"folders, freeze/unfreeze,<br/>upload SAS URLs"| draft
    app -->|"list files,<br/>read-only SAS URLs"| published
    worker -->|read frozen data| draft
    worker -->|"copy data,<br/>write metadata files"| published

    user -.->|"direct upload/download<br/>with SAS URL"| draft
    user -.->|download with SAS URL| published

    acr -.->|image pull on deploy| app
    acr -.->|image pull on deploy| worker

    subgraph EXT["External services"]
        smtp["SMTP server<br/>nodemailer"]
        orcid["ORCID API"]
        ror["ROR API"]
        spdx["SPDX license list"]
        scholar["scholardata.io<br/>dataset index"]
    end

    app -->|"verification + invitation email"| smtp
    app --> orcid
    app --> ror
    app --> spdx
    app --> scholar
```

## Dataset publishing flow

The web app doesn't publish a dataset itself. It queues a `Task` row, and the worker on its own VM claims that row and runs it. The worker sends a heartbeat while it runs a task, and requeues any task whose heartbeat goes stale, so a worker restart doesn't lose work. Task types are `publish-dataset`, `rebuild-frozen-data` and `purge-draft`.

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Dataset owner
    participant App as Nuxt app
    participant DB as Postgres
    participant Worker as Task queue worker
    participant Draft as Draft storage
    participant Pub as Published storage

    Owner->>App: POST /datasets/:id/publish/finalize
    App->>Draft: Freeze draft data
    App->>DB: Insert Task (publish-dataset, pending)
    App-->>Owner: Publishing started

    loop Poll for work
        Worker->>DB: Requeue stale running tasks
        Worker->>DB: Claim next pending task (status = running)
    end

    Worker->>DB: Load dataset + metadata
    Worker->>DB: Publishing status: indexing-dataset
    Worker->>Draft: List frozen files
    Worker->>DB: Publishing status: moving-dataset-to-published-storage
    Worker->>Pub: Copy files into new version container
    Worker->>DB: Publishing status: generating-uploading-metadata-files
    Worker->>Pub: Upload README, LICENSE, CHANGELOG,<br/>dataset_description, study_description, healthsheet
    Worker->>DB: Publishing status: registering-dataset
    Worker->>DB: Transaction: create PublishedDataset, mark dataset published
    Worker->>DB: Task completed, publishing status: completed

    Owner->>App: Poll publishing status
    App->>DB: Read DatasetPublishingStatus
    App-->>Owner: Progress / completed
```

## Published dataset layout

Each published dataset version follows the Clinical Dataset Structure (CDS). Metadata files sit at the root, with one folder per data type. Clinical data is stored as OMOP CDM tables in CSV files. Each imaging data type is split by modality, then device, then participant, and the image files are DICOM.

```mermaid
flowchart LR
    root["dataset/"]

    subgraph META["Metadata files at the root"]
        direction TB
        m1["README.md · CHANGELOG.md · LICENSE.txt · healthsheet.md"]
        m2["dataset_description.json · study_description.json"]
        m3["participants.tsv · participants.json"]
        m4["dataset_structure_description.json"]
    end

    subgraph TYPES["One folder per data type"]
        direction TB
        clinical["clinical_data/"]
        imaging["retinal_oct/ · retinal_octa/<br/>retinal_flio/ · retinal_photography/"]
    end

    root --> META
    root --> TYPES

    clinical --> omop["OMOP tables<br/>person.csv · observation.csv · measurement.csv"]
    imaging --> modality["Modality<br/>enface/ · flow_cube/ · segmentation/<br/>+ manifest.tsv"]
    modality --> device["Device<br/>topcon_maestro2/ · topcon_triton/ · zeiss_cirrus/"]
    device --> participant["Participant<br/>101/ · 102/ · 103/"]
    participant --> dicom["DICOM files<br/>101xyz.dcm"]
```

## Planned architecture

In the diagram below, dashed boxes are planned and don't exist in the code yet; solid boxes are deployed today.

These are the planned additions to the current architecture:

| Component                                                      | Purpose                                                                     | Target             |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------ |
| Python service using `pyfairdatatools`                         | Standardizes data and metadata to the CDS; runs AI and bioinformatics tasks | 2026–27 onward     |
| Meilisearch, Community Edition                                 | Text search indexes for data discovery                                      | 2027–28            |
| Open-source LLM, such as Llama 3                               | Smart search, and classifying datasets found in external repositories       | 2026–27 onward     |
| External dataset discovery pipeline                            | Finds eye imaging datasets in other repositories and indexes them           | 2026–27            |
| DOI minting                                                    | Gives a DOI to each published dataset and version                           | 2025–27            |
| Microsoft Storage Explorer, later possibly a Tauri desktop app | Bulk data upload and download                                               | 2026–27, if needed |
| Public data API                                                | Lets AI/ML pipelines use datasets directly                                  | 2027–28            |
| Federated learning, with ADDI                                  | Model training without moving data                                          | 2026–29            |

Background tasks run in TypeScript (`scripts/process-task-queue.ts`), so the app and the worker share one language stack, along with the Prisma schema and server utilities. The original design called for these tasks to run as long-running Python apps.

```mermaid
flowchart TB
    user(["Data contributor / data user"])
    aiClient(["AI/ML pipeline"])
    cf["Cloudflare"]

    subgraph AZ["Azure"]
        subgraph APPVM["App VM"]
            proxy["kamal-proxy"]
            app["Nuxt app<br/>UI + Nitro API"]
        end

        subgraph WORKERVM["Worker VM"]
            worker["Task queue worker"]
        end

        db[("Postgres")]
        draft[["Draft Data Lake"]]
        published[["Published storage"]]

        pyService["Python service<br/>pyfairdatatools<br/>FAIRification, PHI removal,<br/>validation, AI tasks"]
        search["Meilisearch"]
        llm["Open-source LLM<br/>e.g. Llama 3"]
        discovery["External dataset<br/>discovery pipeline"]
        fl["Federated learning<br/>with ADDI"]
    end

    mse["Microsoft Storage Explorer<br/>or Tauri desktop app"]
    doi["DOI registration"]

    subgraph REPOS["External repositories"]
        repos["Mendeley Data · Zenodo<br/>Figshare · DataCite"]
    end

    user --> cf --> proxy --> app
    aiClient -->|data API| cf
    app --> db
    worker --> db
    app --> draft
    worker --> draft
    worker --> published

    user -.-> mse
    mse -.->|bulk upload / download| draft
    app -.->|text + smart search| search
    app -.->|smart search queries| llm
    worker -.->|standardize + validate| pyService
    pyService -.-> draft
    worker -.->|mint DOI on publish| doi
    worker -.->|index published datasets| search
    fl -.-> published

    repos -.->|API scraper| discovery
    discovery -.->|"is it an eye imaging dataset?"| llm
    discovery -.->|"confident, or approved<br/>in human review"| db
    db -.-> search

    classDef planned stroke-dasharray: 5 5
    class pyService,search,llm,discovery,fl,mse,doi,repos planned
```

### External dataset discovery pipeline

```mermaid
flowchart LR
    repos[("Known repositories / registries<br/>Mendeley Data, Zenodo,<br/>Figshare, DataCite")]
    scraper["API scraper"]
    meta["Metadata<br/>title, description, keywords, ..."]
    llm["Instruct LLM<br/>~2B parameters"]
    isEye{"Eye imaging<br/>dataset?"}
    confident{"Confident?"}
    review["Human review"]
    db[("Envision Portal DB")]

    repos --> scraper --> meta --> llm --> isEye
    isEye -->|yes| confident
    confident -->|yes| db
    confident -->|no| review
    review -->|approved| db
```
