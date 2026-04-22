# Buchungssystem — Design

**Datum:** 2026-04-22
**Scope:** Tour-Termine als eigene Collection, Buchungsanfragen (feste Termine + Wunschdatum), Kapazitäts-Check, Self-Service-Übersicht mit User-Storno, automatische E-Mail-Benachrichtigungen. Ohne Online-Payment — Buchung ist eine Anfrage, die Robby manuell bestätigt. Baut auf der bestehenden Auth-Spec auf (`directus_users` + Rolle "Kunde").

## 1. Ausgangslage

- Nuxt 4 App in `backup/`, Directus 11 Backend unter `https://directuscon.axtlust.de`.
- Touren-Collection (23 Felder + M2M Gallery) existiert. Drei Touren geseedet. Feld `booking_url` ist pro Tour leer → "Jetzt buchen"-CTAs zeigen disabled "Buchung in Kürze".
- Auth-System fertig: Rolle "Kunde" + Policy vorhanden, `/konto`-Profil + Passwort-Change live, `useUser()`/`useAuth()`-Composables, Server-Middleware für Token-Refresh, `auth`-Route-Middleware schützt `/konto/*`.
- Keine Buchungs-Collection, keine Termin-Verwaltung. Alle drei Touren haben `group_size_max` als informatives Feld.

## 2. Zielbild

- **Tour-Termine:** Robby legt pro Tour mehrere feste Termine in Directus an (Datum von/bis, optional Preis-Override und Hinweis).
- **Hybrid-Buchung:** Auf `/touren/<slug>/buchen` wählt der eingeloggte User entweder einen festen Termin **oder** gibt ein Wunschdatum ein.
- **Kapazitäts-Check:** Pro festem Termin wird live angezeigt, wie viele Plätze noch frei sind. Ausgebuchte Termine sind nicht wählbar. Anfragen zählen sofort gegen die Kapazität (nicht erst bei Bestätigung).
- **Schlankes Formular:** Termin-Auswahl, Personenzahl, Kontakt (vorbefüllt aus Profil), Notizen. Einmal absenden.
- **Self-Service:** `/konto/buchungen` listet die eigenen Buchungen, `/konto/buchungen/<id>` zeigt Details und erlaubt Storno (wenn Status passt und Termin > 14 Tage entfernt).
- **E-Mails:** Admin bekommt neue Anfragen, User bekommt Eingangs-, Bestätigungs- und Stornobestätigungen automatisch.
- **Status-Flow:** `angefragt` → `bestaetigt` → `durchgefuehrt`. Abzweige: `storniert`, `abgelehnt`. Status setzt Robby in der Directus-Admin-UI (außer User-Storno durch Self-Service).

## 3. Architektur-Entscheidung: Server-proxied Buchungen

**Wahl:** Wie bei Auth — Frontend ruft Nuxt-Server-Routes unter `/api/buchungen/*`. Die Routes verwenden den bestehenden Admin-Token (`useDirectusServer()`) für die tatsächlichen Directus-Writes und validieren/filtern selbst auf den eingeloggten User.

**Warum nicht direkt vom Client zu Directus?**
- Geschützte Felder (`user`, `status`, `preis_gesamt`) werden vom Server gesetzt, nicht vom Client.
- Cross-Field-Validierung (entweder `termin` oder `wunsch_datum`, nicht beides) lässt sich serverseitig einmal sauber machen.
- Kapazitäts-Check ist eine Aggregation über mehrere Buchungen — gehört in die Server-Route.
- Preis-Berechnung passiert authoritativ auf dem Server (Snapshot).

## 4. Daten-Architektur

### 4.1 Neue Collection `tour_termine`

Feste Abfahrts-Termine pro Tour. Admin legt sie in Directus an.

| Feld | Typ | Scheme | Zweck |
|---|---|---|---|
| `id` | uuid | PK | — |
| `status` | string | default `published`, required | Enum: `published`, `draft`, `archived`. Nur `published` taucht im Frontend auf |
| `tour` | m2o → `touren` | `is_nullable: false`, `on_delete: RESTRICT` | Zugehörige Tour |
| `date_from` | date | not null | Anreise-Datum |
| `date_to` | date | not null | Abreise-Datum |
| `price_override` | integer | nullable | Optional abweichender Preis (EUR/Person). Fallback = `tour.price_from` |
| `hinweis` | string (500) | nullable | Kurze Notiz, z. B. "Bahnhof Berchtesgaden, 9:00" |
| `sort` | integer | hidden | Manuelle Reihenfolge |
| `date_created` / `date_updated` | timestamp | special | Auto-gepflegt |

**Collection-Meta:** `icon: 'event'`, `archive_field: 'status'`, `archive_value: 'archived'`, `sort_field: 'sort'`, `display_template: '{{ tour.title }} — {{ date_from }}'`.

**Sortierung im Frontend:** `sort ASC, date_from ASC`. Vergangene Termine (`date_from < today`) werden serverseitig in der Content-API ausgefiltert.

### 4.2 Neue Collection `buchungen`

