# Buchungssystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a booking system to Alpenpfad: tour termine (fixed departure dates) as a new Directus collection, booking requests with hybrid "fixed termin or Wunschdatum" selection, on-the-fly capacity checks, self-service cancellation in `/konto/buchungen`, and hybrid email notifications (Nuxt sends most mails; a Directus webhook triggers mails for admin-side status changes).

**Architecture:** Three layers. (1) **Directus:** new collections `tour_termine` and `buchungen`, four new permissions on the existing "Kunde" policy, `RESTRICT` on all foreign keys. (2) **Nuxt server:** `/api/buchungen/*` routes run auth-protected, validate, compute capacity via `server/utils/kapazitaet.ts`, send mails via `server/utils/mailer.ts` (nodemailer). A `/api/internal/booking-status-changed` webhook endpoint receives Directus status-change events and sends corresponding mails, with idempotency guarded by a `last_notified_status` field on each booking. (3) **Nuxt client:** `useBuchungen` composable, `/touren/<slug>/buchen` page for the form, `/konto/buchungen(/[id])` for the self-service overview, tour-detail page augmented with a `TourTermine` list and a newly-wired "Jetzt buchen" CTA.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, TypeScript, Directus 11.6.1 + `@directus/sdk` 21.x, `nodemailer` 7.x, shadcn-vue (adds `badge`, `select`, `textarea`, `alert-dialog`, `tooltip`, `card`), Tailwind v4, Node 22+ scripts (native `fetch`).

**Reference spec:** [backup/docs/superpowers/specs/2026-04-22-buchungen-design.md](../specs/2026-04-22-buchungen-design.md)

**Testing approach:** Identical to auth feature — no test framework. Verification via: `yarn build` (type-check gate), Node-script idempotency (re-run → same output), curl smoketests for API routes, manual browser checks for UI. Do NOT scaffold a test framework.

**Working directory for all commands:** `backup/` (the Nuxt project root).

**Verification gate:** `yarn build 2>&1 | tail -5` must be green. NOT `yarn nuxi typecheck` — pre-existing vue-tsc tooling failures unrelated to this work.

**Commit discipline:** Explicit paths only. Never `git add -A` or `git add .` — `backup/.env.example` has a pre-existing modification that must not be staged.

---

## File Structure

**New files:**
```
backup/
├── app/
│   ├── components/
│   │   ├── Buchung/
│   │   │   ├── BuchungForm.vue
│   │   │   ├── TerminSelect.vue
│   │   │   ├── BuchungCard.vue
│   │   │   ├── BuchungStatusBadge.vue
│   │   │   └── BuchungDetail.vue
│   │   ├── Tour/
│   │   │   └── TourTermine.vue
│   │   └── ui/
│   │       ├── badge/         (shadcn-vue generated)
│   │       ├── select/        (shadcn-vue generated)
│   │       ├── textarea/      (shadcn-vue generated)
│   │       ├── alert-dialog/  (shadcn-vue generated)
│   │       ├── tooltip/       (shadcn-vue generated)
│   │       └── card/          (shadcn-vue generated)
│   ├── composables/
│   │   └── useBuchungen.ts
│   └── pages/
│       ├── touren/
│       │   └── [slug]/
│       │       └── buchen.vue
│       └── konto/
│           └── buchungen/
│               ├── index.vue
│               └── [id].vue
├── server/
│   ├── api/
│   │   ├── buchungen/
│   │   │   ├── index.post.ts
│   │   │   ├── index.get.ts
│   │   │   ├── [id].get.ts
│   │   │   └── [id]/
│   │   │       └── cancel.post.ts
│   │   └── internal/
│   │       └── booking-status-changed.post.ts
│   └── utils/
│       ├── kapazitaet.ts
│       └── mailer.ts
├── shared/types/
│   └── buchung.ts
└── scripts/
    ├── buchungen-setup.mjs
    └── buchungen-seed-termine.mjs
```

**Modified files:**
```
backup/
├── app/
│   ├── pages/
│   │   └── touren/[slug].vue        (wire CTA to /buchen, render TourTermine)
│   └── pages/konto/index.vue        (add "Meine Buchungen" link/tab)
├── server/api/content/tour.get.ts   (include termine[] with verfügbare_plätze)
├── package.json                      (add nodemailer dep + buchungen script entry)
└── .env.example                      (DO NOT STAGE — pre-existing dirty state; document mentally but don't commit)
```

---

## Phase 1 — Backend (Directus schema + permissions)

### Task 1: Setup script — `tour_termine`, `buchungen`, permissions on Kunde policy

**Files:**
- Create: `scripts/buchungen-setup.mjs`
- Modify: `package.json` (add yarn script entry)

Idempotent script. Creates `tour_termine` collection + fields + relation to `touren`. Creates `buchungen` collection + fields + relations to `touren`, `tour_termine`, `directus_users`. Appends 4 new permissions to the existing "Kunde Policy" (created by `auth-setup.mjs`). Ends with a printed checklist for the manual webhook-flow setup in Directus UI.

- [ ] **Step 1: Write the script**

Write `scripts/buchungen-setup.mjs`:

```javascript
/**
 * Idempotently creates `tour_termine` + `buchungen` collections, their
 * relations, and the 4 new permissions on the existing "Kunde Policy".
 * Safe to re-run; only creates what's missing.
 */
import { directus } from './directus.mjs';
import {
  readCollections,
  readFieldsByCollection,
  readRelations,
  createCollection,
  createField,
  updateField,
  createRelation,
  readPolicies,
  readPermissions,
  createPermission,
} from '@directus/sdk';

const STATUS_TERMIN = {
  choices: [
    { text: 'Veröffentlicht', value: 'published' },
    { text: 'Entwurf', value: 'draft' },
    { text: 'Archiviert', value: 'archived' },
  ],
};

const STATUS_BUCHUNG = {
  choices: [
    { text: 'Angefragt', value: 'angefragt' },
    { text: 'Bestätigt', value: 'bestaetigt' },
    { text: 'Storniert', value: 'storniert' },
    { text: 'Abgelehnt', value: 'abgelehnt' },
    { text: 'Durchgeführt', value: 'durchgefuehrt' },
  ],
};

async function ensureCollection(name, meta) {
  const cols = await directus.request(readCollections());
  if (cols.find((c) => c.collection === name)) {
    console.log(`  ✓ collection ${name}`);
    return false;
  }
  await directus.request(
    createCollection({
      collection: name,
      meta: { hidden: false, singleton: false, ...meta },
      schema: {},
      fields: [
        {
          field: 'id',
          type: 'uuid',
          meta: { hidden: true, interface: 'input', readonly: true, special: ['uuid'] },
          schema: { is_primary_key: true },
        },
      ],
    }),
  );
  console.log(`  + created collection ${name}`);
  return true;
}

async function ensureFields(collection, defs) {
  const existing = await directus.request(readFieldsByCollection(collection));
  const have = new Set(existing.map((f) => f.field));
  for (const def of defs) {
    if (have.has(def.field)) {
      console.log(`    ✓ ${collection}.${def.field}`);
      continue;
    }
    await directus.request(createField(collection, def));
    console.log(`    + ${collection}.${def.field}`);
  }
}

async function ensureRelation(collection, field, related_collection, meta = {}, schema = {}) {
  const rels = await directus.request(readRelations());
  const found = rels.find((r) => r.collection === collection && r.field === field);
  if (found) {
    console.log(`    ✓ relation ${collection}.${field} → ${related_collection}`);
    return;
  }
  await directus.request(
    createRelation({
      collection,
      field,
      related_collection,
      meta,
      schema: { on_delete: 'RESTRICT', ...schema },
    }),
  );
  console.log(`    + relation ${collection}.${field} → ${related_collection}`);
}

async function ensurePermission(policyId, collection, action, perm) {
  const existing = await directus.request(
    readPermissions({
      filter: { policy: { _eq: policyId }, collection: { _eq: collection }, action: { _eq: action } },
      limit: 1,
    }),
  );
  if (existing.length) {
    console.log(`    ✓ permission ${collection}.${action}`);
    return;
  }
  await directus.request(
    createPermission({ policy: policyId, collection, action, ...perm }),
  );
  console.log(`    + permission ${collection}.${action}`);
}

async function run() {
  // ---- tour_termine ----
  console.log('→ tour_termine collection');
  await ensureCollection('tour_termine', {
    icon: 'event',
    note: 'Feste Abfahrtstermine pro Tour',
    display_template: '{{ tour.title }} — {{ date_from }}',
    sort_field: 'sort',
    archive_field: 'status',
    archive_value: 'archived',
    unarchive_value: 'draft',
  });

  await ensureFields('tour_termine', [
    {
      field: 'status',
      type: 'string',
      schema: { default_value: 'published', is_nullable: false },
      meta: {
        interface: 'select-dropdown',
        options: STATUS_TERMIN,
        width: 'half',
        required: true,
        display: 'labels',
        display_options: { choices: STATUS_TERMIN.choices, showAsDot: true },
      },
    },
    {
      field: 'sort',
      type: 'integer',
      schema: {},
      meta: { interface: 'input', hidden: true },
    },
    {
      field: 'date_created',
      type: 'timestamp',
      schema: {},
      meta: { interface: 'datetime', readonly: true, hidden: true, special: ['date-created'], width: 'half' },
    },
    {
      field: 'date_updated',
      type: 'timestamp',
      schema: {},
      meta: { interface: 'datetime', readonly: true, hidden: true, special: ['date-updated'], width: 'half' },
    },
    {
      field: 'tour',
      type: 'uuid',
      schema: { is_nullable: false },
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true, width: 'full' },
    },
    {
      field: 'date_from',
      type: 'date',
      schema: { is_nullable: false },
      meta: { interface: 'datetime', required: true, width: 'half', note: 'Anreise-Datum' },
    },
    {
      field: 'date_to',
      type: 'date',
      schema: { is_nullable: false },
      meta: { interface: 'datetime', required: true, width: 'half', note: 'Abreise-Datum' },
    },
    {
      field: 'price_override',
      type: 'integer',
      schema: {},
      meta: { interface: 'input', width: 'half', note: 'Pro Person in EUR (optional — ersetzt tour.price_from)' },
    },
    {
      field: 'hinweis',
      type: 'string',
      schema: { max_length: 500 },
      meta: { interface: 'input', width: 'full', note: 'Kurzer Hinweis, z. B. Treffpunkt' },
    },
  ]);

  await ensureRelation('tour_termine', 'tour', 'touren', { sort_field: 'sort' });

  // ---- buchungen ----
  console.log('→ buchungen collection');
  await ensureCollection('buchungen', {
    icon: 'confirmation_number',
    note: 'Buchungsanfragen',
    display_template: '{{ tour.title }} — {{ personen_anzahl }} Pers. ({{ status }})',
    archive_field: 'status',
    archive_value: 'archived',
  });

  await ensureFields('buchungen', [
    {
      field: 'status',
      type: 'string',
      schema: { default_value: 'angefragt', is_nullable: false },
      meta: {
        interface: 'select-dropdown',
        options: STATUS_BUCHUNG,
        width: 'half',
        required: true,
        display: 'labels',
        display_options: { choices: STATUS_BUCHUNG.choices, showAsDot: true },
      },
    },
    {
      field: 'date_created',
      type: 'timestamp',
      schema: {},
      meta: { interface: 'datetime', readonly: true, hidden: false, special: ['date-created'], width: 'half' },
    },
    {
      field: 'date_updated',
      type: 'timestamp',
      schema: {},
      meta: { interface: 'datetime', readonly: true, hidden: false, special: ['date-updated'], width: 'half' },
    },
    {
      field: 'user',
      type: 'uuid',
      schema: { is_nullable: false },
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true, width: 'half', note: 'Buchender User' },
    },
    {
      field: 'tour',
      type: 'uuid',
      schema: { is_nullable: false },
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true, width: 'half' },
    },
    {
      field: 'termin',
      type: 'uuid',
      schema: {},
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half', note: 'Fester Termin (null wenn Wunschdatum)' },
    },
    {
      field: 'wunsch_datum',
      type: 'date',
      schema: {},
      meta: { interface: 'datetime', width: 'half', note: 'Wunschdatum (null wenn fester Termin)' },
    },
    {
      field: 'personen_anzahl',
      type: 'integer',
      schema: { is_nullable: false },
      meta: { interface: 'input', required: true, width: 'half' },
    },
    {
      field: 'preis_gesamt',
      type: 'integer',
      schema: { is_nullable: false },
      meta: { interface: 'input', required: true, width: 'half', readonly: true, note: 'Snapshot beim Submit (EUR)' },
    },
    {
      field: 'kontakt_vorname',
      type: 'string',
      schema: { is_nullable: false, max_length: 255 },
      meta: { interface: 'input', required: true, width: 'half' },
    },
    {
      field: 'kontakt_nachname',
      type: 'string',
      schema: { is_nullable: false, max_length: 255 },
      meta: { interface: 'input', required: true, width: 'half' },
    },
    {
      field: 'kontakt_email',
      type: 'string',
      schema: { is_nullable: false, max_length: 255 },
      meta: { interface: 'input', required: true, width: 'half' },
    },
    {
      field: 'kontakt_telefon',
      type: 'string',
      schema: { is_nullable: false, max_length: 64 },
      meta: { interface: 'input', required: true, width: 'half' },
    },
    {
      field: 'notizen',
      type: 'text',
      schema: {},
      meta: { interface: 'input-multiline', width: 'full', note: 'Besondere Wünsche (optional)' },
    },
    {
      field: 'last_notified_status',
      type: 'string',
      schema: { max_length: 32 },
      meta: {
        interface: 'input',
        hidden: true,
        readonly: true,
        note: 'Intern — letzter Status, zu dem eine Mail versendet wurde (Dedup).',
      },
    },
  ]);

  await ensureRelation('buchungen', 'user', 'directus_users');
  await ensureRelation('buchungen', 'tour', 'touren');
  await ensureRelation('buchungen', 'termin', 'tour_termine');

  // ---- Permissions ----
  console.log('→ Permissions (Kunde Policy)');
  const policies = await directus.request(
    readPolicies({ filter: { name: { _eq: 'Kunde Policy' } }, limit: 1 }),
  );
  if (!policies.length) {
    throw new Error('Kunde Policy nicht gefunden — bitte erst auth-setup.mjs ausführen.');
  }
  const policyId = policies[0].id;

  await ensurePermission(policyId, 'buchungen', 'create', {
    fields: [
      'tour', 'termin', 'wunsch_datum', 'personen_anzahl',
      'kontakt_vorname', 'kontakt_nachname', 'kontakt_email', 'kontakt_telefon',
      'notizen',
    ],
    permissions: {},
    validation: {},
  });

  await ensurePermission(policyId, 'buchungen', 'read', {
    fields: ['*'],
    permissions: { user: { _eq: '$CURRENT_USER' } },
  });

  await ensurePermission(policyId, 'buchungen', 'update', {
    fields: ['status'],
    permissions: {
      _and: [
        { user: { _eq: '$CURRENT_USER' } },
        { status: { _in: ['angefragt', 'bestaetigt'] } },
      ],
    },
  });

  await ensurePermission(policyId, 'tour_termine', 'read', {
    fields: ['*'],
    permissions: { status: { _eq: 'published' } },
  });

  console.log('\n✓ Buchungen-Setup abgeschlossen.\n');
  console.log('Nächste manuelle Schritte in Directus Admin-UI:');
  console.log('  1. Settings → Flows → "+ Create Flow"');
  console.log('     Name: "Buchung Status Webhook"');
  console.log('     Trigger: Event → items.buchungen.update');
  console.log('     Filter Rule: { "status": { "_in": ["bestaetigt", "abgelehnt", "storniert"] } }');
  console.log('     Operation: Webhook');
  console.log('       URL: <NUXT_BASE_URL>/api/internal/booking-status-changed');
  console.log('       Method: POST');
  console.log('       Headers: { "X-Internal-Secret": "<INTERNAL_WEBHOOK_SECRET aus .env>" }');
  console.log('       Request Body: $trigger (Default)');
  console.log('  2. Testen: Im Directus Admin eine Buchung anlegen, Status auf bestaetigt setzen,');
  console.log('     prüfen dass Mail ankommt.\n');
}

run().catch((err) => {
  console.error('✗ failed:', err?.errors ?? err);
  process.exit(1);
});
```

