import { Elysia, t } from "elysia";
import nodemailer from "nodemailer";
import { buildConfirmationEmailHtml } from "../templates/contact-email";

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactSchema = {
  body: t.Object(
    {
      name: t.String({ description: "Sender's name.", minLength: 1 }),
      email: t.String({ description: "Sender's email address.", format: "email" }),
      subject: t.String({ description: "Message subject/topic.", minLength: 1 }),
      message: t.String({ description: "Message body.", minLength: 10 }),
    },
    { description: "Contact form submission payload." },
  ),
  response: {
    200: t.Object({ success: t.Boolean({ description: "True if both emails were sent." }) }),
    500: t.Object({ error: t.String({ description: "Error message." }) }),
  },
  detail: {
    tags: ["System"],
    summary: "Send Contact Email",
    description:
      "Receives a contact form submission. Sends an internal notification to support AND " +
      "a branded confirmation email to the sender acknowledging receipt.",
  },
};

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

function buildInternalNotification(data: ContactPayload): string {
  return [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Subject: ${data.subject}`,
    "",
    data.message,
  ].join("\n");
}

async function handleContact({
  body,
  set,
}: {
  body: ContactPayload;
  set: { status?: number | string };
}) {
  const { name, email, subject, message } = body;
  const from = `"FairGiveaway" <${process.env.EMAIL_USER}>`;
  const transporter = createTransporter();

  try {
    // Send internal notification first
    await transporter.sendMail({
      from,
      to: process.env.EMAIL_USER,
      replyTo: `"${name}" <${email}>`,
      subject: `[Contact] ${subject} — from ${name}`,
      text: buildInternalNotification({ name, email, subject, message }),
    });

    // Then send the confirmation email to the visitor
    await transporter.sendMail({
      from,
      to: email,
      subject: `We received your message — FairGiveaway`,
      html: buildConfirmationEmailHtml({ name, email, subject, message }),
      text: `Hi ${name},\n\nThank you for contacting FairGiveaway. We received your message and will get back to you soon.\n\nSubject: ${subject}\nMessage: ${message}\n\n— FairGiveaway Team`,
    });

    return { success: true };
  } catch (err) {
    console.error("Failed to send contact email:", err);
    set.status = 500;
    return { error: "Failed to send message. Please try again later." };
  }
}

export function contactRoutes() {
  return new Elysia().post("/api/contact", handleContact, ContactSchema);
}
