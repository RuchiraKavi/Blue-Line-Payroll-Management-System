import nodemailer from "nodemailer";

function getMailCredentials() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  return { user, pass };
}

function createTransport() {
  const { user, pass } = getMailCredentials();

  if (!user || !pass) {
    throw new Error(
      "Email is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env (development) or in %APPDATA%\\payroll-management\\secrets.env (installed app)."
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
  });
}

const sendEmail = async ({ to, subject, html }) => {
  const { user, pass } = getMailCredentials();
  if (!user || !pass) {
    throw new Error(
      "Email is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env or secrets.env."
    );
  }

  const transporter = createTransport();

  try {
    const info = await transporter.sendMail({
      from: `"HR Management" <${user}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email send error:", error.message);
    throw error;
  } finally {
    transporter.close();
  }
};

export default sendEmail;