- [ ] **Step 2: Add yarn script entry**

Edit `backup/package.json` — add this line to the `"scripts"` object:

```json
"buchungen:setup": "node scripts/buchungen-setup.mjs"
```

Final scripts block should look like this (order near the other setup scripts):

```json
"scripts": {
  "build": "nuxt build",
  "dev": "nuxt dev",
  "generate": "nuxt generate",
  "preview": "nuxt preview",
  "postinstall": "nuxt prepare",
  "touren:schema": "node scripts/touren-schema.mjs",
  "touren:upload": "node scripts/touren-upload-gallery.mjs",
  "touren:seed": "node scripts/touren-seed.mjs",
  "touren:migrate": "node scripts/touren-migrate-blockgrid.mjs",
  "auth:setup": "node scripts/auth-setup.mjs",
  "buchungen:setup": "node scripts/buchungen-setup.mjs"
}
```

- [ ] **Step 3: Run it and verify**

```bash
yarn buchungen:setup
```

Expected first run output (collections/fields/permissions being created):
```
→ tour_termine collection
  + created collection tour_termine
    + tour_termine.status
    + tour_termine.sort
    ...
    + relation tour_termine.tour → touren
→ buchungen collection
  + created collection buchungen
    + buchungen.status
    ...
    + buchungen.last_notified_status
    + relation buchungen.user → directus_users
    + relation buchungen.tour → touren
    + relation buchungen.termin → tour_termine
→ Permissions (Kunde Policy)
    + permission buchungen.create
    + permission buchungen.read
    + permission buchungen.update
    + permission tour_termine.read

✓ Buchungen-Setup abgeschlossen.
...
```

- [ ] **Step 4: Re-run for idempotency**

```bash
yarn buchungen:setup
```

Expected: every line has `✓` (no `+` new creates).

- [ ] **Step 5: Verify via curl**

```bash
TOKEN=$(grep '^DIRECTUS_TOKEN=' .env | cut -d= -f2)
URL=$(grep '^DIRECTUS_URL=' .env | cut -d= -f2)
curl -s -H "Authorization: Bearer $TOKEN" "$URL/collections/tour_termine" | jq '.data.collection'
curl -s -H "Authorization: Bearer $TOKEN" "$URL/collections/buchungen" | jq '.data.collection'
```

Expected: `"tour_termine"` then `"buchungen"`.

- [ ] **Step 6: Commit**

```bash
git add scripts/buchungen-setup.mjs package.json
git commit -m "feat(buchungen): add Directus schema + permissions setup script"
```

---

## Phase 2 — Server foundation (types, utils, mailer)

### Task 2: Shared types for Buchung + Termin

**Files:**
- Create: `shared/types/buchung.ts`

Central types used by both server routes and client composable/components. Mirrors the `AuthResult<T>` pattern.

- [ ] **Step 1: Write the types file**

Write `shared/types/buchung.ts`:

```typescript
export type BuchungStatus =
  | 'angefragt'
  | 'bestaetigt'
  | 'storniert'
  | 'abgelehnt'
  | 'durchgefuehrt'

export type TerminPublic = {
  id: string
  date_from: string   // ISO date "2026-06-12"
  date_to: string
  price_override: number | null
  hinweis: string | null
  verfuegbare_plaetze: number   // -1 wenn tour.group_size_max null (unbegrenzt)
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
```

- [ ] **Step 2: Verify typecheck**

```bash
yarn build 2>&1 | tail -5
```

Expected: build green (no TypeScript errors).

- [ ] **Step 3: Commit**

```bash
git add shared/types/buchung.ts
git commit -m "feat(buchungen): add shared types for bookings and termine"
```

---

### Task 3: Server util `kapazitaet.ts` — belegung aggregation

**Files:**
- Create: `server/utils/kapazitaet.ts`

Single Directus call with Admin-Token, returns `Record<terminId, belegtePersonen>`. Used by the tour-content API and by the booking POST for capacity validation.

- [ ] **Step 1: Write the util**

Write `server/utils/kapazitaet.ts`:

```typescript
import { readItems } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'

/**
 * For each termin id in `terminIds`, sum personen_anzahl across
 * non-cancelled/non-rejected buchungen. Missing ids map to 0.
 */
export async function getBelegungProTermin(
  terminIds: string[],
): Promise<Record<string, number>> {
  if (terminIds.length === 0) return {}

  const directus = useDirectusServer()
  const rows = (await directus.request(
    readItems('buchungen', {
      filter: {
        termin: { _in: terminIds },
        status: { _nin: ['storniert', 'abgelehnt'] },
      },
      fields: ['termin', 'personen_anzahl'],
      limit: -1,
    }),
  )) as Array<{ termin: string; personen_anzahl: number }>

  const result: Record<string, number> = {}
  for (const id of terminIds) result[id] = 0
  for (const r of rows) {
    result[r.termin] = (result[r.termin] ?? 0) + r.personen_anzahl
  }
  return result
}
```

- [ ] **Step 2: Verify build**

```bash
yarn build 2>&1 | tail -5
```

Expected: build green.

- [ ] **Step 3: Commit**

```bash
git add server/utils/kapazitaet.ts
git commit -m "feat(buchungen): add capacity aggregation util"
```

---

### Task 4: Install `nodemailer` and write the mailer util

**Files:**
- Modify: `backup/package.json` (add dep)
- Create: `server/utils/mailer.ts`

Wrapper around nodemailer with 5 template functions. Reads SMTP config from runtime env.

