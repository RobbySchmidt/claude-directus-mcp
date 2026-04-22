import nodemailer, { type Transporter } from 'nodemailer'
import type { BuchungDetail } from '~~/shared/types/buchung'

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

function formatDatum(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function terminLabel(b: BuchungDetail): string {
  if (b.termin) {
    const von = formatDatum(b.termin.date_from)
    const bis = formatDatum(b.termin.date_to)
    return `${von} – ${bis}`
  }
  return `Wunschdatum ${formatDatum(b.wunsch_datum ?? '')}`
}

export function renderBuchungTemplate(
  type: MailType,
  b: BuchungDetail,
): { subject: string; html: string; text: string } {
  const tourTitel = b.tour.title
  const datum = terminLabel(b)
  const preis = `${b.preis_gesamt} EUR`
  const kontakt = `${b.kontakt_vorname} ${b.kontakt_nachname}`

  switch (type) {
    case 'admin_neu': {
      const subject = `Neue Buchungsanfrage: ${tourTitel}`
      const text = [
        `Neue Buchungsanfrage eingegangen.`,
        ``,
        `Tour: ${tourTitel}`,
        `Termin: ${datum}`,
        `Personen: ${b.personen_anzahl}`,
        `Preis (Snapshot): ${preis}`,
        ``,
        `Kontakt:`,
        `  ${kontakt}`,
        `  ${b.kontakt_email}`,
        `  ${b.kontakt_telefon}`,
        ``,
        b.notizen ? `Notizen: ${b.notizen}` : '',
        ``,
        `Directus-Buchung-ID: ${b.id}`,
      ].join('\n')
      return { subject, text, html: `<pre>${escHtml(text)}</pre>` }
    }
    case 'user_eingangsbestaetigung': {
      const subject = `Deine Anfrage für ${tourTitel} ist bei uns`
      const text = [
        `Hallo ${b.kontakt_vorname},`,
        ``,
        `vielen Dank für deine Anfrage. Wir melden uns binnen 48 Stunden bei dir.`,
        ``,
        `Zusammenfassung:`,
        `  Tour: ${tourTitel}`,
        `  Termin: ${datum}`,
        `  Personen: ${b.personen_anzahl}`,
        `  Preis: ${preis}`,
        ``,
        `Du findest deine Anfrage jederzeit unter https://alpenpfad.de/konto/buchungen.`,
        ``,
        `Bis bald,`,
        `dein Alpenpfad-Team`,
      ].join('\n')
      return { subject, text, html: `<pre>${escHtml(text)}</pre>` }
    }
    case 'user_bestaetigt': {
      const subject = `Buchung bestätigt: ${tourTitel}`
      const text = [
        `Hallo ${b.kontakt_vorname},`,
        ``,
        `deine Buchung für ${tourTitel} ist bestätigt.`,
        ``,
        `Termin: ${datum}`,
        `Personen: ${b.personen_anzahl}`,
        `Preis: ${preis}`,
        ``,
        `Details unter https://alpenpfad.de/konto/buchungen/${b.id}.`,
        ``,
        `Wir freuen uns auf dich!`,
        `dein Alpenpfad-Team`,
      ].join('\n')
      return { subject, text, html: `<pre>${escHtml(text)}</pre>` }
    }
    case 'user_storniert': {
      const subject = `Buchung storniert: ${tourTitel}`
      const text = [
        `Hallo ${b.kontakt_vorname},`,
        ``,
        `deine Buchung für ${tourTitel} (${datum}) wurde storniert.`,
        ``,
        `Falls du erneut buchen möchtest, findest du alle Touren auf https://alpenpfad.de.`,
        ``,
        `dein Alpenpfad-Team`,
      ].join('\n')
      return { subject, text, html: `<pre>${escHtml(text)}</pre>` }
    }
    case 'user_abgelehnt': {
      const subject = `Buchung leider nicht möglich: ${tourTitel}`
      const text = [
        `Hallo ${b.kontakt_vorname},`,
        ``,
        `leider können wir deine Anfrage für ${tourTitel} (${datum}) nicht annehmen.`,
        ``,
        `Falls du Fragen hast, antworte einfach auf diese E-Mail.`,
        ``,
        `dein Alpenpfad-Team`,
      ].join('\n')
      return { subject, text, html: `<pre>${escHtml(text)}</pre>` }
    }
  }
}
