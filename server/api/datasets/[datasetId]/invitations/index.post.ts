
import dayjs from "dayjs";
import { z } from "zod"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await datasetMinAdminPermission(event)

  const { datasetId } = event.context.params as { datasetId: string };


  const body = await readValidatedBody(event, (b) =>
    datasetInviteSchema.safeParse(b)
  )

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing invitation information"
    })
  }

  const datasetInvite = body.data


  const user = await prisma.user.findUnique({
    where: {
      emailAddress: datasetInvite.emailAddress
    }
  })


  // TODO: Match platform invitation time later
  const invitationExpires = dayjs().add(30, "minute").toDate();


  const datasetInvitation = await prisma.datasetInvitation.create({
    data: {
      ...datasetInvite,
      invitationExpires,
      userId: user?.id ?? null
    }
  })


  if (user) {
    // Send invitation email
    const invitationLink = `${config.emailVerificationDomain}/app/datasets/${datasetId}/permissions?invitation=${datasetInvitation.id}`
    // TOOD: EMAIL TEMPLATE
    // await sendEmail(
    //   datasetInvite.emailAddress,
    //   "Sick Invitation Subject",
    //   invitationLink
    // )

    return invitationLink

  } else {
    // not platform user 
    // TODO: Create token for external user flow that gets consumed at signup once 
    // platform membership levels sorted out
    const invitationLink = `${config.emailVerificationDomain}/signup?invitation=${1234}`
    return invitationLink
  }


})


let datasetInviteSchema = z.object({
  datasetId: z.string(),
  emailAddress: z.email(),
  role: z.enum(DATASET_ROLES),
  userId: z.string().optional()
})