- [ ] **Step 1: Install nodemailer**

```bash
yarn add nodemailer
yarn add -D @types/nodemailer
```

Verify `package.json` now contains `nodemailer` in `dependencies` and `@types/nodemailer` in `devDependencies`.

- [ ] **Step 2: Write the mailer util**

Write `server/utils/mailer.ts`:

```typescript
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
  // ISO "2026-06-12" → "12.06.2026"
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
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
      return { subject, text, html: `<pre>${text}</pre>` }
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
      return { subject, text, html: `<pre>${text}</pre>` }
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
      return { subject, text, html: `<pre>${text}</pre>` }
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
      return { subject, text, html: `<pre>${text}</pre>` }
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
      return { subject, text, html: `<pre>${text}</pre>` }
    }
  }
}
```

- [ ] **Step 3: Verify build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add server/utils/mailer.ts package.json yarn.lock
git commit -m "feat(buchungen): add nodemailer-based mailer util with 5 templates"
```

---

## Phase 3 — Server API routes

### Task 5: `POST /api/buchungen` — create booking + send mails 1 & 2

**Files:**
- Create: `server/api/buchungen/index.post.ts`

End-to-end: auth-check via cookie, zod-validate body, cross-field check (`termin XOR wunsch_datum`), fetch tour/termin, capacity check, compute price snapshot, insert via Admin-Token, send admin + eingangsbestätigung mails.

- [ ] **Step 1: Write the handler**

Write `server/api/buchungen/index.post.ts`:

```typescript
import { readItems, createItem, readItem, readMe } from '@directus/sdk'
import type { BuchungCreateInput, BuchungResult, BuchungDetail } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getBelegungProTermin } from '~~/server/utils/kapazitaet'
import { sendMail, renderBuchungTemplate } from '~~/server/utils/mailer'
import { getAccessToken } from '~~/server/utils/auth-cookies'
import { createUserClient } from '~~/server/utils/directus-user'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default defineEventHandler(async (event): Promise<BuchungResult<BuchungDetail>> => {
  const token = getAccessToken(event)
  if (!token) {
    return { ok: false, error: 'unauthorized', message: 'Bitte melde dich an.' }
  }
  let userId: string
  try {
    const client = createUserClient(token)
    const me = (await client.request(readMe({ fields: ['id'] }))) as { id: string }
    userId = me.id
  } catch {
    return { ok: false, error: 'unauthorized', message: 'Session ungültig.' }
  }

  const body = await readBody<BuchungCreateInput>(event)
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'server_error', message: 'Ungültige Anfrage.' }
  }

  // Basic field validation
  if (!body.tour || typeof body.tour !== 'string') {
    return { ok: false, error: 'tour_not_found', message: 'Tour fehlt.' }
  }
  if (!Number.isInteger(body.personen_anzahl) || body.personen_anzahl < 1) {
    return { ok: false, error: 'personen_anzahl_invalid', message: 'Personenzahl ungültig.' }
  }
  if (!body.kontakt_vorname || !body.kontakt_nachname) {
    return { ok: false, error: 'server_error', message: 'Bitte Vor- und Nachname angeben.' }
  }
  if (!body.kontakt_email || !EMAIL_REGEX.test(body.kontakt_email)) {
    return { ok: false, error: 'invalid_email', message: 'Kontakt-E-Mail ist ungültig.' }
  }
  if (!body.kontakt_telefon) {
    return { ok: false, error: 'server_error', message: 'Bitte Telefonnummer angeben.' }
  }

  // XOR termin / wunsch_datum
  const hasTermin = !!body.termin
  const hasWunsch = !!body.wunsch_datum
  if (!hasTermin && !hasWunsch) {
    return {
      ok: false,
      error: 'missing_termin_or_wunsch',
      message: 'Bitte wähle einen Termin oder gib ein Wunschdatum an.',
    }
  }
  if (hasTermin && hasWunsch) {
    return {
      ok: false,
      error: 'both_termin_and_wunsch',
      message: 'Bitte wähle entweder einen festen Termin ODER ein Wunschdatum.',
    }
  }
  if (hasWunsch && !ISO_DATE.test(body.wunsch_datum!)) {
    return { ok: false, error: 'wunsch_datum_past', message: 'Wunschdatum hat ein ungültiges Format.' }
  }
  if (hasWunsch && body.wunsch_datum! < today()) {
    return { ok: false, error: 'wunsch_datum_past', message: 'Wunschdatum muss in der Zukunft liegen.' }
  }

  const directus = useDirectusServer()

  // Load tour
  const tours = (await directus.request(
    readItems('touren', {
      filter: { id: { _eq: body.tour }, status: { _eq: 'published' } },
      fields: ['id', 'title', 'slug', 'price_from', 'group_size_max', 'status'],
      limit: 1,
    }),
  )) as Array<{
    id: string
    title: string
    slug: string
    price_from: number | null
    group_size_max: number | null
    status: string
  }>
  if (tours.length === 0) {
    return { ok: false, error: 'tour_not_found', message: 'Tour nicht gefunden.' }
  }
  const tour = tours[0]

  // If termin given: validate + capacity
  let priceEinzeln = tour.price_from ?? 0
  if (hasTermin) {
    const termin = (await directus
      .request(
        readItem('tour_termine', body.termin!, {
          fields: ['id', 'tour', 'date_from', 'price_override', 'status'],
        }),
      )
      .catch(() => null)) as
      | { id: string; tour: string; date_from: string; price_override: number | null; status: string }
      | null

    if (!termin) {
      return { ok: false, error: 'termin_invalid', message: 'Termin nicht gefunden.' }
    }
    if (termin.tour !== tour.id) {
      return { ok: false, error: 'termin_invalid', message: 'Termin gehört zu einer anderen Tour.' }
    }
    if (termin.status !== 'published') {
      return { ok: false, error: 'termin_invalid', message: 'Termin ist nicht verfügbar.' }
    }
    if (termin.date_from < today()) {
      return { ok: false, error: 'termin_past', message: 'Termin liegt in der Vergangenheit.' }
    }
    if (termin.price_override !== null) {
      priceEinzeln = termin.price_override
    }

    // Capacity check (skip if group_size_max null = unlimited)
    if (tour.group_size_max !== null) {
      const belegung = await getBelegungProTermin([termin.id])
      const belegt = belegung[termin.id] ?? 0
      if (belegt + body.personen_anzahl > tour.group_size_max) {
        return {
          ok: false,
          error: 'termin_ausgebucht',
          message: 'Termin wurde gerade ausgebucht — bitte wähle einen anderen.',
        }
      }
    }
  }

  const preisGesamt = priceEinzeln * body.personen_anzahl

  // Insert
  const created = (await directus.request(
    createItem('buchungen', {
      status: 'angefragt',
      user: userId,
      tour: tour.id,
      termin: hasTermin ? body.termin : null,
      wunsch_datum: hasWunsch ? body.wunsch_datum : null,
      personen_anzahl: body.personen_anzahl,
      preis_gesamt: preisGesamt,
      kontakt_vorname: body.kontakt_vorname,
      kontakt_nachname: body.kontakt_nachname,
      kontakt_email: body.kontakt_email,
      kontakt_telefon: body.kontakt_telefon,
      notizen: body.notizen ?? null,
    }),
  )) as { id: string }

  // Fetch full detail for mails + response
  const detail = (await directus.request(
    readItem('buchungen', created.id, {
      fields: [
        'id', 'status', 'date_created', 'personen_anzahl', 'preis_gesamt',
        'kontakt_vorname', 'kontakt_nachname', 'kontakt_email', 'kontakt_telefon', 'notizen',
        'wunsch_datum',
        'tour.id', 'tour.slug', 'tour.title',
        'termin.id', 'termin.date_from', 'termin.date_to', 'termin.hinweis',
      ],
    }),
  )) as BuchungDetail

  // Mails (best-effort, log errors)
  const adminTo = process.env.EMAIL_ADMIN
  try {
    if (adminTo) {
      const t1 = renderBuchungTemplate('admin_neu', detail)
      await sendMail({ to: adminTo, subject: t1.subject, html: t1.html, text: t1.text })
    } else {
      console.warn('[buchungen] EMAIL_ADMIN not set — admin notification skipped')
    }
  } catch (err) {
    console.error('[buchungen] admin mail failed:', err)
  }
  try {
    const t2 = renderBuchungTemplate('user_eingangsbestaetigung', detail)
    await sendMail({ to: detail.kontakt_email, subject: t2.subject, html: t2.html, text: t2.text })
  } catch (err) {
    console.error('[buchungen] user confirmation mail failed:', err)
  }

  console.log('[buchungen] buchung_created', { buchung_id: detail.id, user_id: userId, tour_slug: detail.tour.slug })

  return { ok: true, data: detail }
})
```

- [ ] **Step 2: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 3: Manual smoketest**

Start dev server, log in via existing `/api/auth/login` to capture cookies, insert a fake `tour_termine` row first via Directus, then:

```bash
yarn dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 10

# Login
curl -c /tmp/cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"<existing-kunde>","password":"<pw>"}' \
  http://localhost:3000/api/auth/login | jq .ok

# Create booking (Wunschdatum)
TOUR_ID=$(curl -s "http://localhost:3000/api/content/tour?slug=koenigssee-rundweg" | jq -r '.id')
curl -b /tmp/cookies.txt -H 'Content-Type: application/json' \
  -d "{\"tour\":\"$TOUR_ID\",\"wunsch_datum\":\"2026-09-15\",\"personen_anzahl\":2,\"kontakt_vorname\":\"Test\",\"kontakt_nachname\":\"User\",\"kontakt_email\":\"test@example.com\",\"kontakt_telefon\":\"0123456789\"}" \
  http://localhost:3000/api/buchungen | jq .

kill $DEV_PID 2>/dev/null || taskkill //F //PID $DEV_PID 2>/dev/null
```

Expected: `{ "ok": true, "data": { "id": "<uuid>", "status": "angefragt", ... } }`. Mail errors in stderr are OK for now (if SMTP not configured — not a hard fail).

- [ ] **Step 4: Commit**

```bash
git add server/api/buchungen/index.post.ts
git commit -m "feat(buchungen): add POST /api/buchungen create endpoint"
```

---

### Task 6: `GET /api/buchungen` + `GET /api/buchungen/[id]`

**Files:**
- Create: `server/api/buchungen/index.get.ts`
- Create: `server/api/buchungen/[id].get.ts`

Both filter strictly on the current user's id; unknown-id returns 404 (never 403, to avoid leaking existence).

- [ ] **Step 1: Write the list endpoint**

Write `server/api/buchungen/index.get.ts`:

```typescript
import { readItems } from '@directus/sdk'
import { readMe } from '@directus/sdk'
import type { BuchungListItem, BuchungResult } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getAccessToken } from '~~/server/utils/auth-cookies'
import { createUserClient } from '~~/server/utils/directus-user'

