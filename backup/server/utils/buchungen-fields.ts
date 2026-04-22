/**
 * Field expansion used for `BuchungDetail` responses. Keep this in sync
 * with the `BuchungDetail` type in `shared/types/buchung.ts` — the cast
 * at each call site relies on this list matching the type.
 */
export const BUCHUNG_DETAIL_FIELDS = [
  'id',
  'status',
  'date_created',
  'personen_anzahl',
  'preis_gesamt',
  'kontakt_vorname',
  'kontakt_nachname',
  'kontakt_email',
  'kontakt_telefon',
  'notizen',
  'wunsch_datum',
  'tour.id',
  'tour.slug',
  'tour.title',
  'termin.id',
  'termin.date_from',
  'termin.date_to',
  'termin.hinweis',
] as const

/** Includes the internal `last_notified_status` field. Use only in the webhook receiver. */
export const BUCHUNG_DETAIL_FIELDS_WITH_INTERNAL = [
  ...BUCHUNG_DETAIL_FIELDS,
  'last_notified_status',
] as const
