/**
 * Creates the `touren` collection and its scalar fields idempotently.
 * Gallery M2M (junction touren_files) is set up by touren-schema.mjs too,
 * in a second phase — see bottom of this file.
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
} from '@directus/sdk';

async function ensureCollection(name, meta) {
  const cols = await directus.request(readCollections());
  if (cols.find((c) => c.collection === name)) {
    console.log(`  ✓ collection ${name} exists`);
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

async function ensureFields(collection, fieldDefs) {
  const existing = await directus.request(readFieldsByCollection(collection));
  const have = new Set(existing.map((f) => f.field));
  for (const def of fieldDefs) {
    if (have.has(def.field)) {
      console.log(`    ✓ ${collection}.${def.field}`);
      continue;
    }
    await directus.request(createField(collection, def));
    console.log(`    + ${collection}.${def.field}`);
  }
}

const DIFFICULTY_CHOICES = {
  choices: [
    { text: 'leicht', value: 'leicht' },
    { text: 'mittel', value: 'mittel' },
    { text: 'schwer', value: 'schwer' },
  ],
};

const VARIANT_CHOICES = {
  choices: [
    { text: 'Alpensee', value: 'alpine-see' },
    { text: 'Hochgebirge', value: 'hochgebirge' },
    { text: 'Almwiese', value: 'almwiese' },
  ],
};

const STATUS_CHOICES = {
  choices: [
    { text: 'Veröffentlicht', value: 'published' },
    { text: 'Entwurf', value: 'draft' },
    { text: 'Archiviert', value: 'archived' },
  ],
};

async function run() {
  console.log('→ touren collection');
  await ensureCollection('touren', {
    icon: 'hiking',
    note: 'Geführte Wanderungen / Touren',
    display_template: '{{ title }} ({{ region }})',
    sort_field: 'sort',
    archive_field: 'status',
    archive_value: 'archived',
    unarchive_value: 'draft',
  });

  await ensureFields('touren', [
    {
      field: 'status',
      type: 'string',
      schema: { default_value: 'draft', is_nullable: false },
      meta: {
        interface: 'select-dropdown',
        options: STATUS_CHOICES,
        width: 'half',
        display: 'labels',
        display_options: {
          choices: STATUS_CHOICES.choices,
          showAsDot: true,
        },
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
      field: 'slug',
      type: 'string',
      schema: { is_unique: true, is_nullable: false, max_length: 255 },
      meta: {
        interface: 'input',
        width: 'half',
        required: true,
        note: 'URL-sicherer Slug. Nur a-z, 0-9 und Bindestriche.',
        validation: { slug: { _regex: '^[a-z0-9]+(-[a-z0-9]+)*$' } },
        validation_message: 'Nur Kleinbuchstaben, Ziffern und Bindestriche erlaubt.',
      },
    },
    {
      field: 'title',
      type: 'string',
      schema: { is_nullable: false, max_length: 255 },
      meta: { interface: 'input', width: 'full', required: true },
    },
    {
      field: 'subtitle',
      type: 'string',
      schema: { max_length: 255 },
      meta: { interface: 'input', width: 'full', note: 'Kurzer Claim unter dem Titel' },
    },
    {
      field: 'region',
      type: 'string',
      schema: { is_nullable: false, max_length: 255 },
      meta: { interface: 'input', width: 'half', required: true },
    },
    {
      field: 'difficulty',
      type: 'string',
      schema: { is_nullable: false, default_value: 'mittel' },
      meta: {
        interface: 'select-dropdown',
        options: DIFFICULTY_CHOICES,
        width: 'half',
        required: true,
      },
    },
    {
      field: 'variant',
      type: 'string',
      schema: { is_nullable: false, default_value: 'alpine-see' },
      meta: {
        interface: 'select-dropdown',
        options: VARIANT_CHOICES,
        width: 'full',
        required: true,
        note: 'Steuert die Kachel-Illustration',
      },
    },
    {
      field: 'distance',
      type: 'string',
      schema: { is_nullable: false, max_length: 64 },
      meta: { interface: 'input', width: 'half', required: true, note: 'z. B. "14 km"' },
    },
    {
      field: 'ascent',
      type: 'string',
      schema: { is_nullable: false, max_length: 64 },
      meta: { interface: 'input', width: 'half', required: true, note: 'z. B. "420 hm"' },
    },
    {
      field: 'duration',
      type: 'string',
      schema: { is_nullable: false, max_length: 64 },
      meta: { interface: 'input', width: 'half', required: true, note: 'z. B. "5 Std."' },
    },
    {
      field: 'group_size_max',
      type: 'integer',
      schema: {},
      meta: { interface: 'input', width: 'half', note: 'Max. Teilnehmer' },
    },
    {
      field: 'intro',
      type: 'text',
      schema: {},
      meta: { interface: 'input-multiline', width: 'full', note: '2–3 Sätze Einleitung' },
    },
    {
      field: 'highlights',
      type: 'json',
      schema: {},
      meta: {
        interface: 'tags',
        special: ['cast-json'],
        width: 'full',
        options: { placeholder: 'Highlight eingeben und Enter drücken' },
      },
    },
    {
      field: 'included',
      type: 'json',
      schema: {},
      meta: {
        interface: 'tags',
        special: ['cast-json'],
        width: 'half',
        note: 'Was ist dabei?',
        options: { placeholder: 'Inklusiv-Leistung eingeben' },
      },
    },
    {
      field: 'not_included',
      type: 'json',
      schema: {},
      meta: {
        interface: 'tags',
        special: ['cast-json'],
        width: 'half',
        note: 'Was ist nicht dabei?',
        options: { placeholder: 'Nicht-Inklusiv-Leistung eingeben' },
      },
    },
    {
      field: 'meeting_point',
      type: 'string',
      schema: { max_length: 255 },
      meta: { interface: 'input', width: 'full', note: 'Treffpunkt' },
    },
    {
      field: 'season',
      type: 'string',
      schema: { max_length: 64 },
      meta: { interface: 'input', width: 'half', note: 'z. B. "Mai–Oktober"' },
    },
    {
      field: 'price_from',
      type: 'integer',
      schema: {},
      meta: { interface: 'input', width: 'half', note: 'Preis ab … EUR' },
    },
    {
      field: 'booking_url',
      type: 'string',
      schema: { max_length: 500 },
      meta: { interface: 'input', width: 'full', note: 'Später echter Flow — aktuell Platzhalter-URL' },
    },
  ]);

  console.log('✓ touren collection ready (gallery relation added in phase 2)');

  // -------- Phase 2: Gallery M2M --------
  console.log('→ touren_files junction + gallery M2M');

  await ensureCollection('touren_files', {
    hidden: true,
    icon: 'import_contacts',
    note: 'Junction touren ↔ directus_files (gallery)',
  });

  await ensureFields('touren_files', [
    {
      field: 'touren_id',
      type: 'uuid',
      schema: {},
      meta: { hidden: true, interface: 'select-dropdown-m2o', special: ['m2o'] },
    },
    {
      field: 'directus_files_id',
      type: 'uuid',
      schema: {},
      meta: { hidden: true, interface: 'file', special: ['file'] },
    },
    {
      field: 'sort',
      type: 'integer',
      schema: {},
      meta: { hidden: true, interface: 'input' },
    },
  ]);

  // Create gallery alias field on touren if missing
  const tourenFields = await directus.request(readFieldsByCollection('touren'));
  if (!tourenFields.find((f) => f.field === 'gallery')) {
    await directus.request(
      createField('touren', {
        field: 'gallery',
        type: 'alias',
        schema: null,
        meta: {
          interface: 'list-m2m',
          special: ['m2m'],
          options: { enableCreate: false, enableSelect: true, layout: 'list' },
          width: 'full',
          note: '4 SVGs pro Tour — Reihenfolge via Drag&Drop',
        },
      }),
    );
    console.log('    + touren.gallery (alias/m2m)');
  } else {
    console.log('    ✓ touren.gallery');
  }

  // Create relations if missing
  const relations = await directus.request(readRelations());
  const hasTourenRel = relations.find(
    (r) => r.collection === 'touren_files' && r.field === 'touren_id',
  );
  if (!hasTourenRel) {
    await directus.request(
      createRelation({
        collection: 'touren_files',
        field: 'touren_id',
        related_collection: 'touren',
        meta: {
          one_field: 'gallery',
          junction_field: 'directus_files_id',
          sort_field: 'sort',
          one_deselect_action: 'nullify',
        },
        schema: { on_delete: 'CASCADE' },
      }),
    );
    console.log('    + relation touren_files.touren_id → touren');
  } else {
    console.log('    ✓ relation touren_files.touren_id → touren');
  }

  const hasFilesRel = relations.find(
    (r) => r.collection === 'touren_files' && r.field === 'directus_files_id',
  );
  if (!hasFilesRel) {
    await directus.request(
      createRelation({
        collection: 'touren_files',
        field: 'directus_files_id',
        related_collection: 'directus_files',
        meta: {
          one_field: null,
          junction_field: 'touren_id',
          one_deselect_action: 'nullify',
        },
        schema: { on_delete: 'CASCADE' },
      }),
    );
    console.log('    + relation touren_files.directus_files_id → directus_files');
  } else {
    console.log('    ✓ relation touren_files.directus_files_id → directus_files');
  }

  console.log('✓ done');
}

run().catch((err) => {
  console.error('✗ failed:', err?.errors ?? err);
  process.exit(1);
});