export default defineEventHandler(async (event): Promise<BuchungResult<BuchungListItem[]>> => {
  const token = getAccessToken(event)
  if (!token) return { ok: false, error: 'unauthorized', message: 'Bitte melde dich an.' }

  let userId: string
  try {
    const client = createUserClient(token)
    const me = (await client.request(readMe({ fields: ['id'] }))) as { id: string }
    userId = me.id
  } catch {
    return { ok: false, error: 'unauthorized', message: 'Session ungültig.' }
  }

  const directus = useDirectusServer()
  const rows = (await directus.request(
    readItems('buchungen', {
      filter: { user: { _eq: userId } },
      fields: [
        'id', 'status', 'date_created', 'personen_anzahl', 'preis_gesamt',
        'wunsch_datum',
        'tour.id', 'tour.slug', 'tour.title',
        'termin.id', 'termin.date_from', 'termin.date_to', 'termin.hinweis',
      ],
      sort: ['-date_created'],
      limit: -1,
    }),
  )) as BuchungListItem[]

  return { ok: true, data: rows }
})
```

- [ ] **Step 2: Write the detail endpoint**

Write `server/api/buchungen/[id].get.ts`:

```typescript
import { readItems } from '@directus/sdk'
import { readMe } from '@directus/sdk'
import type { BuchungDetail, BuchungResult } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getAccessToken } from '~~/server/utils/auth-cookies'
import { createUserClient } from '~~/server/utils/directus-user'

export default defineEventHandler(async (event): Promise<BuchungResult<BuchungDetail>> => {
  const token = getAccessToken(event)
  if (!token) return { ok: false, error: 'unauthorized', message: 'Bitte melde dich an.' }

  let userId: string
  try {
    const client = createUserClient(token)
    const me = (await client.request(readMe({ fields: ['id'] }))) as { id: string }
    userId = me.id
  } catch {
    return { ok: false, error: 'unauthorized', message: 'Session ungültig.' }
  }

  const id = getRouterParam(event, 'id')
  if (!id) return { ok: false, error: 'buchung_not_found', message: 'Buchung nicht gefunden.' }

  const directus = useDirectusServer()
  const rows = (await directus.request(
    readItems('buchungen', {
      filter: { id: { _eq: id }, user: { _eq: userId } },
      fields: [
        'id', 'status', 'date_created', 'personen_anzahl', 'preis_gesamt',
        'kontakt_vorname', 'kontakt_nachname', 'kontakt_email', 'kontakt_telefon', 'notizen',
        'wunsch_datum',
        'tour.id', 'tour.slug', 'tour.title',
        'termin.id', 'termin.date_from', 'termin.date_to', 'termin.hinweis',
      ],
      limit: 1,
    }),
  )) as BuchungDetail[]

  if (rows.length === 0) {
    return { ok: false, error: 'buchung_not_found', message: 'Buchung nicht gefunden.' }
  }

  return { ok: true, data: rows[0] }
})
```

- [ ] **Step 3: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 4: Smoketest**

```bash
yarn dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 10
curl -b /tmp/cookies.txt http://localhost:3000/api/buchungen | jq '.ok, (.data | length)'
# expected: true, <count>
BUCHUNG_ID=$(curl -s -b /tmp/cookies.txt http://localhost:3000/api/buchungen | jq -r '.data[0].id')
curl -b /tmp/cookies.txt "http://localhost:3000/api/buchungen/$BUCHUNG_ID" | jq '.ok, .data.id'
# expected: true, "<same id>"
curl -b /tmp/cookies.txt "http://localhost:3000/api/buchungen/not-a-real-id" | jq '.ok, .error'
# expected: false, "buchung_not_found"
kill $DEV_PID 2>/dev/null || taskkill //F //PID $DEV_PID 2>/dev/null
```

- [ ] **Step 5: Commit**

```bash
git add server/api/buchungen/index.get.ts "server/api/buchungen/[id].get.ts"
git commit -m "feat(buchungen): add GET list + GET detail endpoints"
```

---

### Task 7: `POST /api/buchungen/[id]/cancel` — user storno

**Files:**
- Create: `server/api/buchungen/[id]/cancel.post.ts`

Status/deadline check, update status + last_notified_status, send storno mail.

- [ ] **Step 1: Write the handler**

Write `server/api/buchungen/[id]/cancel.post.ts`:

```typescript
import { readItems, updateItem } from '@directus/sdk'
import { readMe } from '@directus/sdk'
import type { BuchungDetail, BuchungResult } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getAccessToken } from '~~/server/utils/auth-cookies'
import { createUserClient } from '~~/server/utils/directus-user'
import { sendMail, renderBuchungTemplate } from '~~/server/utils/mailer'

const DAY_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event): Promise<BuchungResult<BuchungDetail>> => {
  const token = getAccessToken(event)
  if (!token) return { ok: false, error: 'unauthorized', message: 'Bitte melde dich an.' }

  let userId: string
  try {
    const client = createUserClient(token)
    const me = (await client.request(readMe({ fields: ['id'] }))) as { id: string }
    userId = me.id
  } catch {
    return { ok: false, error: 'unauthorized', message: 'Session ungültig.' }
  }

  const id = getRouterParam(event, 'id')
  if (!id) return { ok: false, error: 'buchung_not_found', message: 'Buchung nicht gefunden.' }

  const directus = useDirectusServer()
  const rows = (await directus.request(
    readItems('buchungen', {
      filter: { id: { _eq: id }, user: { _eq: userId } },
      fields: [
        'id', 'status', 'date_created', 'personen_anzahl', 'preis_gesamt',
        'kontakt_vorname', 'kontakt_nachname', 'kontakt_email', 'kontakt_telefon', 'notizen',
        'wunsch_datum',
        'tour.id', 'tour.slug', 'tour.title',
        'termin.id', 'termin.date_from', 'termin.date_to', 'termin.hinweis',
      ],
      limit: 1,
    }),
  )) as BuchungDetail[]

  if (rows.length === 0) {
    return { ok: false, error: 'buchung_not_found', message: 'Buchung nicht gefunden.' }
  }
  const b = rows[0]

  if (b.status === 'storniert') {
    return { ok: false, error: 'already_cancelled', message: 'Buchung ist bereits storniert.' }
  }
  if (b.status !== 'angefragt' && b.status !== 'bestaetigt') {
    return {
      ok: false,
      error: 'cancel_not_allowed_status',
      message: 'Buchung kann in diesem Status nicht mehr storniert werden.',
    }
  }

  // 14-day rule for fixed termin
  if (b.termin) {
    const terminMs = new Date(b.termin.date_from + 'T00:00:00Z').getTime()
    if (terminMs - Date.now() < 14 * DAY_MS) {
      return {
        ok: false,
        error: 'cancel_not_allowed_deadline',
        message: 'Storno nicht mehr möglich — bitte telefonisch kontaktieren.',
      }
    }
  }

  // Update
  await directus.request(
    updateItem('buchungen', b.id, {
      status: 'storniert',
      last_notified_status: 'storniert',
    }),
  )

  const updated: BuchungDetail = { ...b, status: 'storniert' }

  // Mail (best-effort)
  try {
    const t = renderBuchungTemplate('user_storniert', updated)
    await sendMail({ to: updated.kontakt_email, subject: t.subject, html: t.html, text: t.text })
  } catch (err) {
    console.error('[buchungen] storno mail failed:', err)
  }

  console.log('[buchungen] buchung_cancelled', { buchung_id: b.id, user_id: userId, reason: 'user_requested' })

  return { ok: true, data: updated }
})
```

- [ ] **Step 2: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 3: Commit**

```bash
git add "server/api/buchungen/[id]/cancel.post.ts"
git commit -m "feat(buchungen): add user-storno endpoint with 14-day rule"
```

---

### Task 8: `POST /api/internal/booking-status-changed` — webhook receiver

**Files:**
- Create: `server/api/internal/booking-status-changed.post.ts`

Shared-secret-guarded endpoint. Receives Directus flow events. Dedup via `last_notified_status`.

- [ ] **Step 1: Write the handler**

Write `server/api/internal/booking-status-changed.post.ts`:

```typescript
import { readItems, updateItem } from '@directus/sdk'
import type { BuchungDetail, BuchungStatus } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { sendMail, renderBuchungTemplate } from '~~/server/utils/mailer'

type DirectusFlowEvent = {
  event?: string
  keys?: string[]
  payload?: { status?: string }
}

const TEMPLATE_FOR: Record<string, Parameters<typeof renderBuchungTemplate>[0] | null> = {
  bestaetigt: 'user_bestaetigt',
  storniert: 'user_storniert',
  abgelehnt: 'user_abgelehnt',
}

