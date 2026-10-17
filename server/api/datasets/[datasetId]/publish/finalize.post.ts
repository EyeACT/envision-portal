import PublishingStatus from "~/assets/data/publishing-status.json";
import {
  validateDatasetMetadata,
  validateStudyMetadata,
} from "#shared/utils/validations";
import type { PublishDatasetPayload } from "#shared/types/tasks";

const parseRecords = (section: any): any[] => {
  if (!section) return [];
  const parsed = typeof section === "string" ? JSON.parse(section) : section;
  return parsed.records || [];
};

const getPublishingStatusIndex = (status: string) => {
  const statusObject =
    PublishingStatus[status as keyof typeof PublishingStatus];

  return statusObject?.index;
};

export default defineEventHandler(async (event) => {
  const { environment } = useRuntimeConfig().public;

  const member = await datasetMinAdminPermission(event);
  const { userId } = member;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetHealthsheet: true,
      StudyIdentification: true,
    },
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId,
        },
      },
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  let publishingStatusIndex = getPublishingStatusIndex("preparing");

  const publishingStatus = await prisma.datasetPublishingStatus.findUnique({
    where: {
      datasetId,
    },
  });

  if (!publishingStatus) {
    await prisma.datasetPublishingStatus.create({
      data: {
        comment: "",
        currentFileNumber: 0,
        datasetId,
        fileCount: 0,
        status: publishingStatusIndex,
      },
    });
  } else {
    await prisma.datasetPublishingStatus.update({
      data: {
        comment: "",
        currentFileNumber: 0,
        fileCount: 0,
        status: publishingStatusIndex,
      },
      where: {
        datasetId,
      },
    });
  }

  // Start the publish process

  // 1. Validate the dataset metadata

  publishingStatusIndex = getPublishingStatusIndex(
    "validating-dataset-metadata",
  );

  if (environment !== "development") {
    const datasetValidation = await validateDatasetMetadata(datasetId, userId);

    if (!datasetValidation.valid.success) {
      throw createError({
        data: datasetValidation,
        statusCode: 400,
        statusMessage: "Dataset validation failed",
      });
    }
  }

  await prisma.datasetPublishingStatus.update({
    data: {
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });

  // 2. Validate the study metadata

  publishingStatusIndex = getPublishingStatusIndex("validating-study-metadata");

  if (environment !== "development") {
    const studyValidation = await validateStudyMetadata(datasetId, userId);

    if (!studyValidation.valid.success) {
      throw createError({
        data: studyValidation,
        statusCode: 400,
        statusMessage: "Study validation failed",
      });
    }
  }

  await prisma.datasetPublishingStatus.update({
    data: {
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });

  // 3. Validate the healthsheet

  publishingStatusIndex = getPublishingStatusIndex("validating-healthsheet");

  await prisma.datasetPublishingStatus.update({
    data: {
      status: publishingStatusIndex,
    },
    where: {
      datasetId,
    },
  });

  // 4. Lock the dataset. This blocks edits, document changes, and new upload SAS.
  // Only lock an unlocked dataset so two requests can't both queue a task

  const { count } = await prisma.dataset.updateMany({
    data: {
      lockedAt: new Date(),
    },
    where: {
      id: datasetId,
      lockedAt: null,
    },
  });

  if (count === 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Dataset is already being published",
    });
  }

  let frozen = false;

  try {
    // 5. Rename `data/` to `data-{datasetId}/`. This is atomic on HNS and cuts
    // off every outstanding owner SAS, so the task can copy straight away

    await freezeDraftData(dataset.canonicalId, datasetId);
    frozen = true;

    // 6. Generate the metadata files. The dataset is locked, so this snapshot
    // matches what was validated

    const datasetDescription = await generateDatasetDescription(
      datasetId,
      userId,
    );
    const studyDescription = await generateStudyDescription(datasetId, userId);

    const healthsheet = await generateHealthsheet(datasetId, userId);
    const license = await generateLicense(datasetId, userId);
    const readme = await generateReadme(datasetId, userId);
    const changelog = await generateChangelog(datasetId, userId);

    const primaryStudyIdentification = dataset.StudyIdentification?.find(
      (id) => !id.isSecondary,
    );

    const payload: PublishDatasetPayload = {
      metadataFiles: {
        "dataset_description.json": datasetDescription,
        "study_description.json": studyDescription,
        "healthsheet.md": healthsheet,
        "CHANGELOG.md": changelog,
        "README.md": readme,
        LICENSE: license,
      },
      publishedDataset: {
        title: dataset.title,
        canonicalId: dataset.canonicalId,
        description: dataset.description,
        publishedMetadata: {
          datasetDescription: JSON.parse(datasetDescription),
          studyDescription: JSON.parse(studyDescription),
          healthsheet: {
            motivation: parseRecords(dataset.DatasetHealthsheet?.motivation),
            composition: parseRecords(dataset.DatasetHealthsheet?.composition),
            collection: parseRecords(dataset.DatasetHealthsheet?.collection),
            preprocessing: parseRecords(
              dataset.DatasetHealthsheet?.preprocessing,
            ),
            uses: parseRecords(dataset.DatasetHealthsheet?.uses),
            distribution: parseRecords(
              dataset.DatasetHealthsheet?.distribution,
            ),
            maintenance: parseRecords(dataset.DatasetHealthsheet?.maintenance),
          },
          readme,
        },
        studyTitle: primaryStudyIdentification?.identifier ?? "",
        versionTitle: dataset.version ?? "1.0.0",
      },
    };

    // 7. Queue the file copy for scripts/process-task-queue.ts

    await prisma.$transaction([
      prisma.task.create({
        data: {
          datasetId,
          payload: payload as any,
          type: "publish-dataset",
        },
      }),
      prisma.datasetPublishingStatus.update({
        data: {
          comment: "Queued for publishing",
          status: getPublishingStatusIndex("indexing-dataset"),
        },
        where: {
          datasetId,
        },
      }),
    ]);
  } catch (error) {
    // Nothing was queued, so undo the lock and let the owner try again
    if (frozen) {
      await unfreezeData(dataset.canonicalId, datasetId);
    }

    await prisma.dataset.update({
      data: {
        lockedAt: null,
      },
      where: {
        id: datasetId,
      },
    });

    throw error;
  }

  return {
    success: true,
  };
});
