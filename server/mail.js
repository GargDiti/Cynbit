import nodemailer from 'nodemailer'

export async function sendLeadConfirmation(lead) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env
  const recipient = lead.email

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    console.info('Confirmation email (SMTP not configured):', {
      to: recipient,
      subject: 'We received your message',
      text: `Hi ${lead.name},\n\nThanks for contacting Cynbit Technologies about ${lead.service}. We have received your message and will follow up.`,
    })
    return
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  })
  await transporter.sendMail({
    from: SMTP_FROM,
    to: recipient,
    subject: 'We received your message',
    text: `Hi ${lead.name},\n\nThanks for contacting Cynbit Technologies about ${lead.service}. We have received your message and will follow up.`,
  })
}