export default defineEventHandler(async (event) => {
  const expected = process.env.INTERNAL_WEBHOOK_SECRET
  const got = getHeader(event, 'x-internal-secret')
  if (!expected || got !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  const body = await readBody<DirectusFlowEvent>(event)
  if (!body || !Array.isArray(body.keys) || !body.payload?.status) {
    return { ok: false, error: 'invalid_body' }
  }
  const newStatus = body.payload.status as BuchungStatus
  const template = TEMPLATE_FOR[newStatus]
  if (!template) {
    return { ok: true, skipped: `no-template-for-${newStatus}` }
  }

  const directus = useDirectusServer()
  const results: Array<{ id: string; sent: boolean; reason?: string }> = []

  for (const id of body.keys) {
    const rows = (await directus.request(
      readItems('buchungen', {
        filter: { id: { _eq: id } },
        fields: [
          'id', 'status', 'date_created', 'personen_anzahl', 'preis_gesamt',
          'kontakt_vorname', 'kontakt_nachname', 'kontakt_email', 'kontakt_telefon', 'notizen',
          'wunsch_datum', 'last_notified_status',
          'tour.id', 'tour.slug', 'tour.title',
          'termin.id', 'termin.date_from', 'termin.date_to', 'termin.hinweis',
        ],
        limit: 1,
      }),
    )) as Array<BuchungDetail & { last_notified_status: string | null }>

    if (rows.length === 0) {
      results.push({ id, sent: false, reason: 'not_found' })
      continue
    }
    const b = rows[0]
    if (b.last_notified_status === newStatus) {
      results.push({ id, sent: false, reason: 'already_notified' })
      continue
    }

    try {
      const t = renderBuchungTemplate(template, b)
      await sendMail({ to: b.kontakt_email, subject: t.subject, html: t.html, text: t.text })
      await directus.request(updateItem('buchungen', b.id, { last_notified_status: newStatus }))
      console.log('[buchungen] booking_status_mail_sent', {
        buchung_id: b.id,
        new_status: newStatus,
        to: b.kontakt_email,
      })
      results.push({ id, sent: true })
    } catch (err) {
      console.error('[buchungen] mail_send_failed', { buchung_id: b.id, new_status: newStatus, error: err })
      results.push({ id, sent: false, reason: 'mail_error' })
    }
  }

  return { ok: true, results }
})
```

- [ ] **Step 2: Build**

```bash
yarn build 2>&1 | tail -5
```

- [ ] **Step 3: Smoketest**

```bash
yarn dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 10
SECRET=$(grep '^INTERNAL_WEBHOOK_SECRET=' .env | cut -d= -f2)
# Unauthorized
curl -s -X POST http://localhost:3000/api/internal/booking-status-changed -d '{}' | head -c 200
# expected: 401 error body
# Valid event (with a real buchung id)
BUCHUNG_ID=$(curl -s -b /tmp/cookies.txt http://localhost:3000/api/buchungen | jq -r '.data[0].id')
curl -s -X POST -H 'Content-Type: application/json' \
  -H "X-Internal-Secret: $SECRET" \
  -d "{\"event\":\"items.buchungen.update\",\"keys\":[\"$BUCHUNG_ID\"],\"payload\":{\"status\":\"bestaetigt\"}}" \
  http://localhost:3000/api/internal/booking-status-changed | jq .
# expected: ok:true, results with sent:true
kill $DEV_PID 2>/dev/null || taskkill //F //PID $DEV_PID 2>/dev/null
```

- [ ] **Step 4: Commit**

```bash
git add server/api/internal/booking-status-changed.post.ts
git commit -m "feat(buchungen): add Directus webhook receiver for status-change mails"
```

---

### Task 9: Extend `/api/content/tour` with `termine[]` + capacity

**Files:**
- Modify: `server/api/content/tour.get.ts`
- Modify: `shared/types/touren.ts` (add termine to TourDetail — verify existing type first)

- [ ] **Step 1: Inspect current TourDetail type**

```bash
cat shared/types/touren.ts 2>&1 | head -80
```

Locate the `TourDetail` type. Expected: has all tour fields. We will add a `termine: TerminPublic[]` field.

- [ ] **Step 2: Extend TourDetail type**

Edit `shared/types/touren.ts` — add this import at the top (or adjust to an existing one) and extend `TourDetail`:

```typescript
import type { TerminPublic } from './buchung'
```

Add `termine` field at the end of `TourDetail`:

```typescript
termine: TerminPublic[]
```

If the file has a type-literal (not `interface`), append to the intersection/shape accordingly. Keep existing fields intact.

- [ ] **Step 3: Modify the content endpoint**

Edit `server/api/content/tour.get.ts`. Replace its contents entirely with:

```typescript
import { readItems } from '@directus/sdk'
import type { TourDetail, TourGalleryImage } from '~~/shared/types/touren'
import type { TerminPublic } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getBelegungProTermin } from '~~/server/utils/kapazitaet'

const TOUR_FIELDS = [
  'id',
  'slug',
  'title',
  'subtitle',
  'region',
  'difficulty',
  'variant',
  'distance',
  'ascent',
  'duration',
  'group_size_max',
  'intro',
  'highlights',
  'included',
  'not_included',
  'meeting_point',
  'season',
  'price_from',
  'booking_url',
  'gallery.directus_files_id.id',
  'gallery.directus_files_id.title',
  'gallery.directus_files_id.filename_disk',
  'gallery.sort',
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default defineEventHandler(async (event): Promise<TourDetail> => {
  const { slug } = getQuery(event) as { slug?: string }
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug required' })
  }

  const directus = useDirectusServer()
  const [item] = (await directus.request(
    readItems('touren', {
      filter: { slug: { _eq: slug }, status: { _eq: 'published' } },
      limit: 1,
      fields: TOUR_FIELDS,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deep: { gallery: { _sort: ['sort'] } } as any,
    }),
  )) as Array<{
    id: string
    slug: string
    title: string
    subtitle: string | null
    region: string
    difficulty: 'leicht' | 'mittel' | 'schwer'
    variant: 'alpine-see' | 'hochgebirge' | 'almwiese'
    distance: string
    ascent: string
    duration: string
    group_size_max: number | null
    intro: string | null
    highlights: string[] | null
    included: string[] | null
    not_included: string[] | null
    meeting_point: string | null
    season: string | null
    price_from: number | null
    booking_url: string | null
    gallery: Array<{ directus_files_id: TourGalleryImage | null; sort: number | null }> | null
  }>

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: `Tour "${slug}" nicht gefunden` })
  }

  // Load future, published termine
  const terminRows = (await directus.request(
    readItems('tour_termine', {
      filter: {
        tour: { _eq: item.id },
        status: { _eq: 'published' },
        date_from: { _gte: today() },
      },
      fields: ['id', 'date_from', 'date_to', 'price_override', 'hinweis'],
      sort: ['sort', 'date_from'],
      limit: -1,
    }),
  )) as Array<{
    id: string
    date_from: string
    date_to: string
    price_override: number | null
    hinweis: string | null
  }>

  const belegung = await getBelegungProTermin(terminRows.map((t) => t.id))

  const termine: TerminPublic[] = terminRows.map((t) => {
    if (item.group_size_max === null) {
      return {
        id: t.id,
        date_from: t.date_from,
        date_to: t.date_to,
        price_override: t.price_override,
        hinweis: t.hinweis,
        verfuegbare_plaetze: -1,
        ausgebucht: false,
      }
    }
    const belegt = belegung[t.id] ?? 0
    const frei = Math.max(0, item.group_size_max - belegt)
    return {
      id: t.id,
      date_from: t.date_from,
      date_to: t.date_to,
      price_override: t.price_override,
      hinweis: t.hinweis,
      verfuegbare_plaetze: frei,
      ausgebucht: frei <= 0,
    }
  })

  return {
    ...item,
    termine,
    gallery: (item.gallery ?? [])
      .map((g) => g.directus_files_id)
      .filter((f): f is TourGalleryImage => f !== null),
  }
})
```

- [ ] **Step 4: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 5: Smoketest**

```bash
yarn dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 10
curl -s "http://localhost:3000/api/content/tour?slug=koenigssee-rundweg" | jq '.termine'
# expected: array (possibly empty if no termine seeded yet)
kill $DEV_PID 2>/dev/null || taskkill //F //PID $DEV_PID 2>/dev/null
```

- [ ] **Step 6: Commit**

```bash
git add server/api/content/tour.get.ts shared/types/touren.ts
git commit -m "feat(buchungen): include termine with capacity in /api/content/tour"
```

---

## Phase 4 — Frontend foundation

### Task 10: `useBuchungen` composable

**Files:**
- Create: `app/composables/useBuchungen.ts`

Mirrors `useAuth` pattern with typed `BuchungResult<T>` returns.

- [ ] **Step 1: Write the composable**

Write `app/composables/useBuchungen.ts`:

```typescript
import type {
  BuchungCreateInput,
  BuchungDetail,
  BuchungListItem,
  BuchungResult,
} from '~~/shared/types/buchung'

type ApiResult<T = void> = BuchungResult<T>

async function callJson<T>(
  url: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    return await $fetch<ApiResult<T>>(url, { method, body })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; data?: ApiResult<T> }
    if (e.data?.ok === false) return e.data
    return { ok: false, error: 'server_error', message: 'Verbindungsproblem — bitte erneut versuchen.' }
  }
}

export function useBuchungen() {
  return {
    async createBuchung(input: BuchungCreateInput) {
      return callJson<BuchungDetail>('/api/buchungen', 'POST', input)
    },
    async listBuchungen() {
      return callJson<BuchungListItem[]>('/api/buchungen', 'GET')
    },
    async getBuchung(id: string) {
      return callJson<BuchungDetail>(`/api/buchungen/${id}`, 'GET')
    },
    async cancelBuchung(id: string) {
      return callJson<BuchungDetail>(`/api/buchungen/${id}/cancel`, 'POST')
    },
  }
}
```

- [ ] **Step 2: Build**

```bash
yarn build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add app/composables/useBuchungen.ts
git commit -m "feat(buchungen): add useBuchungen composable"
```

---

### Task 11: Add missing shadcn-vue UI components

**Files:**
- Run shadcn-vue CLI to generate: `badge`, `select`, `textarea`, `alert-dialog`, `tooltip`, `card`

- [ ] **Step 1: Add components via CLI**

Run (one by one, answering any prompts with defaults):

```bash
npx shadcn-vue@latest add badge
npx shadcn-vue@latest add select
npx shadcn-vue@latest add textarea
npx shadcn-vue@latest add alert-dialog
npx shadcn-vue@latest add tooltip
npx shadcn-vue@latest add card
```

Each command adds files under `app/components/ui/<name>/` plus may touch `package.json`/`components.json`.

- [ ] **Step 2: Verify generated directories exist**

```bash
ls app/components/ui
```

Expected: existing (button/input/label/dropdown-menu/carousel) plus the new ones.

- [ ] **Step 3: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add app/components/ui/badge app/components/ui/select app/components/ui/textarea app/components/ui/alert-dialog app/components/ui/tooltip app/components/ui/card package.json yarn.lock components.json
git commit -m "chore(ui): add shadcn-vue badge/select/textarea/alert-dialog/tooltip/card"
```

(If `components.json` was untouched, drop it from the command.)

---

## Phase 5 — Frontend components

### Task 12: `BuchungStatusBadge.vue` + `TerminSelect.vue`

**Files:**
- Create: `app/components/Buchung/BuchungStatusBadge.vue`
- Create: `app/components/Buchung/TerminSelect.vue`

- [ ] **Step 1: Write BuchungStatusBadge**

Write `app/components/Buchung/BuchungStatusBadge.vue`:

```vue
<script setup lang="ts">
import type { BuchungStatus } from '~~/shared/types/buchung'

const props = defineProps<{ status: BuchungStatus }>()

const label: Record<BuchungStatus, string> = {
  angefragt: 'Angefragt',
  bestaetigt: 'Bestätigt',
  storniert: 'Storniert',
  abgelehnt: 'Abgelehnt',
  durchgefuehrt: 'Durchgeführt',
}

const cls: Record<BuchungStatus, string> = {
  angefragt: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  bestaetigt: 'bg-green-100 text-green-900 border-green-300',
  storniert: 'bg-gray-100 text-gray-700 border-gray-300',
  abgelehnt: 'bg-red-100 text-red-900 border-red-300',
  durchgefuehrt: 'bg-blue-100 text-blue-900 border-blue-300',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
    :class="cls[props.status]"
  >
    {{ label[props.status] }}
  </span>
</template>
```

- [ ] **Step 2: Write TerminSelect**

Write `app/components/Buchung/TerminSelect.vue`:

