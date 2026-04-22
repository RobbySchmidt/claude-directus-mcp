# Touren-Collection & Detailseiten — Design

**Datum:** 2026-04-21
**Scope:** Eigene Directus-Collection `touren`, Refactor des `block_tourGrid`, Detailseiten unter `/touren/<slug>` mit Gallery-Carousel.

## 1. Ausgangslage

- Der Block `block_tourGrid` besitzt heute ein **JSON-Feld** `tours` (Interface `list`), in dem pro Block-Instanz die Touren inline gepflegt werden.
- Aktuelle Daten in der Home-Instanz (`9992cbac-…`):
  1. Königssee-Rundweg — Berchtesgadener Alpen — `alpine-see` / leicht → Slug `koenigssee-rundweg`
  2. Drei-Zinnen-Umrundung — Dolomiten, Südtirol — `hochgebirge` / mittel → Slug `drei-zinnen-umrundung`
  3. Watzmann-Überschreitung — Bayerische Alpen — `almwiese` / schwer → Slug `watzmann-ueberschreitung`
- Das Frontend (`app/components/blocks/TourGrid.vue`) rendert ein statisches Grid aus `TourCard`-Komponenten; jede Kachel nutzt `IllustrationsTourIllustration` mit `variant`.
- Es existiert eine Catch-all-Route `pages/[...slug].vue`, aber keine dedizierte Tour-Detailseite.

## 2. Zielbild

- Touren sind eigenständige Records in Directus, wiederverwendbar über Blöcke hinweg.
- Der `block_tourGrid` referenziert Touren per **M2M** mit sortierbarer Junction (Redakteur steuert Reihenfolge per Drag&Drop).
- Jede Tour hat eine **öffentliche Detailseite** `/touren/<slug>` mit erweitertem Content (Intro, Highlights, Dabei/Nicht dabei, Organisatorisches, Gallery) und zwei CTAs zur Buchung.
- Die Kachel-Optik auf der Home bleibt unverändert; lediglich ein **„Details"-Button** wird ergänzt.
- Pro Tour liegen **4 thematische SVG-Illustrationen** als Directus-Files im Ordner `touren-gallery` und sind per M2M mit der Tour verbunden.

## 3. Daten-Architektur

### 3.1 Neue Collection: `touren`

| Feld | Typ | Interface | Required | Hinweis |
|---|---|---|---|---|
| `id` | uuid | — | auto | Primärschlüssel |
| `status` | string | select-dropdown | ja | `draft` / `published` / `archived` |
| `sort` | integer | — | nein | Manuelle Sortierung in Directus-UI |
| `date_created` | timestamp | — | auto | Special `date-created` |
| `date_updated` | timestamp | — | auto | Special `date-updated` |
| `slug` | string | input | ja, unique | URL-safe (`[a-z0-9-]+`), manuell gepflegt |
| `title` | string | input | ja | Hauptüberschrift |
| `subtitle` | string | input | nein | Kurz-Claim (ein Satz) |
| `region` | string | input | ja | z. B. „Berchtesgadener Alpen" |
| `difficulty` | string | select-dropdown | ja | `leicht` / `mittel` / `schwer` |
| `variant` | string | select-dropdown | ja | `alpine-see` / `hochgebirge` / `almwiese` — steuert Kachel-Illustration |
| `distance` | string | input | ja | z. B. „14 km" |
| `ascent` | string | input | ja | z. B. „420 hm" |
| `duration` | string | input | ja | z. B. „5 Std." |
| `group_size_max` | integer | input | nein | Max. Gruppengröße |
| `intro` | text | input-multiline | nein | 2–3 Sätze Fließtext |
| `highlights` | json | tags (List-Interface) | nein | `string[]` — Stichpunkte |
| `included` | json | tags (List-Interface) | nein | `string[]` — „Dabei" |
| `not_included` | json | tags (List-Interface) | nein | `string[]` — „Nicht dabei" |
| `meeting_point` | string | input | nein | Freitext |
| `season` | string | input | nein | z. B. „Mai–Oktober" |
| `price_from` | integer | input | nein | EUR, „ab X €" |
| `booking_url` | string | input | nein | Platzhalter — echter Flow später |
| `gallery` | M2M | list-m2m | nein | Junction `touren_files` → `directus_files` |

