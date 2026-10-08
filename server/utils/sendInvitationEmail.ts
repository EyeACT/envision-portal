import nodemailer from "nodemailer";

export const sendInvitationEmail = async (to: string, subject: string, kind: string, datasetName: string, url: string) => {
  const config = useRuntimeConfig();

  const transporter = nodemailer.createTransport({
    auth: {
      pass: config.mailPass,
      user: config.mailUser,
    },
    host: config.mailHost,
    port: Number(config.mailPort),
  });


  let htmlContent = ``
  if (kind === "external") {
    htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="x-ua-compatible" content="ie=edge">
      <title>Email Confirmation</title>
      <style>
        body {
          background-color: #e9ecef;
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          max-width: 600px;
          margin: auto;
          background: #ffffff;
          border-top: 3px solid #d4dadf;
        }
        h2 {
          font-size: 32px;
          font-weight: 700;
          text-align: center;
          padding: 36px 24px 0;
        }
        p {
          font-size: 16px;
          line-height: 24px;
          padding: 24px;
          text-align: center;
        }
        .button-container {
          text-align: center;
          padding: 12px;
        }
        .button {
          background-color: #1a82e2;
          color: #ffffff;
          padding: 16px 36px;
          text-decoration: none;
          display: inline-block;
          border-radius: 6px;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <h1>Become a ${datasetName} team member on the Envision Portal. </h1>
      <p>You have been invited to collaborate on an Envision Portal dataset. Sign up for the Envision Portal now to start collaborating.</p>

      <a href='${url}' class='button' target='_blank'>Sign Up to Envision Portal</a>

      <p>Note: This link wil expire in 7 days.</p>
      <p>If you were not expecting this invitation, you can safely ignore this email.</p>
    </body>
  </html>
  `;
  } else if (kind === "internal") {
    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="x-ua-compatible" content="ie=edge">
          <title>Email Confirmation</title>
          <style>
            body {
              background-color: #e9ecef;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              max-width: 600px;
              margin: auto;
              background: #ffffff;
              border-top: 3px solid #d4dadf;
            }
            h2 {
              font-size: 32px;
              font-weight: 700;
              text-align: center;
              padding: 36px 24px 0;
            }
            p {
              font-size: 16px;
              line-height: 24px;
              padding: 24px;
              text-align: center;
            }
            .button-container {
              text-align: center;
              padding: 12px;
            }
            .button {
              background-color: #1a82e2;
              color: #ffffff;
              padding: 16px 36px;
              text-decoration: none;
              display: inline-block;
              border-radius: 6px;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <h1>Become a ${datasetName} team member on the Envision Portal. </h1>
          <p>You have been invited to collaborate on an Envision Portal dataset. Sign up for the Envision Portal now to start collaborating.</p>

          <a href='${url}' class='button' target='_blank'>View Dataset</a>

          <p>Note: This link wil expire in 7 days.</p>
          <p>If you were not expecting this invitation, you can safely ignore this email.</p>
        </body>
      </html>
  `;
  } else {
    throw new Error("No email sent")
  }

  await transporter.sendMail({
    from: config.mailFrom,
    html: htmlContent,
    subject,
    to,
  });
};
