/**
 * Idempotently ensures all block collections and fields exist in Directus.
 * Safe to re-run; only creates what's missing.
 */
import { directus } from './directus.mjs';
import {
  readCollections,
  readFieldsByCollection,
  createCollection,
  createField,
} from '@directus/sdk';

// ───────── helpers ─────────

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

// ───────── field builders ─────────

const input = (field, opts = {}) => ({
  field,
  type: 'string',
  meta: { interface: 'input', width: 'full', ...opts },
  schema: {},
});

const textarea = (field, opts = {}) => ({
  field,
  type: 'text',
  meta: { interface: 'input-multiline', width: 'full', ...opts },
  schema: {},
});

const richText = (field, opts = {}) => ({
  field,
  type: 'text',
  meta: { interface: 'input-rich-text-html', width: 'full', ...opts },
  schema: {},
});

const fileImage = (field, opts = {}) => ({
  field,
  type: 'uuid',
  meta: { interface: 'file-image', special: ['file'], width: 'half', ...opts },
  schema: {},
});

const repeater = (field, { template, fields, note }) => ({
  field,
  type: 'json',
  meta: {
    interface: 'list',
    special: ['cast-json'],
    width: 'full',
    note: note ?? null,
    options: { template, fields },
  },
  schema: {},
});

const repeaterField = (name, type, interfaceName, opts = {}) => ({
  field: name,
  name: opts.label ?? name,
  type,
  meta: {
    interface: interfaceName,
    width: opts.width ?? 'full',
    options: opts.options,
    required: opts.required ?? false,
  },
});

// ───────── collection specs ─────────

const ICON_CHOICES = {
  choices: [
    { text: 'Gipfel', value: 'peak' },
    { text: 'Kompass', value: 'compass' },
    { text: 'Wanderschuh', value: 'boot' },
    { text: 'Pfad', value: 'trail' },
    { text: 'Baum', value: 'tree' },
    { text: 'Sonne', value: 'sun' },
  ],
};

const TOUR_VARIANT_CHOICES = {
  choices: [
    { text: 'Alpensee', value: 'alpine-see' },
    { text: 'Hochgebirge', value: 'hochgebirge' },
    { text: 'Almwiese', value: 'almwiese' },
  ],
};

const DIFFICULTY_CHOICES = {
  choices: [
    { text: 'leicht', value: 'leicht' },
    { text: 'mittel', value: 'mittel' },
    { text: 'schwer', value: 'schwer' },
  ],
};