| Feld | Typ | Scheme | Zweck |
|---|---|---|---|
| `id` | uuid | PK | — |
| `status` | string | default `angefragt`, required | Enum-Werte (ASCII): `angefragt`, `bestaetigt`, `storniert`, `abgelehnt`, `durchgefuehrt`. Labels in der Directus-UI: "Angefragt", "Bestätigt", "Storniert", "Abgelehnt", "Durchgeführt" (folgt dem Touren-Pattern `published`/"Veröffentlicht") |
| `user` | m2o → `directus_users` | not null, `on_delete: RESTRICT` | Buchender, für Permission-Filter |
| `tour` | m2o → `touren` | not null, `on_delete: RESTRICT` | Zugehörige Tour (auch bei Wunschdatum gesetzt, als Convenience-Kopie auch bei Terminbuchung) |
| `termin` | m2o → `tour_termine` | nullable, `on_delete: RESTRICT` | Fester Termin, oder null wenn Wunschdatum |
| `wunsch_datum` | date | nullable | Gewünschtes Anreise-Datum, wenn kein fester Termin |
| `personen_anzahl` | integer | not null, min 1 | Anzahl Mitreisende inkl. Hauptbucher |
| `kontakt_vorname` | string | not null | Snapshot zur Buchungszeit |
| `kontakt_nachname` | string | not null | Snapshot |
| `kontakt_email` | string | not null | Snapshot (kann von User-E-Mail abweichen) |
| `kontakt_telefon` | string | not null | Pflichtfeld im Formular, nicht im User-Profil |
| `notizen` | text | nullable | Freitext "Besondere Wünsche" |
| `preis_gesamt` | integer | not null | Berechnet beim Submit: `(price_override ?? tour.price_from) × personen_anzahl` — als Snapshot |
| `last_notified_status` | string | nullable, hidden | Internes Feld — letzter Status, für den eine Mail ausging. Dient der Mail-Dedup zwischen Nuxt-Cancel-Route und Directus-Webhook (siehe 7.3) |
| `date_created` / `date_updated` | timestamp | special | Auto-gepflegt |

**Collection-Meta:** `icon: 'confirmation_number'`, `archive_field: 'status'`, `archive_value: 'archived'`, `display_template: '{{ tour.title }} — {{ personen_anzahl }} Pers. ({{ status }})'`.

**Cross-Field-Constraint (API-Ebene):** Genau eines von `termin` oder `wunsch_datum` ist gesetzt. Wird in `POST /api/buchungen` via Zod + Custom-Check validiert.

**Snapshot-Felder (`kontakt_*`, `preis_gesamt`):** Wenn User-Profil oder Tour-Preis später geändert wird, bleiben die Buchungswerte unverändert (Rechnungs-relevant).

**Default-Filter in Directus-UI:** Liste sollte `status !== archived` zeigen, `date_created DESC` sortiert.

### 4.3 Permission-Updates für Rolle "Kunde"

Die bestehende Kunde-Policy (aus der Auth-Spec) bekommt **4 neue Permissions**:

| Collection | Action | Filter | Fields |
|---|---|---|---|
| `buchungen` | `create` | — | `tour`, `termin`, `wunsch_datum`, `personen_anzahl`, `kontakt_vorname`, `kontakt_nachname`, `kontakt_email`, `kontakt_telefon`, `notizen` |
| `buchungen` | `read` | `user._eq.$CURRENT_USER` | alle |
| `buchungen` | `update` | `user._eq.$CURRENT_USER AND status._in.[angefragt,bestaetigt]` | nur `status` |
| `tour_termine` | `read` | `status._eq.published` | alle |

**Defense-in-Depth:** Buchungs-Writes laufen ausschließlich über unsere Nuxt-API-Routes, die den Admin-Token nutzen und `user`, `status`, `preis_gesamt` selbst setzen. Die Kunde-Policy erlaubt es einem User theoretisch auch, direkt zu Directus zu schreiben — die Feld-Allowlist in der Policy verhindert dann die Manipulation der geschützten Felder.

**14-Tage-Storno-Regel:** Wird serverseitig im `/api/buchungen/[id]/cancel`-Endpoint geprüft (Directus-Filter können "now + 14d" nicht ausdrücken). Die Policy erlaubt Update grundsätzlich, die Route implementiert die zusätzliche Zeit-Regel.

### 4.4 Setup-Script

Neues idempotentes Script `scripts/buchungen-setup.mjs`:
1. `tour_termine` Collection + Felder + Relation zu `touren` anlegen.
2. `buchungen` Collection + Felder + Relations zu `touren`, `tour_termine`, `directus_users` anlegen.
3. Die 4 neuen Permissions an die bestehende Kunde-Policy hängen (Policy-ID aus Auth-Setup wiederverwenden).
4. Abschließend Hinweis ausgeben: "Bitte in Directus-Admin-UI einen Webhook-Flow anlegen, der bei `buchungen`-Update-Events (Status-Wechsel) an `<NUXT_URL>/api/internal/booking-status-changed` postet. Siehe Section 7."

## 5. Frontend-Architektur

### 5.1 Neue/Geänderte Dateien

