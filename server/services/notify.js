const nodemailer = require('nodemailer');
let tx = null;
if (process.env.SMTP_HOST) {
  tx = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}
// Sends an email, or logs it when SMTP is not configured. Never throws.
exports.email = async (to, subject, text) => {
  try {
    if (!tx) return console.log(`[mail] to=${to} | ${subject}\n${text}`);
    await tx.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
  } catch (e) { console.error('mail failed:', e.message); }
};