**Design-Notizen:**
- `highlights` / `included` / `not_included` bewusst als JSON-Tag-Listen (nicht als separate O2M-Collections), weil es schlichte Stichpunkt-Listen ohne eigene Metadaten sind.
- `variant` bleibt bewusst gleich zur heutigen TourCard-Signatur — die Kachel-Komponente wird nicht angefasst.
- Keine `description`-Richtext-Felder: Der Umfang (Intro + Highlights + Dabei + Organisatorisches) deckt das geplante Layout vollständig ab. Kein generisches „long text" als Müllhalde.

### 3.2 Junction: `touren_files` (Gallery)

Standard-M2M-Junction, von Directus beim Anlegen des `gallery`-Feldes automatisch erzeugt:

| Feld | Typ | Hinweis |
|---|---|---|
| `id` | integer | pk |
| `touren_id` | uuid | FK → `touren.id` |
| `directus_files_id` | uuid | FK → `directus_files.id` |
| `sort` | integer | Reihenfolge im Carousel |

### 3.3 Refactor: `block_tourGrid.tours`

**Alt:** JSON-Feld mit Inline-List-Interface.
**Neu:** M2M zu `touren` über Junction `block_tourGrid_touren`:

| Feld | Typ |
|---|---|
| `id` | integer (pk) |
| `block_tourGrid_id` | uuid (FK) |
| `touren_id` | uuid (FK) |
| `sort` | integer |

**Migration:**
1. Vor dem Schema-Change: JSON-Payload aus allen existierenden `block_tourGrid`-Items backupen (per Directus REST → `backup/exports/migrations/block_tourGrid-before-$timestamp.json`).
2. Drei Touren-Records in `touren` anlegen (siehe §5 Seed).
3. Altes `tours`-Feld entfernen, neues M2M-Feld `tours` (gleicher Key!) anlegen → FE-Code benötigt keine Umbenennung.
4. Junction-Einträge pro Block-Instanz setzen, Reihenfolge aus altem JSON übernehmen.

### 3.4 Directus-Permissions (Public Role)

Damit der öffentliche Frontend-Fetch funktioniert, braucht die Public Role `read`-Rechte auf:
- `touren` — nur `status == 'published'`
- `touren_files` — gefiltert durch Parent
- `block_tourGrid_touren` — Read all
- `directus_files` — bereits offen (bestehender Zustand)

## 4. Frontend-Architektur

### 4.1 Neue/Geänderte Dateien

```
backup/
├── app/
│   ├── components/
│   │   ├── TourCard.vue                          (GEÄNDERT: + Details-Button, + slug-Prop)
│   │   ├── blocks/TourGrid.vue                   (GEÄNDERT: Typen angepasst)
│   │   ├── Tour/
│   │   │   ├── TourHero.vue                      (NEU)
│   │   │   ├── TourFactsBar.vue                  (NEU)
│   │   │   ├── TourHighlights.vue                (NEU)
│   │   │   ├── TourGallery.vue                   (NEU — shadcn Carousel + Loop)
│   │   │   ├── TourIncluded.vue                  (NEU — Grid Dabei/Nicht dabei)
│   │   │   ├── TourOrganizational.vue            (NEU — Treffpunkt/Saison/Preis)
│   │   │   ├── TourCTA.vue                       (NEU — Primary CTA-Block)
│   │   │   └── TourStickyMobileCTA.vue           (NEU — Sticky-Leiste, Mobile)
│   │   └── ui/carousel/                          (NEU — via `npx shadcn-vue add carousel`)
│   └── pages/
│       └── touren/
│           └── [slug].vue                        (NEU — Detailseite)
├── server/
│   ├── api/content/
│   │   ├── block.get.ts                          (GEÄNDERT: `block_tourGrid` zieht Relationen)
│   │   └── tour.get.ts                           (NEU — single tour by slug)
│   └── utils/
│       └── directus-types.ts                     (GEÄNDERT/NEU: Tour-Type)
└── scripts/
    ├── create-touren-schema.mjs                  (NEU — idempotent)
    ├── seed-touren.mjs                           (NEU — 3 Records + M2M-Verknüpfungen)
    ├── upload-touren-gallery.mjs                 (NEU — SVG-Upload + M2M)
    └── migrate-block-tourgrid.mjs                (NEU — JSON → M2M)
```

### 4.2 Komponenten-Grenzen (für Isolation & Testbarkeit)

