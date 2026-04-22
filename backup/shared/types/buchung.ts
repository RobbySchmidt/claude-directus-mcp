export type BuchungStatus =
  | 'angefragt'
  | 'bestaetigt'
  | 'storniert'
  | 'abgelehnt'
  | 'durchgefuehrt'

export type TerminPublic = {
  id: string
  date_from: string
  date_to: string
  price_override: number | null
  hinweis: string | null
  verfuegbare_plaetze: number
  ausgebucht: boolean
}

export type BuchungListItem = {
  id: string
  status: BuchungStatus
  date_created: string
  personen_anzahl: number
  preis_gesamt: number
  tour: { id: string; slug: string; title: string }
  termin: {
    id: string
    date_from: string
    date_to: string
    hinweis: string | null
  } | null
  wunsch_datum: string | null
}

export type BuchungDetail = BuchungListItem & {
  kontakt_vorname: string
  kontakt_nachname: string
  kontakt_email: string
  kontakt_telefon: string
  notizen: string | null
}

export type BuchungCreateInput = {
  tour: string
  termin?: string | null
  wunsch_datum?: string | null
  personen_anzahl: number
  kontakt_vorname: string
  kontakt_nachname: string
  kontakt_email: string
  kontakt_telefon: string
  notizen?: string | null
}

export type BuchungErrorCode =
  | 'unauthorized'
  | 'tour_not_found'
  | 'termin_invalid'
  | 'termin_past'
  | 'wunsch_datum_past'
  | 'missing_termin_or_wunsch'
  | 'both_termin_and_wunsch'
  | 'personen_anzahl_invalid'
  | 'termin_ausgebucht'
  | 'invalid_email'
  | 'buchung_not_found'
  | 'cancel_not_allowed_status'
  | 'cancel_not_allowed_deadline'
  | 'already_cancelled'
  | 'server_error'

export type BuchungResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: BuchungErrorCode; message: string }