```
backup/
├── app/
│   ├── components/
│   │   ├── Buchung/
│   │   │   ├── BuchungForm.vue             (NEU — Buchungsformular)
│   │   │   ├── TerminSelect.vue            (NEU — Dropdown Termine + Wunschdatum)
│   │   │   ├── BuchungCard.vue             (NEU — Listen-Eintrag)
│   │   │   ├── BuchungStatusBadge.vue      (NEU — farbiges Badge je Status)
│   │   │   └── BuchungDetail.vue           (NEU — Detail-View mit Storno)
│   │   └── Tour/
│   │       └── TourTermine.vue             (NEU — Termin-Liste auf Tour-Detail)
│   ├── composables/
│   │   └── useBuchungen.ts                 (NEU — create/list/get/cancel)
│   ├── pages/
│   │   ├── touren/
│   │   │   └── [slug]/
│   │   │       └── buchen.vue              (NEU — Buchungsformular-Page, auth-protected)
│   │   └── konto/
│   │       └── buchungen/
│   │           ├── index.vue               (NEU — Liste)
│   │           └── [id].vue                (NEU — Detail + Storno)
│   └── (TourDetail + StickyMobileCTA: CTA-Links anpassen)
├── server/
│   ├── api/
│   │   ├── buchungen/
│   │   │   ├── index.post.ts               (NEU)
│   │   │   ├── index.get.ts                (NEU)
│   │   │   ├── [id].get.ts                 (NEU)
│   │   │   └── [id]/
│   │   │       └── cancel.post.ts          (NEU)
│   │   ├── internal/
│   │   │   └── booking-status-changed.post.ts  (NEU — Directus-Webhook-Receiver)
│   │   └── content/
│   │       └── tour.get.ts                 (GEÄNDERT: termine mit Kapazität anfügen)
│   └── utils/
│       ├── kapazitaet.ts                   (NEU — Belegung-Aggregation)
│       └── mailer.ts                       (NEU — nodemailer-Wrapper + Templates)
├── shared/types/
│   └── buchung.ts                          (NEU — Buchung, Termin, Status-Enum)
└── scripts/
    └── buchungen-setup.mjs                 (NEU — Schema + Permissions)
```