- **`TourCard.vue`** — reine Präsentation; kennt nur Kachel-Props (`slug` neu) + emittiert keinen State.
- **`pages/touren/[slug].vue`** — Daten-Orchestrator: zieht die Tour, übergibt Daten an Sektions-Komponenten.
- **Sektions-Komponenten** (`TourHero`, `TourFactsBar`, …) — jeweils genau *eine* Sektion, typisierte Props, kein eigener Fetch.
- **`TourGallery.vue`** — gekapselter Carousel-Wrapper; kennt nur `images: { id, title?, url }[]`.
- **`TourStickyMobileCTA.vue`** — sichtbar unter `md:`; disabled wenn `booking_url` leer.

### 4.3 API-Endpoints

**`GET /api/content/block?collection=block_tourGrid&id=…`**
Erweitertes `fields`-Query, holt eingebettete Tour-Kachel-Daten:
```
fields=id,eyebrow,headline,lead,cta_label,cta_href,
       tours.touren_id.id,
       tours.touren_id.slug,
       tours.touren_id.title,
       tours.touren_id.region,
       tours.touren_id.difficulty,
       tours.touren_id.variant,
       tours.touren_id.distance,
       tours.touren_id.ascent,
       tours.touren_id.duration
&deep[tours][_sort]=sort
&filter[tours][touren_id][status][_eq]=published
```
Response wird im Server-Endpoint auf die flache FE-Struktur gemappt:
```ts
{ ...block, tours: block.tours.map(t => t.touren_id) }
```
→ Das FE-Component-Vertrag bleibt identisch.

**`GET /api/content/tour?slug=koenigssee-rundweg`** (neu)
```
fields=*,gallery.directus_files_id.id,
         gallery.directus_files_id.title,
         gallery.directus_files_id.filename_disk
filter[slug][_eq]=<slug>
filter[status][_eq]=published
limit=1
```
Server mapped Response auf:
```ts
{ ...tour, gallery: tour.gallery.map(g => g.directus_files_id) }
```
404 wenn nicht gefunden (`setResponseStatus(event, 404)` + `throw createError`).

### 4.4 Detailseiten-Layout (top → bottom)

1. **Breadcrumb** — `Home / Touren / {title}` (semantisch, `<nav aria-label="Breadcrumb">`)
2. **Hero** — große `IllustrationsTourIllustration` (hochskaliert auf Variant), Badge-Gruppe (Region, Difficulty), `h1={title}`, `subtitle`, Primary-Button „Jetzt buchen" (disabled wenn `booking_url` leer)
3. **Fakten-Leiste** — 4 Chips horizontal (Distanz · Aufstieg · Dauer · Gruppengröße), statisch, scrollt mit
4. **Intro** — Fließtext (max-w-prose)
5. **Highlights** — 2-Spalten-Liste mit Check-Icons (`lucide:check`)
6. **Gallery** — shadcn Carousel mit `:opts="{ loop: true, align: 'start' }"`, 4 SVGs als `<img>` in `<CarouselItem>`, Prev/Next-Buttons
7. **Dabei / Nicht dabei** — zwei Spalten, grüne Check- / rote X-Icons
8. **Organisatorisches** — Info-Karte mit Treffpunkt, Saison, Preis „ab X €"
9. **CTA-Block** — Primary-Button „Jetzt buchen" + Ghost-Button „Zurück zur Übersicht" (`href="/#touren"`)
10. **Sticky Mobile-CTA** — `fixed bottom-0`, nur auf `< md`, safe-area-inset-bottom berücksichtigt

## 5. SVG-Assets

### 5.1 Entwurfs-Spezifikation

- **Stil:** Flat + sanfte Gradients, passend zu `docs/specs/alpen-wandern.md` (Waldgrün-Primary, Bergnebel-Blau, Sonnenaufgangs-Orange).
- **Format:** SVG, `viewBox="0 0 800 500"`, keine externen Fonts, keine Raster-Images, ID-Namespacing pro Datei (`id="kz-sun"`, `id="dz-peak"`) um Konflikte bei Inline-Einbettung zu vermeiden.
- **Szenen pro Tour (je 4):**
  - **Königssee-Rundweg** (alpine-see): `01-see-morgens.svg`, `02-wanderweg-ufer.svg`, `03-malerwinkel.svg`, `04-boot-anlegestelle.svg`
  - **Drei-Zinnen-Umrundung** (hochgebirge): `01-drei-gipfel.svg`, `02-schutzhuette.svg`, `03-wanderer-pass.svg`, `04-sonnenuntergang-felswand.svg`
  - **Watzmann-Überschreitung** (almwiese): `01-gipfelkreuz.svg`, `02-almhuette-kuehe.svg`, `03-wanderer-grat.svg`, `04-murmeltier-wiese.svg`

### 5.2 Upload-Workflow

