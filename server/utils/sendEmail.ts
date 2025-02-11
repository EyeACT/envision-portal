import nodemailer from "nodemailer";

// TODO: Update from mailtrap sandbox to live email sending service
export const sendEmail = async (to: string, subject: string, text: string) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
    auth: {
      user: "89bd4974195df1",
      pass: "2b77ac61b0b6e6",
    },
  });
  
  await transporter.sendMail({
    from: `"Your App" <xdong@calmi2.org>`,
    to: to,
    subject: subject,
    text: text,
    html: "<b>This is a test email for verification.</b>",
  });
};
 