```vue
<script setup lang="ts">
import type { TerminPublic } from '~~/shared/types/buchung'

export type TerminSelectValue =
  | { type: 'termin'; terminId: string }
  | { type: 'wunsch'; datum: string }
  | { type: 'none' }

const props = defineProps<{
  termine: TerminPublic[]
  modelValue: TerminSelectValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TerminSelectValue]
}>()

function formatDatum(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function terminLabel(t: TerminPublic) {
  const von = formatDatum(t.date_from)
  const bis = formatDatum(t.date_to)
  const rest =
    t.verfuegbare_plaetze === -1
      ? ''
      : t.ausgebucht
      ? ' — Ausgebucht'
      : ` — noch ${t.verfuegbare_plaetze} Plätze`
  return `${von} – ${bis}${rest}`
}

const selectedValue = computed(() => {
  if (props.modelValue.type === 'termin') return props.modelValue.terminId
  if (props.modelValue.type === 'wunsch') return '__wunsch__'
  return ''
})

const wunschDatum = ref(
  props.modelValue.type === 'wunsch' ? props.modelValue.datum : '',
)

function onSelectChange(val: string) {
  if (val === '__wunsch__') {
    emit('update:modelValue', { type: 'wunsch', datum: wunschDatum.value })
  } else if (val) {
    emit('update:modelValue', { type: 'termin', terminId: val })
  } else {
    emit('update:modelValue', { type: 'none' })
  }
}

function onWunschDatumChange(datum: string) {
  wunschDatum.value = datum
  if (props.modelValue.type === 'wunsch') {
    emit('update:modelValue', { type: 'wunsch', datum })
  }
}

const todayStr = new Date().toISOString().slice(0, 10)
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label for="termin-select">Termin</Label>
      <select
        id="termin-select"
        class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        :value="selectedValue"
        @change="(e) => onSelectChange((e.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>Bitte wählen…</option>
        <option
          v-for="t in termine"
          :key="t.id"
          :value="t.id"
          :disabled="t.ausgebucht"
        >
          {{ terminLabel(t) }}
        </option>
        <option value="__wunsch__">Wunschdatum angeben…</option>
      </select>
    </div>
    <div v-if="modelValue.type === 'wunsch'">
      <Label for="wunsch-datum">Wunschdatum</Label>
      <Input
        id="wunsch-datum"
        type="date"
        :min="todayStr"
        :model-value="wunschDatum"
        @update:model-value="(v) => onWunschDatumChange(String(v ?? ''))"
      />
    </div>
  </div>
</template>
```

Note: We intentionally use a native `<select>` here — the shadcn-vue `<Select>` component API is heavier (Radix/Reka-ui primitives). Native matches existing simpler patterns in the auth forms and stays accessible without extra dependencies.

- [ ] **Step 3: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add app/components/Buchung/BuchungStatusBadge.vue app/components/Buchung/TerminSelect.vue
git commit -m "feat(buchungen): add status badge + termin select components"
```

---

### Task 13: `BuchungForm.vue`

**Files:**
- Create: `app/components/Buchung/BuchungForm.vue`

Presentational component. Receives tour + termine + pre-filled user. Emits a create-input.

- [ ] **Step 1: Write the form**

Write `app/components/Buchung/BuchungForm.vue`:

```vue
<script setup lang="ts">
import type { BuchungCreateInput, TerminPublic } from '~~/shared/types/buchung'
import type { TerminSelectValue } from './TerminSelect.vue'