**Änderungen an bestehenden Dateien:**
- `TourDetail.vue` / `StickyMobileCTA.vue`: "Jetzt buchen"-Button linkt auf `/touren/<slug>/buchen` statt `booking_url`. Aktiv wenn mindestens 1 nicht-ausgebuchter Termin ODER Wunschdatum-Option verfügbar (Wunschdatum ist immer verfügbar, solange die Tour `published` ist — könnte später via Feature-Flag auf Tour-Ebene abgeschaltet werden, aus Scope jetzt).
- `backup/.env.example`: Neue Variablen dokumentieren (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_ADDRESS`, `EMAIL_SECRET`, `EMAIL_ADMIN`, `INTERNAL_WEBHOOK_SECRET`).
- `backup/package.json`: `nodemailer` als Dependency hinzu.
- `booking_url`-Feld auf `touren`: bleibt vorerst im Schema (kein Breaking-Change), wird nicht mehr gelesen. Meta-`note` wird auf "deprecated — Buchung läuft über /touren/<slug>/buchen" aktualisiert. Cleanup in späterer Spec.
- `/konto/index.vue`: Navigation um Eintrag "Buchungen" erweitern (schlichte Tab-Leiste oder Link-Liste, kein Redesign).

### 5.2 Komponenten-Grenzen

- **`useBuchungen()` composable** — Aktionen: `createBuchung(data)`, `listBuchungen()`, `getBuchung(id)`, `cancelBuchung(id)`. Jede Aktion ruft genau eine Server-Route. Return-Objekt `{ ok: true, data } | { ok: false, error: string }`. Kein eigener State — Konsumenten nutzen `useAsyncData` / `useFetch` für Caching.

- **`BuchungForm.vue`** — präsentationell. Props: `tour`, `termine`, `user`. Emit `submit` mit dem Form-Value. Keine Routing- oder Fetch-Logik. Page macht den API-Call.

- **`TerminSelect.vue`** — shadcn `<Select>`. Options: alle published Termine + letzte Option "Wunschdatum angeben". Bei "Wunschdatum" erscheint `<Input type="date">`. Ausgebuchte Termine erscheinen als Option mit Badge "Ausgebucht" und sind disabled. Emit `update:modelValue` mit `{ type: 'termin' | 'wunsch', terminId?, datum? }`.

- **`BuchungCard.vue`** — Tour-Titel + Thumbnail, Termin-Datum oder Wunschdatum, Personen, Preis, `<BuchungStatusBadge>`. Link zum Detail.

- **`BuchungStatusBadge.vue`** — kennt nur `{ status }`. Rendert shadcn `<Badge>` mit Farbe + Label: `angefragt` → "Angefragt" (gelb), `bestaetigt` → "Bestätigt" (grün), `storniert` → "Storniert" (grau), `abgelehnt` → "Abgelehnt" (rot), `durchgefuehrt` → "Durchgeführt" (blau).

- **`BuchungDetail.vue`** — zeigt alle Felder, inkl. Kontakt-Snapshot und Notizen. Storno-Button via shadcn `<AlertDialog>` als Bestätigung. Button disabled (mit Tooltip "Bitte telefonisch kontaktieren") wenn Regeln nicht erfüllt.

- **`TourTermine.vue`** — zeigt auf der Tour-Detail-Page die kommenden Termine: Datum + Preis + "Noch X Plätze" / "Ausgebucht". Kompakt, schließt an bestehende FactsBar/Highlights an.

### 5.3 Pages

| Pfad | Zweck | Layout | Middleware |
|---|---|---|---|
| `/touren/<slug>/buchen` | Buchungsformular | Header + zentrierte Card, Tour-Titel als Überschrift | `auth` |
| `/konto/buchungen` | Liste eigener Buchungen | Konto-Layout mit Navigation | `auth` |
| `/konto/buchungen/[id]` | Buchungs-Detail + Storno-Button | Konto-Layout | `auth` |

### 5.4 Datenfluss: Buchung anlegen

```
1. User klickt "Jetzt buchen" auf /touren/<slug>
2. Router → /touren/<slug>/buchen
   auth-middleware: nicht eingeloggt → /anmelden?redirect=<url>
3. Page useFetch('/api/content/tour?slug=<slug>') → Tour inkl. termine[]
4. Page rendert <BuchungForm :tour="tour" :termine="tour.termine" :user="user" />
5. Kontakt-Felder vorbefüllt: user.first_name, user.last_name, user.email
   kontakt_telefon bleibt leer, Pflichtfeld
6. User wählt Termin (oder Wunschdatum), Personen-Zahl, ergänzt Telefon, optional Notizen, submit
7. Page ruft useBuchungen().createBuchung(formValue)
8. POST /api/buchungen (Ablauf siehe 6.3)
9. Bei Erfolg: navigateTo(`/konto/buchungen?created=<id>`)
   Toast "Anfrage erhalten — wir melden uns binnen 48h"
10. E-Mails gehen parallel raus (Section 7)
```

### 5.5 Datenfluss: Storno

```
1. User klickt "Buchung stornieren" in BuchungDetail
2. shadcn <AlertDialog> — "Bist du sicher?"
3. Bei OK: useBuchungen().cancelBuchung(id)
4. POST /api/buchungen/<id>/cancel (Ablauf siehe 6.4)
5. Bei Erfolg: Re-fetch der Buchung; Status-Badge wechselt, Storno-Button verschwindet
   Toast "Buchung storniert"
6. Storno-Mail wird aus der Cancel-Route direkt verschickt (nicht via Webhook)
7. Kapazität des Termins wird beim nächsten Tour-Detail-Render frei
```

## 6. Server-API

### 6.1 Überblick

| Route | Method | Auth | Zweck |
|---|---|---|---|
| `/api/buchungen` | POST | user required | Neue Buchungsanfrage anlegen |
| `/api/buchungen` | GET | user required | Eigene Buchungen auflisten |
| `/api/buchungen/[id]` | GET | user required | Einzelne Buchung (Detail) |
| `/api/buchungen/[id]/cancel` | POST | user required | User-Storno |
| `/api/internal/booking-status-changed` | POST | Shared-Secret-Header | Directus-Webhook für Mails |
| `/api/content/tour` | GET | public | (geändert — liefert zusätzlich `termine[]` inkl. Kapazität) |

Alle User-Routes laufen durch die bestehende `auth-refresh.ts`-Middleware. Ohne Login → 401.

### 6.2 Änderung an `/api/content/tour`

Zusätzliches Array `termine` im Response:

```ts
termine: Array<{
  id: string
  date_from: string     // ISO "2026-06-12"
  date_to: string
  price_override: number | null
  hinweis: string | null
  verfügbare_plätze: number   // group_size_max minus belegt (-1 bei unbegrenzter Kapazität)
  ausgebucht: boolean
}>
```

Directus-Filter serverseitig: `status=published AND date_from >= today`. Sortierung: `sort ASC, date_from ASC`.

Kapazität via `getBelegungProTermin()` (6.5). Bei `group_size_max == null` gilt unbegrenzte Kapazität (`verfügbare_plätze = -1`, `ausgebucht = false`).

### 6.3 POST `/api/buchungen` — Detail-Ablauf

```
1. Auth-Middleware: Cookie → user.id
2. Zod-Validierung des Body:
   { tour: uuid, termin?: uuid, wunsch_datum?: date (ISO),
     personen_anzahl: int ≥ 1,
     kontakt_vorname, kontakt_nachname,
     kontakt_email (valid email), kontakt_telefon,
     notizen? }
3. Cross-Field-Check: genau eines von termin oder wunsch_datum ist gesetzt
   → sonst 400
4. Wunsch_datum muss > today sein (falls gesetzt)
5. Tour lesen (Admin-Token):
   - existiert? → sonst 404
   - status === 'published'? → sonst 403
6. Falls termin gesetzt:
   - Termin lesen, prüfen: tour_id matcht, status === 'published', date_from >= today
   - → sonst 400 / 409
7. Kapazitäts-Check (nur wenn termin gesetzt und tour.group_size_max != null):
   - getBelegungProTermin([terminId])
   - belegt + personen_anzahl > group_size_max → 409 "Termin ausgebucht"
8. Preis-Snapshot berechnen:
   preis_einzeln = termin?.price_override ?? tour.price_from
   preis_gesamt = preis_einzeln × personen_anzahl
9. Directus POST /items/buchungen (Admin-Token) mit:
   { user: current.id, status: 'angefragt', preis_gesamt, ...body }
10. E-Mails via mailer.ts:
    - Flow 1: An EMAIL_ADMIN — "Neue Buchungsanfrage"
    - Flow 2: An kontakt_email — "Eingangsbestätigung"
11. Return { ok: true, buchung: <created> }
```

### 6.4 POST `/api/buchungen/[id]/cancel`

```
1. Auth + user.id
2. Buchung lesen (Admin-Token). Falls buchung.user !== user.id → 404
   (nicht 403, um Existenz nicht zu leaken)
3. Status-Check: muss in ['angefragt', 'bestaetigt'] sein → sonst 409
4. Falls termin gesetzt: termin.date_from muss > now + 14 Tage sein
   → sonst 409 "Storno nicht mehr möglich — bitte telefonisch kontaktieren"
5. PATCH /items/buchungen/[id] mit { status: 'storniert', last_notified_status: 'storniert' }
   (last_notified_status wird mitgesetzt, damit der Directus-Webhook keine Doppel-Mail schickt)
6. E-Mail Flow 4: An kontakt_email — "Buchung storniert"
7. Return { ok: true }
```

### 6.5 Server-Util `kapazitaet.ts`

```ts
async function getBelegungProTermin(
  terminIds: string[]
): Promise<Record<string, number>>
```

Implementation:
1. Ein Directus-Call mit Admin-Token:
   `GET /items/buchungen?filter[termin][_in]=<ids>&filter[status][_nin]=storniert,abgelehnt&fields=termin,personen_anzahl&limit=-1`
2. Lokal gruppieren nach `termin`, summieren `personen_anzahl`
3. Return Map `{ terminId: belegt }` (0 für nicht gefundene Termine)

Verwendet von:
- `/api/content/tour` (für `termine[].verfügbare_plätze`)
- `/api/buchungen` POST (für Kapazitäts-Validierung)

**Race-Condition:** Zwei parallele Submits könnten beide den letzten Platz buchen. Bewusst akzeptiert für V1; bei Wander-Touren mit niedrigem Traffic minimales Risiko. Siehe Entscheidungslog #13.

### 6.6 GET `/api/buchungen` + GET `/api/buchungen/[id]`

Beide nutzen Admin-Token, filtern auf `user._eq.<current user.id>`. Nicht-eigener Zugriff → 404.

Expand: `tour.title`, `tour.slug`, `termin.date_from`, `termin.date_to`, `termin.hinweis` — damit Frontend-Listen ohne extra Calls rendern.

Sortierung Liste: `date_created DESC`.

### 6.7 POST `/api/internal/booking-status-changed` (Directus-Webhook-Receiver)

**Zweck:** Status-Wechsel, die Robby in der Directus-Admin-UI macht (`bestaetigt`, `abgelehnt`, `storniert`), lösen E-Mails aus. Directus hat selbst keinen Mail-Versand in dieser Spec.

```
Request Body (von Directus):
{ event: 'items.buchungen.update',
  keys: ['<buchung-id>'],
  payload: { status: '<neuer-status>' } }

Header: X-Internal-Secret: <INTERNAL_WEBHOOK_SECRET>
```

```
1. Header-Check: X-Internal-Secret === process.env.INTERNAL_WEBHOOK_SECRET
   → sonst 401
2. Body-Shape prüfen (Zod)
3. Für jede id in keys:
   a. Buchung lesen (Admin-Token) inkl. tour, termin, last_notified_status
   b. Neuen Status aus payload nehmen
   c. Dedup-Check: wenn buchung.last_notified_status === neuer Status → skip (Mail wurde
      bereits verschickt, z. B. durch User-Storno-Route)
   d. Mapping → Mail-Template:
      - 'bestaetigt' → Flow 3 an kontakt_email
      - 'storniert' → Flow 4 an kontakt_email
      - 'abgelehnt' → Flow 5 an kontakt_email — "Buchung leider nicht möglich"
      - andere → skip
   e. sendMail(…)
   f. PATCH /items/buchungen/[id] mit { last_notified_status: <neuer Status> }
      (damit spätere Webhook-Calls mit demselben Status keine Doppel-Mail produzieren)
4. Return { ok: true }
```

Fehler beim Mail-Versand → 500 loggen, aber nicht den Webhook failen lassen (Directus würde sonst retrys machen).

## 7. E-Mail-Versand (Hybrid Nuxt + Directus-Webhook)

### 7.1 Versand-Matrix

| # | Anlass | Trigger-Ort | Empfänger | Template |
|---|---|---|---|---|
| 1 | Neue Anfrage | `POST /api/buchungen` | `EMAIL_ADMIN` | "Neue Buchungsanfrage" |
| 2 | Eingangsbestätigung | `POST /api/buchungen` | `kontakt_email` | "Wir haben deine Anfrage" |
| 3 | Admin bestätigt | Directus-Webhook → `/api/internal/booking-status-changed` | `kontakt_email` | "Buchung bestätigt" |
| 4 | Storno durch User | `POST /api/buchungen/<id>/cancel` | `kontakt_email` | "Buchung storniert" |
| 4' | Storno durch Admin | Directus-Webhook | `kontakt_email` | (gleich wie 4) |
| 5 | Abgelehnt | Directus-Webhook | `kontakt_email` | "Buchung leider nicht möglich" |

### 7.2 `server/utils/mailer.ts`

Wrapper um `nodemailer`. Lädt SMTP-Config aus Env:

```
EMAIL_HOST            // z. B. "mail.agenturserver.de"
EMAIL_PORT            // default 587
EMAIL_ADDRESS         // Absender + Login-User
EMAIL_SECRET          // Passwort
EMAIL_ADMIN           // Empfänger für Flow 1 (Robby)
INTERNAL_WEBHOOK_SECRET  // Secret für Directus-Webhook
```

Exponiert:
```ts
export async function sendMail(opts: {
  to: string
  subject: string
  html: string
  text: string   // Plain-Text-Fallback
}): Promise<void>

export function renderBuchungTemplate(
  type: 'admin_neu' | 'user_eingangsbestaetigung' |
        'user_bestaetigt' | 'user_storniert' | 'user_abgelehnt',
  buchung: Buchung  // mit expand tour, termin
): { subject: string; html: string; text: string }
```

Templates werden als template-literal-Funktionen in `mailer.ts` gehalten (keine externe Template-Engine — YAGNI bei 5 Templates). Plain-Text und HTML werden beide generiert, damit Mails auch in Text-only Clients sauber ankommen.

### 7.3 Directus-Webhook-Flow

**Manuell in Directus Admin-UI anzulegen** (nicht im Setup-Script, siehe Entscheidungslog #16):

- **Trigger:** Event Hook, `items.buchungen.update`
- **Filter (Action Trigger):** `{ "status": { "_in": ["bestaetigt", "abgelehnt", "storniert"] } }` — nur relevante Wechsel
- **Operation:** "Webhook" (POST)
  - URL: `<NUXT_URL>/api/internal/booking-status-changed`
  - Method: POST
  - Headers: `{ "X-Internal-Secret": "<INTERNAL_WEBHOOK_SECRET>" }`
  - Body: Default-Flow-Body (enthält `event`, `keys`, `payload`)

**Doppel-Mail-Vermeidung für Storno:** Der Flow-Trigger feuert **auch** dann, wenn der User über `/api/buchungen/<id>/cancel` storniert (weil die Cancel-Route auch `PATCH status='storniert'` macht). Dadurch würde der User zwei Storno-Mails bekommen. Mitigation: Die Cancel-Route hat **ein zusätzliches Flag-Feld** `storno_durch_user` (boolean, default false) oder setzt einen Cache-Eintrag mit der Buchung-ID. Einfachere Variante: In `/api/internal/booking-status-changed` prüfen, ob `date_updated` der Buchung sehr nah an `date_created` oder an einem User-Storno-Zeitpunkt liegt — fragil.

**Gewählte Lösung:** Feld `last_notified_status` (siehe 4.2) wird vom Nuxt-Mailversand immer mitgesetzt. Der Webhook-Receiver skippt den Versand, wenn `last_notified_status === new status`. Idempotent, keine Zeit-basierten Heuristiken. Das Feld ist in der Kunde-Policy nicht updatebar (nur `status` im Update-Allowlist).

### 7.4 Bounce / Fehler

Mail-Versand-Fehler werden geloggt (stderr), führen aber nicht zum API-Fehler für den User. Die Buchung ist wichtiger als die Mail. Robby sollte gelegentlich die Logs prüfen.

## 8. Error Handling & Edge Cases

| Szenario | Handling |
|---|---|
| Buchung für nicht-existierende Tour | POST 404; Page zeigt Nuxt-404 |
| Tour mit `status != published` | POST 403; Page zeigt 404 |
| Termin gewählt, `date_from < today` | POST 409 "Termin liegt in der Vergangenheit" |
| Termin gehört zu anderer Tour | POST 400 "Ungültige Termin-Auswahl" |
| Weder `termin` noch `wunsch_datum` | POST 400 "Bitte wähle einen Termin oder gib ein Wunschdatum ein" |
| Beides gesetzt | POST 400 "Bitte wähle entweder festen Termin oder Wunschdatum" |
| Wunschdatum in der Vergangenheit | POST 400 "Wunschdatum muss in der Zukunft liegen" |
| `personen_anzahl < 1` oder `> group_size_max` | POST 400 "Personenzahl ungültig" |
| Termin wurde zwischen Render und Submit ausgebucht | POST 409 "Termin wurde gerade ausgebucht — bitte wähle einen anderen"; Form markiert Termin-Feld rot |
| Kontakt-E-Mail ungültig | Zod-Validation → POST 400 mit Feld-Fehler |
| Pflichtfelder leer | Clientseitig + serverseitig per Zod |
| Netzwerkfehler beim Submit | Toast "Verbindungsproblem — bitte erneut versuchen"; Form-State bleibt |
| Session abgelaufen beim Submit | 401 → Redirect `/anmelden?redirect=<url>` (Form-Werte verloren; V1 akzeptiert) |
| Admin löscht Tour mit aktiven Buchungen | FK ist `RESTRICT` → Löschung schlägt fehl; Admin muss Buchungen erst archivieren |
| Admin löscht Termin mit aktiven Buchungen | Gleich (RESTRICT) |
| Storno nach Bestätigung, Termin < 14 Tage | POST 409 "Storno nicht mehr möglich"; Button disabled mit Tooltip |
| Storno bereits-stornierter Buchung | POST 409; Button nicht mehr sichtbar |
| Fremde Buchung lesen/stornieren | 404 (nicht 403, um Existenz nicht zu leaken) |
| Mail-Flow schlägt fehl | Log-only; Buchung bleibt gültig |
| Concurrent Submit auf letzten Platz | Bewusst akzeptiert (Entscheidungslog #13) |
| Tour hat 0 Termine | CTA bleibt aktiv (Wunschdatum ist immer möglich). Formular zeigt nur die Wunschdatum-Option |
| Tour hat `group_size_max = null` | Unbegrenzte Kapazität, kein Platz-Badge, kein Kapazitäts-Check |

**Edge: User ändert E-Mail im Profil nach Buchung** — `kontakt_email` auf der Buchung bleibt unverändert. Folge-Mails gehen weiter an die damals eingetragene Adresse. Gewollt.

**Edge: User wird auf `suspended`** — Cookie wird beim nächsten Refresh ungültig (max 15min Delay, Auth-Polish-Issue I1). Aktive Buchungen bleiben; Robby kann manuell stornieren.

**Edge: Tour-Preis ändert sich während User das Formular ausfüllt** — Preis-Snapshot nimmt den Preis zum Submit-Zeitpunkt. UI-Anzeige könnte theoretisch vom Submit-Ergebnis abweichen. Für V1 akzeptabel. Falls Problem: `expected_price` vom Client mitsenden, Server gibt 409 bei Abweichung.

### 8.1 Logging

- `POST /api/buchungen`: bei Erfolg `"buchung_created"` mit `{ buchung_id, user_id, tour_slug }`; bei Fehler `"buchung_create_failed"` mit Grund
- `POST /api/buchungen/[id]/cancel`: `"buchung_cancelled"` mit `{ buchung_id, user_id, reason: 'user_requested' }`
- `POST /api/internal/booking-status-changed`: `"booking_status_mail_sent"` mit `{ buchung_id, new_status, to }`
- Mail-Versand-Fehler: `"mail_send_failed"` mit `{ template, to, error }`

Logs in Nuxt-Server-Log (stderr). Kein externes Log-System.

## 9. Teststrategie

Kein Test-Framework (konsistent mit Touren- und Auth-Specs). Verifikation über:

1. Script-Idempotenz (`buchungen-setup.mjs` mehrfach laufen)
2. `yarn build` als Type-Gate
3. curl-Smoketests für API
4. Manuelle Browser-Tests für E2E

### 9.1 curl-Smoketests

```bash
# Login → Cookies
curl -c /tmp/cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"kunde@rhowerk.de","password":"…"}' \
  http://localhost:3000/api/auth/login

