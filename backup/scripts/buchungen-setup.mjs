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
    unarchive_value: 'angefragt',
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

  console.log('\n✓ Buchungen-Setup abgeschlossen.');
  console.log('Status-Wechsel-Mails werden nicht automatisch verschickt — nach Statusänderung');
  console.log('in Directus `yarn buchungen:notify` laufen lassen.\n');
}

run().catch((err) => {
  console.error('✗ failed:', err?.errors ?? err);
  process.exit(1);
});
