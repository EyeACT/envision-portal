import PublishingStatus from "~/assets/data/publishing-status.json";
import {
  validateDatasetMetadata,
  validateStudyMetadata,
} from "#shared/utils/validations";
import type { PublishDatasetPayload } from "#shared/types/tasks";

// The publish task waits this long before copying files. It must be at least the
// upload SAS lifetime (upload.get.ts) so no token issued before the lock is still valid.
const PUBLISH_DELAY_HOURS = 24;

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

  // 4. Generate the metadata files now. The dataset is locked below, so this
  // snapshot matches what was validated

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
          distribution: parseRecords(dataset.DatasetHealthsheet?.distribution),
          maintenance: parseRecords(dataset.DatasetHealthsheet?.maintenance),
        },
        readme,
      },
      studyTitle: primaryStudyIdentification?.identifier ?? "",
      versionTitle: dataset.version ?? "1.0.0",
    },
  };

  // 5. Lock the dataset and queue the file copy. The copy waits out the upload
  // SAS lifetime so late writes from an unexpired token won't be missed.

  const runAfter = new Date();

  runAfter.setHours(runAfter.getHours() + PUBLISH_DELAY_HOURS);

  await prisma.$transaction(async (tx) => {
    // Only lock an unlocked dataset so two requests can't both queue a task
    const { count } = await tx.dataset.updateMany({
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

    await tx.task.create({
      data: {
        datasetId,
        payload: payload as any,
        runAfter,
        type: "publish-dataset",
      },
    });

    await tx.datasetPublishingStatus.update({
      data: {
        comment: `Queued. Files will be copied after ${runAfter.toUTCString()}`,
        status: getPublishingStatusIndex("indexing-dataset"),
      },
      where: {
        datasetId,
      },
    });
  });

  return {
    runAfter,
    success: true,
  };
});