1. SVGs in `backup/exports/touren/<slug>/01…04-*.svg` schreiben.
2. `scripts/upload-touren-gallery.mjs` ausführen:
   - Legt Directus-Ordner `touren-gallery` an (via `POST /folders`), falls nicht vorhanden.
   - Upload pro SVG via `POST /files` (multipart/form-data), Felder `folder`, `title`, `description` setzen.
   - Legt pro Tour M2M-Einträge in `touren_files` an (sort = Index aus Dateinamen-Präfix).
3. **Fallback:** Bei Fehler (z. B. MIME-Type-Blockade) bricht das Skript mit Exit-Code `2` ab und schreibt `backup/exports/touren/UPLOAD-MANUAL.md` mit der Zuordnungstabelle für händischen Upload.

## 6. Error-Handling & Edge Cases

- **Tour-Detailseite: Slug existiert nicht** → 404 via `createError({ statusCode: 404 })`.
- **Tour: `status != published`** → identisch 404 (Filter im Endpoint greift).
- **`booking_url` leer** → CTA-Buttons gerendert mit `disabled` + Text „Buchung in Kürze".
- **Gallery leer** → Sektion wird nicht gerendert (`v-if="tour.gallery?.length"`).
- **Block ohne gewählte Touren** → bestehendes `v-if="block.tours?.length"`-Pattern greift.
- **Directus-Files mit leerem `title`** → Alt-Text fällt auf `${tour.title} — Bild ${index + 1}` zurück.

## 7. Teststrategie

- **Schema-Script idempotent:** erneutes Ausführen wirft keine Fehler (`Field already exists` → skip), verifiziert über zweimal Aufrufen in der manuellen Testphase.
- **Seed-Script:** Prüft vor Insert auf existierenden Slug (kein Duplicate).
- **Migrations-Script:** Läuft in Dry-Run-Mode mit `--dry` (gibt geplante Mutations aus, schreibt nicht).
- **FE-Smoketests manuell im Browser:**
  1. Home lädt, Kacheln zeigen gleiche Daten wie vorher, neuer Details-Button.
  2. Klick auf Details → `/touren/koenigssee-rundweg` rendert alle Sektionen.
  3. Carousel scrollt mit Loop (letztes → erstes).
  4. Sticky-CTA nur auf Mobile sichtbar (< md Breakpoint).
  5. Nicht-existierender Slug → 404-Seite.
- **TypeScript:** `yarn build` als harter Gate — kein Merge bei Type-Fehler.

## 8. Non-Goals (explizit ausgeschlossen)

- Buchungs-Flow (`/booking`-Seite, Zahlungs-Integration) — eigener Spec-Zyklus.
- Mehrsprachigkeit (i18n) — Content ist zur Zeit deutsch-only.
- Filter/Suche auf einer Touren-Übersichtsseite — aktuell existiert kein `/touren`-Index, nur Anker `/#touren`.
- Karten/Geo-Features, GPX-Downloads.
- Redaktionelles Management von Kachel-Illustrationen als Files (bleibt `variant`-basiert).
- Bild-Optimierung / Responsive Srcset — SVGs skalieren nativ.

## 9. Entscheidungslog

| # | Entscheidung | Alternative | Grund |
|---|---|---|---|
| 1 | Deutsche Collection-Keys (`touren`) | Englisch (`tours`) | Konsistenz mit Projekt-Sprache; Feldnamen bleiben englisch für Dev-Konsistenz |
| 2 | Slug manuell pflegen | Auto-Slugify on save | Keine zusätzliche Extension/Flow nötig; 3 Datensätze |
| 3 | JSON-Tag-Listen für highlights/included | Eigene O2M-Collection | Keine Metadaten pro Stichpunkt nötig; YAGNI |
| 4 | Kuratierte M2M im Block | Auto-Feed aller published | Entspricht heutigem Verhalten; volle Redaktions-Kontrolle |
| 5 | Dedizierte Route `/touren/[slug]` | In Catch-all einhängen | Klare Trennung CMS-Seiten vs. Touren |
| 6 | Kachel-Illustration als Vue-Component | Directus-File pro Tour | Null Änderungsrisiko an Home-Grid, visuelle Konsistenz |
| 7 | Hero nutzt dieselbe Illustration | Eigenes Hero-SVG | Konsistenz Kachel↔Detailseite; keine Extra-Assets |
| 8 | Sticky Mobile-CTA zusätzlich | Nur Top/Bottom-CTA | Bessere Mobile-Konversion |
