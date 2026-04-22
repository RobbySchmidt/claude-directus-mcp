import nodemailer, { type Transporter } from 'nodemailer'
import type { BuchungDetail } from '~~/shared/types/buchung'
import { renderBuchungTemplate as renderTpl } from '~~/shared/buchung-mailer.mjs'

type MailType =
  | 'admin_neu'
  | 'user_eingangsbestaetigung'
  | 'user_bestaetigt'
  | 'user_storniert'
  | 'user_abgelehnt'

let cachedTransporter: Transporter | null = null

function transporter(): Transporter {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.EMAIL_HOST
  const port = Number(process.env.EMAIL_PORT || 587)
  const user = process.env.EMAIL_ADDRESS
  const pass = process.env.EMAIL_SECRET
  if (!host || !user || !pass) {
    throw new Error('Mailer: EMAIL_HOST / EMAIL_ADDRESS / EMAIL_SECRET missing in env')
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  return cachedTransporter
}

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  const from = process.env.EMAIL_ADDRESS
  if (!from) throw new Error('EMAIL_ADDRESS missing')
  await transporter().sendMail({
    from: `"Alpenpfad" <${from}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  })
}

export function renderBuchungTemplate(
  type: MailType,
  b: BuchungDetail,
): { subject: string; html: string; text: string } {
  const cfg = useRuntimeConfig()
  const siteUrl = (cfg.public.siteUrl as string | undefined) || 'https://alpenpfad.de'
  return renderTpl(type, b, { siteUrl })
}