# Tour mit Terminen
curl -s http://localhost:3000/api/content/tour?slug=koenigssee-rundweg | jq '.termine'

# Buchung anlegen
curl -b /tmp/cookies.txt -H 'Content-Type: application/json' \
  -d '{"tour":"<uuid>","termin":"<uuid>","personen_anzahl":2, …}' \
  http://localhost:3000/api/buchungen

# Eigene Buchungen
curl -b /tmp/cookies.txt http://localhost:3000/api/buchungen

# Storno
curl -b /tmp/cookies.txt -X POST \
  http://localhost:3000/api/buchungen/<id>/cancel

# Webhook (mit Shared-Secret)
curl -X POST -H 'Content-Type: application/json' \
  -H 'X-Internal-Secret: <secret>' \
  -d '{"event":"items.buchungen.update","keys":["<id>"],"payload":{"status":"bestaetigt"}}' \
  http://localhost:3000/api/internal/booking-status-changed
```

Geprüft: Status-Codes, Response-Shape, Kapazität korrekt bei Anlegen/Storno, Webhook-Secret-Check.

### 9.2 Manuelle Browser-Checks (Golden Path)

1. In Directus: 2 Termine für "Königssee-Rundweg" mit `group_size_max=8` anlegen
2. Tour-Detail → Termine mit "Noch 8 Plätze frei" sichtbar, CTA aktiv
3. Ohne Login `/touren/.../buchen` → Redirect `/anmelden?redirect=…`
4. Einloggen, Formular → Kontakt-Felder vorbefüllt
5. Buchung abschicken (fester Termin, 3 Pers.) → Erfolg, Redirect `/konto/buchungen`
6. Liste zeigt Buchung mit Badge "angefragt"
7. Tour-Detail neu: Termin zeigt "Noch 5 Plätze frei"
8. E-Mail-Check: Admin-Mail + Eingangsbestätigung kommen an
9. Zweite Buchung mit Wunschdatum → Kapazität am Termin unverändert
10. In Directus Status auf `bestaetigt` → "Buchung bestätigt"-Mail
11. `/konto/buchungen/<id>` → Storno-Button aktiv (Termin > 14 Tage weg)
12. Storno klicken → AlertDialog, OK → Status grau, Storno-Mail
13. Tour-Detail: Termin wieder "Noch 8 Plätze"
14. 2 weitere Buchungen à 4 Personen → ausgebucht, Badge "Ausgebucht", im Dropdown disabled
15. Termin < 14 Tage anlegen → Storno-Button disabled mit Tooltip
16. Anderen User einloggen, direkt `/konto/buchungen/<fremde-id>` → 404
17. In Directus Admin: Versuch Tour mit aktiven Buchungen zu löschen → FK-Fehler

### 9.3 SMTP-Live-Test

Vor Go-Live: Alle 5 Mail-Templates einmal auslösen und eine echte Mailbox prüfen (Empfang, Umlaute, Formatierung).

## 10. Non-Goals

- **Online-Payment / Stripe** — eigener Spec-Zyklus
- **Anzahlung-Modell** — Folge von Stripe-Spec
- **Detail-Roster pro Mitreisendem** (Namen, Geburtsdaten) — nur Anzahl; Q4=A
- **Reminder-Mails** ("Tour startet in 3 Tagen") — potenzielle spätere Spec
- **Admin-UI in Nuxt** für Buchungs-Verwaltung — Robby nutzt Directus-Admin; Mail-Trigger via Webhook
- **Concurrent-Submit-Schutz / Advisory Lock** — Risiko bewusst akzeptiert
- **Mehrfach-Tour-Buchungen in einem Submit** (Warenkorb) — YAGNI
- **Wiederholungsbuchungen / Abo** — nein
- **iCal-Export für bestätigte Buchungen** — Nice-to-have, später
- **Gruppenrabatt** — `preis_gesamt = einzel × anzahl`; manuelle Rabatte via Notizen + externe Rechnung
- **i18n für E-Mails** — rein deutsch in V1
- **Stornogebühren / Teil-Rückerstattungen** — Storno ist binär
- **Saldo-/Guthaben-System** — nein
- **`booking_url`-Feld entfernen** — erstmal belassen als deprecated

## 11. Entscheidungslog

| # | Entscheidung | Alternative | Grund |
|---|---|---|---|
| 1 | Hybrid-Termin-Modell: feste Termine + Wunschdatum | Nur feste Termine oder nur Wunsch | Q1=C — deckt beide Zielgruppen ab, nicht überkomplex |
| 2 | Placeholder-Payment; Stripe später | Stripe direkt | Q2=D — Buchungs-Mechanik zuerst stabilisieren |
| 3 | Kapazitäts-Block sofort bei Anfrage | Erst bei Bestätigung / Auto-Expire | Q3=A — sicher gegen Überbuchung |
| 4 | Nur Personenzahl + Hauptbucher-Kontakt | Namen-Liste / Voll-Detail | Q4=A — geringste Conversion-Friction |
| 5 | Voll-`/konto/buchungen` mit User-Storno | Read-only oder gar nicht | Q5=A — Self-Service, weniger Mail-Traffic für Robby |
| 6 | User-Storno-Regel: 14 Tage vor Termin | Andere Zeiten / keine Regel | Schutz gegen Last-Minute-Stornos; Tooltip erklärt |
| 7 | Zwei nullable Felder `termin` + `wunsch_datum` | Polymorphes Feld / Discriminator | Einfachstes Schema; API validiert "genau eines" |
| 8 | Kapazität on-the-fly | Denormalisiert in `tour_termine.belegt` | Single Source of Truth, keine Sync-Bugs |
| 9 | Preis-Snapshot auf `buchungen.preis_gesamt` | Always-berechnet | Schutz gegen spätere Tour-Preisänderungen |
| 10 | `RESTRICT` statt `CASCADE` auf FKs | CASCADE | Verhindert stillen Daten-Verlust |
| 11 | Mail-Versand hybrid: Nuxt + 1 Directus-Webhook-Flow | Nur Directus Flows / nur Nuxt | Mail-Logik im Code, Directus meldet State-Change |
| 12 | `nodemailer` als Mail-Deps | Resend / externer Service | Leichtgewichtig, genügt für 5 Templates |
| 13 | Race-Condition beim letzten Platz akzeptieren | Advisory Lock | YAGNI bei aktuellem Traffic |
| 14 | `booking_url`-Feld bleibt (deprecated) | Feld entfernen | Kein Breaking-Change; Cleanup-Spec später |
| 15 | Slugs auf Deutsch (`/touren/.../buchen`, `/konto/buchungen`) | Englisch | Konsistent mit bestehenden Routes |
| 16 | Setup-Script für Schema + Permissions; Webhook-Flow manuell in Directus-UI | Alles per Script | Flow-SDK fragil; 1 Flow einmalig manuell |
| 17 | `last_notified_status` zur Mail-Dedup | Zeit-Heuristik / Cache | Idempotent, einfaches Feld auf der Buchung |