const collections = [
  {
    name: 'block_heroBanner',
    meta: { icon: 'landscape', note: 'Hero-Banner mit Parallax-Layern' },
    fields: [
      input('eyebrow', { note: 'Kleiner Label-Text über der Überschrift' }),
      richText('title', { note: 'Hauptüberschrift (kann HTML enthalten)' }),
      textarea('lead', { note: 'Einleitungstext unter der Überschrift' }),
      input('cta_primary_label', { width: 'half' }),
      input('cta_primary_href', { width: 'half' }),
      input('cta_secondary_label', { width: 'half' }),
      input('cta_secondary_href', { width: 'half' }),
      fileImage('image_sky', { note: 'Parallax-Layer 1 (hinten, langsamste)' }),
      fileImage('image_back', { note: 'Parallax-Layer 2' }),
      fileImage('image_mid', { note: 'Parallax-Layer 3' }),
      fileImage('image_front', { note: 'Parallax-Layer 4 (vorne, statisch)' }),
      repeater('trust_signals', {
        template: '{{ label }}',
        fields: [
          repeaterField('icon', 'string', 'select-dropdown', { options: ICON_CHOICES, width: 'half' }),
          repeaterField('label', 'string', 'input', { width: 'half' }),
        ],
      }),
    ],
  },
  {
    name: 'block_statsBand',
    meta: { icon: 'bar_chart', note: 'Kennzahlen-Leiste' },
    fields: [
      repeater('items', {
        template: '{{ value }} — {{ label }}',
        fields: [
          repeaterField('value', 'string', 'input', { width: 'half' }),
          repeaterField('label', 'string', 'input', { width: 'full' }),
          repeaterField('icon', 'string', 'select-dropdown', { options: ICON_CHOICES, width: 'half' }),
        ],
      }),
    ],
  },
  {
    name: 'block_tourGrid',
    meta: { icon: 'grid_view', note: 'Tour-Raster mit Karten' },
    fields: [
      input('eyebrow', { width: 'half' }),
      input('headline', { width: 'full' }),
      textarea('lead'),
      input('cta_label', { width: 'half' }),
      input('cta_href', { width: 'half' }),
      repeater('tours', {
        template: '{{ title }} — {{ region }}',
        fields: [
          repeaterField('title', 'string', 'input'),
          repeaterField('region', 'string', 'input', { width: 'half' }),
          repeaterField('difficulty', 'string', 'select-dropdown', { options: DIFFICULTY_CHOICES, width: 'half' }),
          repeaterField('distance', 'string', 'input', { width: 'half' }),
          repeaterField('ascent', 'string', 'input', { width: 'half' }),
          repeaterField('duration', 'string', 'input', { width: 'half' }),
          repeaterField('variant', 'string', 'select-dropdown', { options: TOUR_VARIANT_CHOICES, width: 'half' }),
        ],
      }),
    ],
  },
  {
    name: 'block_benefits',
    meta: { icon: 'check_circle', note: 'Vorteile / USPs' },
    fields: [
      input('eyebrow', { width: 'half' }),
      input('headline'),
      textarea('lead'),
      repeater('items', {
        template: '{{ title }}',
        fields: [
          repeaterField('icon', 'string', 'select-dropdown', { options: ICON_CHOICES, width: 'half' }),
          repeaterField('title', 'string', 'input', { width: 'half' }),
          repeaterField('description', 'text', 'input-multiline'),
        ],
      }),
    ],
  },
  {
    name: 'block_regionList',
    meta: { icon: 'map', note: 'Regionen-Liste mit Panorama-Bild' },
    fields: [
      input('eyebrow', { width: 'half' }),
      input('headline'),
      textarea('lead'),
      input('cta_label', { width: 'half' }),
      input('cta_href', { width: 'half' }),
      fileImage('image', { note: 'Panorama-Bild rechts' }),
      repeater('regions', {
        template: '{{ name }} ({{ tours }})',
        fields: [
          repeaterField('name', 'string', 'input', { width: 'half' }),
          repeaterField('tours', 'integer', 'input', { width: 'half' }),
        ],
      }),
    ],
  },
  {
    name: 'block_testimonials',
    meta: { icon: 'format_quote', note: 'Kundenstimmen' },
    fields: [
      input('eyebrow', { width: 'half' }),
      input('headline'),
      repeater('items', {
        template: '{{ name }}',
        fields: [
          repeaterField('quote', 'text', 'input-multiline'),
          repeaterField('name', 'string', 'input', { width: 'half' }),
          repeaterField('tour', 'string', 'input', { width: 'half' }),
          repeaterField('initials', 'string', 'input', { width: 'half' }),
        ],
      }),
    ],
  },
  {
    name: 'block_newsletter',
    meta: { icon: 'mail', note: 'Newsletter-Anmeldung' },
    fields: [
      input('eyebrow', { width: 'half' }),
      input('headline'),
      textarea('lead'),
      input('placeholder', { width: 'half' }),
      input('cta_label', { width: 'half' }),
      input('success_title'),
      textarea('success_text'),
    ],
  },
];

// ───────── run ─────────

console.log('═══ Schema setup ═══\n');
for (const col of collections) {
  console.log(`── ${col.name}`);
  await ensureCollection(col.name, col.meta);
  await ensureFields(col.name, col.fields);
  console.log('');
}
console.log('✓ Schema setup done');
