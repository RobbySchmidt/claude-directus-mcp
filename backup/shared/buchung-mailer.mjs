/**
 * Pure mail-template renderer shared between the Nuxt server utilities
 * and the CLI notify script. No Nuxt-specific APIs — can be imported
 * from plain Node scripts as well as from server routes.
 *
 * Template output shape: { subject, html, text }
 *
 * Template types:
 *   - 'admin_neu'                 → Admin mail for new booking requests
 *   - 'user_eingangsbestaetigung' → Customer receipt after submitting
 *   - 'user_bestaetigt'           → Customer mail when admin confirms
 *   - 'user_storniert'            → Customer mail when cancelled (either side)
 *   - 'user_abgelehnt'            → Customer mail when admin rejects
 */

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatDatum(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function terminLabel(b) {
  if (b.termin) {
    return `${formatDatum(b.termin.date_from)} – ${formatDatum(b.termin.date_to)}`
  }
  if (b.wunsch_datum) return `Wunschdatum ${formatDatum(b.wunsch_datum)}`
  return 'Kein Datum angegeben'
}

/**
 * @param {'admin_neu'|'user_eingangsbestaetigung'|'user_bestaetigt'|'user_storniert'|'user_abgelehnt'} type
 * @param {object} b  Booking with expanded tour + (optional) termin
 * @param {{ siteUrl: string }} opts
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderBuchungTemplate(type, b, opts) {
  const tourTitel = b.tour.title
  const datum = terminLabel(b)
  const preis = `${b.preis_gesamt} EUR`
  const kontakt = `${b.kontakt_vorname} ${b.kontakt_nachname}`
  const base = (opts?.siteUrl || 'https://alpenpfad.de').replace(/\/$/, '')

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
        `Du findest deine Anfrage jederzeit unter ${base}/konto/buchungen.`,
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
        `Details unter ${base}/konto/buchungen/${b.id}.`,
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
        `Falls du erneut buchen möchtest, findest du alle Touren auf ${base}.`,
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
    default:
      throw new Error(`Unknown mail template type: ${type}`)
  }
}
