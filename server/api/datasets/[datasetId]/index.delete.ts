// A deleted draft's data is kept for this long so it can be restored by an admin
// (scripts/restore-draft.ts) if it was deleted by mistake
const DRAFT_PURGE_GRACE_DAYS = 30;

/**
 * Soft delete a draft version created from a published version. Datasets
 * themselves can't be deleted, so the first version of a dataset can't be either.
 * See "Delete draft version" in dev/storage-rework.md.
 */
export default defineEventHandler(async (event) => {
  throw createError({
    statusCode: 403,
    statusMessage: "currently disabled",
  });
  
  await datasetMinAdminPermission(event);

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  if (dataset.status !== "draft" || dataset.lockedAt) {
    throw createError({
      statusCode: 409,
      statusMessage: "Only an unpublished draft version can be deleted",
    });
  }

  // The version this draft was created from. Its frozen folder was renamed
  // into the draft's `data/`, so it is rebuilt from its published container
  const previousVersion = await prisma.dataset.findFirst({
    orderBy: {
      created: "desc",
    },
    select: {
      id: true,
    },
    where: {
      canonicalId: dataset.canonicalId,
      created: {
        lt: dataset.created,
      },
      deletedAt: null,
      status: "published",
    },
  });

  if (!previousVersion) {
    throw createError({
      statusCode: 409,
      statusMessage: "The first version of a dataset cannot be deleted",
    });
  }

  const purgeAfter = new Date();

  purgeAfter.setDate(purgeAfter.getDate() + DRAFT_PURGE_GRACE_DAYS);

  // Mark the draft deleted and queue its tasks together, before touching
  // storage. Once `deletedAt` is set no new upload SAS is issued, and the
  // pending rebuild blocks a new version from claiming `data/` mid-delete
  const tasks = await prisma.$transaction(async (tx) => {
    const { count } = await tx.dataset.updateMany({
      data: {
        deletedAt: new Date(),
      },
      where: {
        deletedAt: null,
        id: datasetId,
        lockedAt: null,
      },
    });

    if (count === 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "Dataset is being published or was already deleted",
      });
    }

    return Promise.all([
      tx.task.create({
        data: {
          datasetId: previousVersion.id,
          type: "rebuild-frozen-data",
        },
      }),
      tx.task.create({
        data: {
          datasetId,
          runAfter: purgeAfter,
          type: "purge-draft",
        },
      }),
    ]);
  });

  // Rename `data/` to `data-{datasetId}/`. This keeps the draft's files for the
  // grace period and cuts off every outstanding owner SAS
  try {
    await freezeDraftData(dataset.canonicalId, datasetId);
  } catch (error) {
    await prisma.$transaction([
      prisma.task.deleteMany({
        where: {
          id: {
            in: tasks.map(({ id }) => id),
          },
          status: "pending",
        },
      }),
      prisma.dataset.update({
        data: {
          deletedAt: null,
        },
        where: {
          id: datasetId,
        },
      }),
    ]);

    throw error;
  }

  return {
    purgeAfter: purgeAfter.toISOString(),
    success: true,
  };
});
