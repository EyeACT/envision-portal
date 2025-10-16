import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  subject: z.string().min(1, "Subject is required"),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) =>
    contactSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.errors,
      statusCode: 400,
      statusMessage: "Invalid contact form data",
    });
  }

  try {
    // Get client IP and user agent for tracking
    const clientIP = getRequestIP(event);
    const userAgent = getHeader(event, "user-agent");

    // Create contact message in database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: body.data.name,
        email: body.data.email,
        ipAddress: clientIP,
        message: body.data.message,
        subject: body.data.subject,
        userAgent,
      },
    });

    return {
      id: contactMessage.id,
      message: "Thank you for your message. We'll get back to you soon!",
      success: true,
    };
  } catch (error) {
    console.error("Error creating contact message:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to send message. Please try again later.",
    });
  }
});
