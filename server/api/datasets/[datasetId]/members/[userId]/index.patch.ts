import prisma from "#server/utils/prisma";
import { defineEventHandler, readBody } from "h3";
import { datasetMinAdminPermission } from "#server/utils/datasetMinAdminPermission";

export default defineEventHandler(async (event) => {
  await datasetMinAdminPermission(event);

  const { datasetId, userId } = event.context.params as {
    datasetId: string;
    userId: string;
  };

  const body = await readBody(event);

  const datasetMember = await prisma.datasetMember.update({
    where: {
      datasetId_userId: { datasetId, userId },
    },
    data: {
      role: body.role,
    },
  });

  return datasetMember;
});
