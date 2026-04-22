/**
 * Sends pending status-change mails for buchungen.
 *
 * Scans all buchungen where `last_notified_status !== status` AND
 * `status` ∈ { bestaetigt, storniert, abgelehnt }, then for each:
 *   - renders the matching mail template
 *   - sends via SMTP (nodemailer)
 *   - updates `last_notified_status` so re-runs are no-ops
 *
 * Usage: yarn buchungen:notify
 *
 * Required env (from backup/.env):
 *   EMAIL_HOST, EMAIL_PORT (default 587), EMAIL_ADDRESS, EMAIL_SECRET
 *   NUXT_PUBLIC_SITE_URL (optional — fallback link-base in mail body)
 *
 * Prints a summary line per booking and a final count.
 */
import { directus } from './directus.mjs'
import { readItems, updateItem } from '@directus/sdk'
import nodemailer from 'nodemailer'
import { renderBuchungTemplate } from '../shared/buchung-mailer.mjs'

const TEMPLATE_FOR = {
  bestaetigt: 'user_bestaetigt',
  storniert: 'user_storniert',
  abgelehnt: 'user_abgelehnt',
}

const BUCHUNG_FIELDS = [
  'id', 'status', 'date_created', 'personen_anzahl', 'preis_gesamt',
  'kontakt_vorname', 'kontakt_nachname', 'kontakt_email', 'kontakt_telefon', 'notizen',
  'wunsch_datum', 'last_notified_status',
  'tour.id', 'tour.slug', 'tour.title',
  'termin.id', 'termin.date_from', 'termin.date_to', 'termin.hinweis',
]

function makeTransporter() {
  const host = process.env.EMAIL_HOST
  const port = Number(process.env.EMAIL_PORT || 587)
  const user = process.env.EMAIL_ADDRESS
  const pass = process.env.EMAIL_SECRET
  if (!host || !user || !pass) {
    throw new Error('EMAIL_HOST / EMAIL_ADDRESS / EMAIL_SECRET missing in env')
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

async function run() {
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://alpenpfad.de'
  const from = process.env.EMAIL_ADDRESS

  const targets = await directus.request(
    readItems('buchungen', {
      filter: {
        status: { _in: Object.keys(TEMPLATE_FOR) },
      },
      fields: BUCHUNG_FIELDS,
      limit: -1,
    }),
  )

  const pending = targets.filter((b) => b.last_notified_status !== b.status)
  console.log(`→ ${pending.length} pending notifications`)

  if (pending.length === 0) {
    console.log('Done.')
    return
  }

  const transporter = makeTransporter()
  let sent = 0
  let failed = 0

  for (const b of pending) {
    const tplName = TEMPLATE_FOR[b.status]
    try {
      const tpl = renderBuchungTemplate(tplName, b, { siteUrl })
      await transporter.sendMail({
        from: `"Alpenpfad" <${from}>`,
        to: b.kontakt_email,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
      })
      await directus.request(
        updateItem('buchungen', b.id, { last_notified_status: b.status }),
      )
      console.log(`  ✓ ${b.id}  ${b.status.padEnd(10)} → ${b.kontakt_email}  (${tpl.subject})`)
      sent++
    } catch (err) {
      console.error(`  ✗ ${b.id}  ${b.status}  → ${b.kontakt_email}`)
      console.error(`    ${err?.message ?? err}`)
      failed++
    }
  }

  console.log(`\nSent: ${sent}   Failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

run().catch((err) => {
  console.error('✗ failed:', err?.errors ?? err)
  process.exit(1)
})