const props = defineProps<{
  tourId: string
  tourTitle: string
  tourPriceFrom: number | null
  groupSizeMax: number | null
  termine: TerminPublic[]
  initialContact: {
    vorname: string
    nachname: string
    email: string
  }
  pending: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{
  submit: [payload: BuchungCreateInput]
}>()

const termin = ref<TerminSelectValue>({ type: 'none' })
const personen = ref<number>(1)
const vorname = ref(props.initialContact.vorname)
const nachname = ref(props.initialContact.nachname)
const email = ref(props.initialContact.email)
const telefon = ref('')
const notizen = ref('')

const maxPersonen = computed(() => {
  if (termin.value.type === 'termin') {
    const t = props.termine.find((x) => x.id === termin.value.terminId)
    if (t && t.verfuegbare_plaetze !== -1) return t.verfuegbare_plaetze
  }
  return props.groupSizeMax ?? 20
})

const selectedPrice = computed(() => {
  if (termin.value.type === 'termin') {
    const t = props.termine.find((x) => x.id === termin.value.terminId)
    if (t?.price_override != null) return t.price_override
  }
  return props.tourPriceFrom ?? 0
})

const preisGesamt = computed(() => selectedPrice.value * personen.value)

const canSubmit = computed(() => {
  if (props.pending) return false
  if (personen.value < 1 || personen.value > maxPersonen.value) return false
  if (!vorname.value || !nachname.value || !email.value || !telefon.value) return false
  if (termin.value.type === 'none') return false
  if (termin.value.type === 'wunsch' && !termin.value.datum) return false
  return true
})

function onSubmit(e: Event) {
  e.preventDefault()
  if (!canSubmit.value) return
  const base: BuchungCreateInput = {
    tour: props.tourId,
    personen_anzahl: personen.value,
    kontakt_vorname: vorname.value,
    kontakt_nachname: nachname.value,
    kontakt_email: email.value,
    kontakt_telefon: telefon.value,
    notizen: notizen.value || null,
  }
  if (termin.value.type === 'termin') {
    emit('submit', { ...base, termin: termin.value.terminId, wunsch_datum: null })
  } else if (termin.value.type === 'wunsch') {
    emit('submit', { ...base, termin: null, wunsch_datum: termin.value.datum })
  }
}
</script>

<template>
  <form class="space-y-6" @submit="onSubmit">
    <div>
      <h2 class="font-heading text-f-2xl font-medium text-foreground">{{ tourTitle }} buchen</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Wähle einen Termin oder gib ein Wunschdatum an. Wir bestätigen deine Anfrage innerhalb von 48 Stunden.
      </p>
    </div>

    <BuchungTerminSelect v-model="termin" :termine="termine" />

    <div>
      <Label for="personen">Personen</Label>
      <Input
        id="personen"
        type="number"
        :min="1"
        :max="maxPersonen"
        :model-value="personen"
        @update:model-value="(v) => (personen = Number(v) || 1)"
      />
      <p v-if="maxPersonen" class="mt-1 text-xs text-muted-foreground">
        Max. {{ maxPersonen }} Personen
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <Label for="vorname">Vorname</Label>
        <Input id="vorname" v-model="vorname" required />
      </div>
      <div>
        <Label for="nachname">Nachname</Label>
        <Input id="nachname" v-model="nachname" required />
      </div>
      <div>
        <Label for="email">E-Mail</Label>
        <Input id="email" v-model="email" type="email" required />
      </div>
      <div>
        <Label for="telefon">Telefon</Label>
        <Input id="telefon" v-model="telefon" type="tel" required />
      </div>
    </div>

    <div>
      <Label for="notizen">Notizen (optional)</Label>
      <Textarea id="notizen" v-model="notizen" rows="4" placeholder="Besondere Wünsche, Fragen…" />
    </div>

    <div class="rounded-md border border-border bg-muted/40 p-4">
      <div class="flex items-baseline justify-between">
        <span class="text-sm font-medium text-foreground">Preis (Snapshot)</span>
        <span class="font-heading text-f-xl text-foreground">{{ preisGesamt }} EUR</span>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">
        {{ selectedPrice }} EUR × {{ personen }} Personen
      </p>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-700">{{ errorMessage }}</p>

    <Button type="submit" :disabled="!canSubmit" size="lg" class="w-full">
      {{ pending ? 'Wird gesendet…' : 'Anfrage senden' }}
    </Button>
  </form>
</template>
```

- [ ] **Step 2: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 3: Commit**

```bash
git add app/components/Buchung/BuchungForm.vue
git commit -m "feat(buchungen): add BuchungForm component"
```

---

### Task 14: `BuchungCard.vue` + `BuchungDetail.vue`

**Files:**
- Create: `app/components/Buchung/BuchungCard.vue`
- Create: `app/components/Buchung/BuchungDetail.vue`

- [ ] **Step 1: Write BuchungCard**

Write `app/components/Buchung/BuchungCard.vue`:

```vue
<script setup lang="ts">
import type { BuchungListItem } from '~~/shared/types/buchung'

defineProps<{ buchung: BuchungListItem }>()

function formatDatum(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
</script>

<template>
  <NuxtLink
    :to="`/konto/buchungen/${buchung.id}`"
    class="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <div class="flex items-center gap-2">
        <span class="font-heading text-lg font-medium text-foreground">{{ buchung.tour.title }}</span>
        <BuchungStatusBadge :status="buchung.status" />
      </div>
      <p class="mt-1 text-sm text-muted-foreground">
        <template v-if="buchung.termin">
          {{ formatDatum(buchung.termin.date_from) }} – {{ formatDatum(buchung.termin.date_to) }}
        </template>
        <template v-else-if="buchung.wunsch_datum">
          Wunschdatum: {{ formatDatum(buchung.wunsch_datum) }}
        </template>
      </p>
    </div>
    <div class="text-right">
      <div class="text-sm text-muted-foreground">{{ buchung.personen_anzahl }} Pers.</div>
      <div class="font-heading text-lg text-foreground">{{ buchung.preis_gesamt }} EUR</div>
    </div>
  </NuxtLink>
</template>
```

- [ ] **Step 2: Write BuchungDetail**

Write `app/components/Buchung/BuchungDetail.vue`:

```vue
<script setup lang="ts">
import type { BuchungDetail as BuchungDetailT } from '~~/shared/types/buchung'

const props = defineProps<{
  buchung: BuchungDetailT
  canCancel: boolean
  cancelDisabledReason: string | null
  pending: boolean
}>()

const emit = defineEmits<{ cancel: [] }>()

function formatDatum(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

const confirmOpen = ref(false)

function onConfirm() {
  confirmOpen.value = false
  emit('cancel')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h1 class="font-heading text-f-3xl text-foreground">{{ buchung.tour.title }}</h1>
      <BuchungStatusBadge :status="buchung.status" />
    </div>

    <dl class="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2">
      <div>
        <dt class="text-xs uppercase text-muted-foreground">Termin</dt>
        <dd class="mt-1 font-medium text-foreground">
          <template v-if="buchung.termin">
            {{ formatDatum(buchung.termin.date_from) }} – {{ formatDatum(buchung.termin.date_to) }}
            <span v-if="buchung.termin.hinweis" class="block text-sm text-muted-foreground">
              {{ buchung.termin.hinweis }}
            </span>
          </template>
          <template v-else-if="buchung.wunsch_datum">
            Wunschdatum: {{ formatDatum(buchung.wunsch_datum) }}
          </template>
        </dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-muted-foreground">Personen</dt>
        <dd class="mt-1 font-medium text-foreground">{{ buchung.personen_anzahl }}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-muted-foreground">Preis (Snapshot)</dt>
        <dd class="mt-1 font-medium text-foreground">{{ buchung.preis_gesamt }} EUR</dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-muted-foreground">Angefragt am</dt>
        <dd class="mt-1 font-medium text-foreground">
          {{ new Date(buchung.date_created).toLocaleDateString('de-DE') }}
        </dd>
      </div>
    </dl>

    <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 class="font-heading text-lg text-foreground">Kontakt zur Buchung</h2>
      <dl class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-xs uppercase text-muted-foreground">Name</dt>
          <dd>{{ buchung.kontakt_vorname }} {{ buchung.kontakt_nachname }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-muted-foreground">E-Mail</dt>
          <dd>{{ buchung.kontakt_email }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-muted-foreground">Telefon</dt>
          <dd>{{ buchung.kontakt_telefon }}</dd>
        </div>
      </dl>
      <div v-if="buchung.notizen" class="mt-4">
        <dt class="text-xs uppercase text-muted-foreground">Notizen</dt>
        <dd class="mt-1 whitespace-pre-line text-sm text-foreground">{{ buchung.notizen }}</dd>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <template v-if="buchung.status === 'angefragt' || buchung.status === 'bestaetigt'">
        <Button
          variant="outline"
          :disabled="!canCancel || pending"
          :title="cancelDisabledReason ?? ''"
          @click="confirmOpen = true"
        >
          {{ pending ? 'Wird storniert…' : 'Buchung stornieren' }}
        </Button>
        <span v-if="!canCancel && cancelDisabledReason" class="text-xs text-muted-foreground">
          {{ cancelDisabledReason }}
        </span>
      </template>
      <NuxtLink
        :to="`/touren/${buchung.tour.slug}`"
        class="text-sm font-medium text-primary hover:underline"
      >
        Zur Tour
      </NuxtLink>
    </div>

    <AlertDialog v-model:open="confirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Buchung wirklich stornieren?</AlertDialogTitle>
          <AlertDialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction @click="onConfirm">Stornieren</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
```

- [ ] **Step 3: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green. If the shadcn-vue AlertDialog component names don't match the auto-generated ones (some versions use `<AlertDialogPortal>`), inspect `app/components/ui/alert-dialog/index.ts` and adjust the template accordingly. Do **not** rename the auto-generated components themselves — adjust our usage.

- [ ] **Step 4: Commit**

```bash
git add app/components/Buchung/BuchungCard.vue app/components/Buchung/BuchungDetail.vue
git commit -m "feat(buchungen): add BuchungCard + BuchungDetail components"
```

---

### Task 15: `TourTermine.vue` — termine list for tour-detail page

**Files:**
- Create: `app/components/Tour/TourTermine.vue`

- [ ] **Step 1: Write the component**

Write `app/components/Tour/TourTermine.vue`:

```vue
<script setup lang="ts">
import type { TerminPublic } from '~~/shared/types/buchung'

defineProps<{
  termine: TerminPublic[]
  tourSlug: string
  priceFrom: number | null
}>()

function formatDatum(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function terminPreis(t: TerminPublic, priceFrom: number | null) {
  return t.price_override ?? priceFrom ?? 0
}
</script>

<template>
  <section class="my-f-12">
    <h2 class="font-heading text-f-2xl font-medium text-foreground">Nächste Termine</h2>
    <p v-if="!termine.length" class="mt-3 text-muted-foreground">
      Aktuell keine festen Termine — buche direkt ein Wunschdatum.
    </p>
    <ul v-else class="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
      <li
        v-for="t in termine"
        :key="t.id"
        class="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div class="font-medium text-foreground">
            {{ formatDatum(t.date_from) }} – {{ formatDatum(t.date_to) }}
          </div>
          <p v-if="t.hinweis" class="mt-1 text-sm text-muted-foreground">{{ t.hinweis }}</p>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-muted-foreground">ab {{ terminPreis(t, priceFrom) }} EUR</span>
          <span
            v-if="t.verfuegbare_plaetze === -1"
            class="rounded-full border border-border px-2 py-0.5 text-xs"
          >
            Freie Plätze
          </span>
          <span
            v-else-if="t.ausgebucht"
            class="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-900"
          >
            Ausgebucht
          </span>
          <span
            v-else
            class="rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-xs text-green-900"
          >
            Noch {{ t.verfuegbare_plaetze }} Plätze
          </span>
        </div>
      </li>
    </ul>
    <NuxtLink
      :to="`/touren/${tourSlug}/buchen`"
      class="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
    >
      Jetzt buchen
    </NuxtLink>
  </section>
</template>
```

- [ ] **Step 2: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 3: Commit**

```bash
git add app/components/Tour/TourTermine.vue
git commit -m "feat(buchungen): add TourTermine list component"
```

---

## Phase 6 — Frontend pages

### Task 16: `/touren/[slug]/buchen.vue` page

**Files:**
- Create: `app/pages/touren/[slug]/buchen.vue`

- [ ] **Step 1: Write the page**

Write `app/pages/touren/[slug]/buchen.vue`:

```vue
<script setup lang="ts">
import { useSeoMeta } from '#imports'
import type { TourDetail } from '~~/shared/types/touren'
import type { BuchungCreateInput } from '~~/shared/types/buchung'

definePageMeta({ layout: false, middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const slug = String(route.params.slug)

const { public: pub } = useRuntimeConfig()
const { user } = useUser()
const { createBuchung } = useBuchungen()

const { data: tour, error } = await useFetch<TourDetail>('/api/content/tour', {
  query: { slug },
  key: `tour-buchen-${slug}`,
})

if (error.value || !tour.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tour nicht gefunden' })
}

useSeoMeta({ title: () => `${tour.value?.title} buchen | ${pub.siteName}` })

const pending = ref(false)
const errorMessage = ref<string | null>(null)

const onSubmit = async (payload: BuchungCreateInput) => {
  pending.value = true
  errorMessage.value = null
  const res = await createBuchung(payload)
  pending.value = false
  if (!res.ok) {
    errorMessage.value = res.message
    return
  }
  await router.push(`/konto/buchungen?created=${res.data.id}`)
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main class="pt-[68px]">
      <section class="mx-auto max-w-2xl px-4 py-f-12 sm:px-6 lg:px-8">
        <NuxtLink
          :to="`/touren/${slug}`"
          class="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Zurück zur Tour
        </NuxtLink>
        <div class="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <BuchungBuchungForm
            v-if="tour"
            :tour-id="tour.id"
            :tour-title="tour.title"
            :tour-price-from="tour.price_from"
            :group-size-max="tour.group_size_max"
            :termine="tour.termine"
            :initial-contact="{
              vorname: user?.first_name ?? '',
              nachname: user?.last_name ?? '',
              email: user?.email ?? '',
            }"
            :pending="pending"
            :error-message="errorMessage"
            @submit="onSubmit"
          />
        </div>
      </section>
    </main>
    <SectionsTheFooter />
  </div>
</template>
```

- [ ] **Step 2: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green. Note: Component tag `BuchungBuchungForm` uses Nuxt's auto-import convention (subdirectory prefix). If auto-import resolves differently in this project, check `backup/app/components/Buchung/` neighbours and `nuxt.config.ts` — do not invent new configs; match existing patterns.

- [ ] **Step 3: Commit**

```bash
git add "app/pages/touren/[slug]/buchen.vue"
git commit -m "feat(buchungen): add /touren/[slug]/buchen form page"
```

---

### Task 17: `/konto/buchungen` list + detail pages

**Files:**
- Create: `app/pages/konto/buchungen/index.vue`
- Create: `app/pages/konto/buchungen/[id].vue`

- [ ] **Step 1: Write the list page**

Write `app/pages/konto/buchungen/index.vue`:

```vue
<script setup lang="ts">
import { useSeoMeta } from '#imports'
import type { BuchungListItem, BuchungResult } from '~~/shared/types/buchung'

definePageMeta({ layout: false, middleware: 'auth' })

const { public: pub } = useRuntimeConfig()
const route = useRoute()

useSeoMeta({ title: () => `Meine Buchungen | ${pub.siteName}` })

const { data: res, pending } = await useFetch<BuchungResult<BuchungListItem[]>>('/api/buchungen', {
  key: 'buchungen-list',
})

const buchungen = computed(() => (res.value?.ok ? res.value.data : []))
const errorMsg = computed(() => (res.value && !res.value.ok ? res.value.message : null))

const justCreatedId = computed(() => {
  const q = route.query.created
  return typeof q === 'string' ? q : null
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main class="pt-[68px]">
      <section class="mx-auto max-w-3xl px-4 py-f-12 sm:px-6 lg:px-8">
        <nav class="mb-6 flex gap-4 text-sm">
          <NuxtLink to="/konto" class="text-muted-foreground hover:text-foreground">Profil</NuxtLink>
          <NuxtLink to="/konto/passwort" class="text-muted-foreground hover:text-foreground">Passwort</NuxtLink>
          <NuxtLink to="/konto/buchungen" class="font-medium text-foreground">Buchungen</NuxtLink>
        </nav>

        <h1 class="font-heading text-f-5xl font-medium text-foreground">Meine Buchungen</h1>

        <div
          v-if="justCreatedId"
          class="mt-6 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900"
        >
          Anfrage erhalten — wir melden uns binnen 48 Stunden.
        </div>

        <p v-if="pending" class="mt-8 text-muted-foreground">Lädt…</p>
        <p v-else-if="errorMsg" class="mt-8 text-red-700">{{ errorMsg }}</p>
        <p v-else-if="!buchungen.length" class="mt-8 text-muted-foreground">
          Du hast noch keine Buchungen.
        </p>
        <div v-else class="mt-8 flex flex-col gap-3">
          <BuchungBuchungCard v-for="b in buchungen" :key="b.id" :buchung="b" />
        </div>
      </section>
    </main>
    <SectionsTheFooter />
  </div>
</template>
```

- [ ] **Step 2: Write the detail page**

Write `app/pages/konto/buchungen/[id].vue`:

```vue
<script setup lang="ts">
import { useSeoMeta } from '#imports'
import type { BuchungDetail, BuchungResult } from '~~/shared/types/buchung'

definePageMeta({ layout: false, middleware: 'auth' })

const { public: pub } = useRuntimeConfig()
const route = useRoute()
const router = useRouter()
const id = String(route.params.id)

const { cancelBuchung, getBuchung } = useBuchungen()

const { data: res, refresh } = await useFetch<BuchungResult<BuchungDetail>>(`/api/buchungen/${id}`, {
  key: `buchung-${id}`,
})

if (res.value && !res.value.ok) {
  throw createError({ statusCode: 404, statusMessage: 'Buchung nicht gefunden' })
}

const buchung = computed(() => (res.value?.ok ? res.value.data : null))
useSeoMeta({ title: () => `Buchung ${id.slice(0, 8)} | ${pub.siteName}` })

const pending = ref(false)

const DAY_MS = 24 * 60 * 60 * 1000
const cancelState = computed<{ canCancel: boolean; reason: string | null }>(() => {
  const b = buchung.value
  if (!b) return { canCancel: false, reason: null }
  if (b.status === 'storniert') return { canCancel: false, reason: 'Bereits storniert.' }
  if (b.status !== 'angefragt' && b.status !== 'bestaetigt') {
    return { canCancel: false, reason: 'Storno nicht möglich.' }
  }
  if (b.termin) {
    const terminMs = new Date(b.termin.date_from + 'T00:00:00Z').getTime()
    if (terminMs - Date.now() < 14 * DAY_MS) {
      return { canCancel: false, reason: 'Storno weniger als 14 Tage vor Termin nicht möglich — bitte telefonisch.' }
    }
  }
  return { canCancel: true, reason: null }
})

async function onCancel() {
  pending.value = true
  const res = await cancelBuchung(id)
  pending.value = false
  if (!res.ok) {
    alert(res.message)
    return
  }
  await refresh()
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main class="pt-[68px]">
      <section class="mx-auto max-w-3xl px-4 py-f-12 sm:px-6 lg:px-8">
        <NuxtLink
          to="/konto/buchungen"
          class="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Zur Liste
        </NuxtLink>
        <BuchungBuchungDetail
          v-if="buchung"
          :buchung="buchung"
          :can-cancel="cancelState.canCancel"
          :cancel-disabled-reason="cancelState.reason"
          :pending="pending"
          @cancel="onCancel"
        />
      </section>
    </main>
    <SectionsTheFooter />
  </div>
</template>
```

- [ ] **Step 3: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add app/pages/konto/buchungen/index.vue "app/pages/konto/buchungen/[id].vue"
git commit -m "feat(buchungen): add /konto/buchungen list + detail pages"
```

---

### Task 18: Wire tour-detail CTA + konto navigation + deprecate `booking_url`

**Files:**
- Modify: `app/pages/touren/[slug].vue` (wire "Jetzt buchen" → `/buchen`, render `TourTermine`)
- Modify: `app/pages/konto/index.vue` (add navigation to buchungen)
- (No script for meta-note change on `booking_url` — tracked in spec for cleanup later.)

- [ ] **Step 1: Inspect tour-detail page**

```bash
head -120 app/pages/touren/\[slug\].vue
```

Locate: (a) where "Jetzt buchen" links live (CTA, StickyMobileCTA), (b) where to insert `<TourTermine>` (typically after FactsBar/Highlights, before CTA footer section).

- [ ] **Step 2: Change CTA link**

In `app/pages/touren/[slug].vue`, for every "Jetzt buchen" CTA currently using `booking_url`, change the `href`/`:to` to:

```
/touren/<slug>/buchen
```

Concretely, wherever you find a binding like `:href="tour.booking_url"` or similar, replace with:

```vue
:to="`/touren/${tour.slug}/buchen`"
```

If the CTA button is always rendered (no conditional on `booking_url`), leave the render condition alone — the page `/touren/<slug>/buchen` itself handles "no termine + no wunsch allowed" by showing the wunsch-datum option.

- [ ] **Step 3: Insert TourTermine**

Between the Highlights / FactsBar block and the Gallery (or wherever reads naturally for this page), add:

```vue
<TourTourTermine
  v-if="tour"
  :termine="tour.termine ?? []"
  :tour-slug="tour.slug"
  :price-from="tour.price_from"
/>
```

Remember the Nuxt auto-import prefix (`Tour/TourTermine.vue` → `<TourTourTermine>`). Verify by checking the existing tag for `TourCard` / `TourDetail` usages in the repo.

- [ ] **Step 4: Update StickyMobileCTA if present**

Inspect `app/components/sections/StickyMobileCTA.vue` (or equivalent). If it contains a hard-coded "Jetzt buchen" with `booking_url`, change similarly to `/touren/<slug>/buchen`. If it's shared across pages, prefer a prop on the component (`:href`) rather than hardcoding — match the existing pattern there.

- [ ] **Step 5: Add konto navigation**

Edit `app/pages/konto/index.vue`. Near the top of the `<section>` block (before the `<h1>Mein Konto</h1>`), add:

```vue
<nav class="mb-6 flex gap-4 text-sm">
  <NuxtLink to="/konto" class="font-medium text-foreground">Profil</NuxtLink>
  <NuxtLink to="/konto/passwort" class="text-muted-foreground hover:text-foreground">Passwort</NuxtLink>
  <NuxtLink to="/konto/buchungen" class="text-muted-foreground hover:text-foreground">Buchungen</NuxtLink>
</nav>
```

- [ ] **Step 6: Build**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 7: Smoketest in browser**

```bash
yarn dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 10
```

Manually in browser (`http://localhost:3000`):
- Tour-Detail zeigt Termine-Liste (oder "Keine festen Termine" falls keine geseedet) + CTA linkt auf `/buchen`
- `/konto` zeigt die neue Navigation mit "Buchungen"-Link
- Klick auf "Buchungen" → `/konto/buchungen` Liste lädt

Kill the dev server:
```bash
kill $DEV_PID 2>/dev/null || taskkill //F //PID $DEV_PID 2>/dev/null
```

- [ ] **Step 8: Commit**

```bash
git add "app/pages/touren/[slug].vue" app/pages/konto/index.vue app/components/sections/StickyMobileCTA.vue
git commit -m "feat(buchungen): wire tour-detail CTA + konto navigation"
```

(Drop `StickyMobileCTA.vue` from the path list if it wasn't changed.)

---

## Phase 7 — Polish, seeding, final checks

### Task 19: Seed tour_termine, write webhook-setup doc, final manual browser checklist

**Files:**
- Create: `scripts/buchungen-seed-termine.mjs`
- Modify: `package.json` (add yarn script entry)

Seed three future termine per tour to make the whole UI testable end-to-end. Idempotent (finds-or-creates by `tour + date_from`).

- [ ] **Step 1: Write the seed script**

Write `scripts/buchungen-seed-termine.mjs`:

```javascript
/**
 * Seeds 3 future tour_termine per published tour for demo/testing.
 * Idempotent: find-or-create by (tour, date_from).
 */
import { directus } from './directus.mjs';
import { readItems, createItem } from '@directus/sdk';

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function plusDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

async function run() {
  const tours = await directus.request(
    readItems('touren', {
      filter: { status: { _eq: 'published' } },
      fields: ['id', 'slug', 'title'],
    }),
  );
  console.log(`Found ${tours.length} published tours.`);

  const today = new Date();

  for (const tour of tours) {
    console.log(`→ ${tour.title} (${tour.slug})`);

    // 3 Termine: +30d, +60d, +90d, each 3 days long
    const candidates = [
      { date_from: iso(plusDays(today, 30)), date_to: iso(plusDays(today, 32)) },
      { date_from: iso(plusDays(today, 60)), date_to: iso(plusDays(today, 62)) },
      { date_from: iso(plusDays(today, 90)), date_to: iso(plusDays(today, 92)) },
    ];

    for (const c of candidates) {
      const existing = await directus.request(
        readItems('tour_termine', {
          filter: { tour: { _eq: tour.id }, date_from: { _eq: c.date_from } },
          limit: 1,
        }),
      );
      if (existing.length) {
        console.log(`  ✓ ${c.date_from} already exists`);
        continue;
      }
      await directus.request(
        createItem('tour_termine', {
          status: 'published',
          tour: tour.id,
          date_from: c.date_from,
          date_to: c.date_to,
          hinweis: null,
          price_override: null,
        }),
      );
      console.log(`  + ${c.date_from} – ${c.date_to}`);
    }
  }

  console.log('\n✓ seeding done.');
}

run().catch((err) => {
  console.error('✗ failed:', err?.errors ?? err);
  process.exit(1);
});
```

- [ ] **Step 2: Add yarn script**

Edit `backup/package.json`, add to the scripts section:

```json
"buchungen:seed-termine": "node scripts/buchungen-seed-termine.mjs"
```

- [ ] **Step 3: Run the seed**

```bash
yarn buchungen:seed-termine
```

Expected: 3 termine per tour created; re-run prints `✓ already exists` for each.

- [ ] **Step 4: Run the seed a second time (idempotency)**

```bash
yarn buchungen:seed-termine
```

Expected: all `✓` lines, no `+` lines.

- [ ] **Step 5: Manual browser end-to-end test**

Start dev server in background and run through the **Golden Path** from the spec (Section 9.2):

```bash
yarn dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 10
```

In browser:
1. Visit `/touren/koenigssee-rundweg` — "Nächste Termine" section shows 3 entries with "Noch X Plätze frei", "Jetzt buchen" CTA visible
2. Without login: click "Jetzt buchen" → redirects to `/anmelden?redirect=/touren/koenigssee-rundweg/buchen`
3. Log in (or register) — returns to `/touren/.../buchen`, form pre-fills Vorname/Nachname/E-Mail from profile
4. Submit booking (pick first termin, 3 personen, enter telefon) → redirects to `/konto/buchungen?created=…`, green banner shows
5. `/konto/buchungen` lists the new booking with yellow "Angefragt" badge
6. Reload `/touren/koenigssee-rundweg` — first termin now shows "Noch 5 Plätze frei"
7. Check admin mailbox + kontakt_email for the two mails
8. In Directus Admin, change this booking's status to `bestaetigt` → Webhook fires → `bestaetigt` mail arrives
9. Back in `/konto/buchungen/[id]`, status badge turns green "Bestätigt"
10. Click "Buchung stornieren" → AlertDialog confirms → status turns gray "Storniert", Storno-Mail arrives, termin is back to "Noch 8 Plätze frei"
11. Try accessing `/konto/buchungen/<fremde-id>` with a different user → Nuxt 404

```bash
kill $DEV_PID 2>/dev/null || taskkill //F //PID $DEV_PID 2>/dev/null
```

- [ ] **Step 6: Final build gate**

```bash
yarn build 2>&1 | tail -5
```

Expected: green.

- [ ] **Step 7: Commit**

```bash
git add scripts/buchungen-seed-termine.mjs package.json
git commit -m "feat(buchungen): add idempotent seed script for 3 termine per tour"
```

---

## Summary — what ships at the end

- Two new Directus collections (`tour_termine`, `buchungen`) with full schema and permissions wired to the existing Kunde policy
- Server utilities: capacity aggregation, nodemailer wrapper with 5 templates
- Five API routes: booking create, list, detail, cancel, internal webhook receiver
- Modified content API to return termine with live capacity
- Shadcn-vue additions: badge, select, textarea, alert-dialog, tooltip, card
- Frontend composable + six booking/tour components
- Three new pages (`/touren/<slug>/buchen`, `/konto/buchungen`, `/konto/buchungen/[id]`)
- Tour-detail page wired to the new flow; konto layout has Buchungen navigation
- Seed script for tour_termine
- Manual checklist-style setup note for the one Directus webhook flow

**Env variables to add to `backup/.env` (user sets these manually — do not commit):**
```
EMAIL_HOST=mail.agenturserver.de
EMAIL_PORT=587
EMAIL_ADDRESS=contact@rholing.de
EMAIL_SECRET=<provided>
EMAIL_ADMIN=schmidt@rhowerk.de
INTERNAL_WEBHOOK_SECRET=<generate a random string>
```

**What remains outside this plan (see spec Non-Goals):** Online payment / Stripe, reminder mails, admin UI in Nuxt, cancellation fees, group discounts, iCal export, i18n for mails, removing the deprecated `booking_url` field.
