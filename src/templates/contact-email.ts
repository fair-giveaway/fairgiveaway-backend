const LOGO_URL =
  "https://raw.githubusercontent.com/fair-giveaway/fairgiveaway-frontend/refs/heads/master/public/logo.png";
const SITE_URL = "https://fairgiveaway.online";

const SOCIAL_LINKS = [
  {
    label: "X",
    href: "https://x.com/FairGiveaway",
    icon: "https://cdn-icons-png.flaticon.com/512/733/733579.png",
  },
  {
    label: "GitHub",
    href: "https://github.com/fair-giveaway",
    icon: "https://cdn-icons-png.flaticon.com/512/733/733553.png",
  },
];

function escapeHtml(input: string): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSocialIconsHtml(): string {
  return SOCIAL_LINKS.map(
    (s) =>
      `<a href="${escapeHtml(s.href)}" target="_blank" rel="noopener noreferrer">` +
      `<img src="${escapeHtml(s.icon)}" class="social-icon" alt="${escapeHtml(s.label)}" width="32" height="32">` +
      `</a>`,
  ).join("");
}

function buildPreheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">${escapeHtml(text)}</div>`;
}

const EMAIL_STYLES = [
  "body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; }",
  ".container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }",
  ".header { background-color: #6D28D9; padding: 40px 20px; text-align: center; }",
  ".header img { max-width: 80px; height: auto; border-radius: 16px; }",
  ".header h2 { color: #ffffff; margin: 16px 0 0; font-size: 20px; font-weight: 600; }",
  ".content { padding: 40px; line-height: 1.7; }",
  ".content h1 { font-size: 24px; font-weight: 700; margin-top: 0; color: #0f172a; text-align: center; }",
  ".content p { font-size: 16px; color: #475569; }",
  ".summary-box { background-color: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #6D28D9; margin-top: 24px; }",
  ".summary-box p { font-size: 14px; color: #334155; margin: 4px 0; }",
  ".summary-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6D28D9; margin-top: 12px; }",
  ".btn-container { text-align: center; margin: 35px 0; }",
  ".btn { background-color: #6D28D9; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; }",
  ".footer { background-color: #ffffff; padding: 40px 30px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9; }",
  ".social-links { margin-bottom: 20px; }",
  ".social-links a { display: inline-block; margin: 0 8px; text-decoration: none; }",
  ".social-icon { width: 32px; height: 32px; }",
  ".footer p { margin: 5px 0; }",
  ".footer a { color: #64748b; text-decoration: underline; }",
  "@media only screen and (max-width: 620px) { .container { margin: 0; border-radius: 0; } .content { padding: 30px 24px; } }",
].join("\n  ");

function buildFooterHtml(year: number): string {
  return [
    `<div class="social-links">${buildSocialIconsHtml()}</div>`,
    `<p>&copy; ${year} <strong>FairGiveaway</strong>. All rights reserved.</p>`,
    `<p>Visit our website: <a href="${escapeHtml(SITE_URL)}">fairgiveaway.online</a></p>`,
    `<p>Need help? <a href="${escapeHtml(SITE_URL)}/contact">Contact Support</a> or open a <a href="https://github.com/orgs/fair-giveaway/discussions">GitHub Discussion</a>.</p>`,
  ].join("\n    ");
}

interface ContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function buildConfirmationEmailHtml(data: ContactData): string {
  const year = new Date().getUTCFullYear();
  const name = escapeHtml(data.name);
  const subject = escapeHtml(data.subject);
  const message = escapeHtml(data.message).replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>We received your message</title>
<style>${EMAIL_STYLES}</style>
</head>
<body>
${buildPreheader(`Thanks for contacting FairGiveaway, ${data.name}! We'll get back to you soon.`)}
<div class="container">
  <div class="header">
    <img src="${escapeHtml(LOGO_URL)}" alt="FairGiveaway">
    <h2>FairGiveaway</h2>
  </div>
  <div class="content">
    <h1>We Received Your Message!</h1>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Thank you for reaching out to us. We've received your message and will get back to you as soon as possible.</p>
    <p>For your reference, here's a copy of what you sent:</p>
    <div class="summary-box">
      <div class="summary-label">Subject</div>
      <p><strong>${subject}</strong></p>
      <div class="summary-label">Message</div>
      <p>${message}</p>
    </div>
    <p style="margin-top:24px;color:#94a3b8;font-size:14px;">You don't need to reply to this email. We'll respond to your message directly.</p>
  </div>
  <div class="footer">${buildFooterHtml(year)}</div>
</div>
</body>
</html>`;
}
