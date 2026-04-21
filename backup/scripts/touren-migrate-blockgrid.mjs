/**
 * Migrates block_tourGrid.tours from a JSON repeater field to a proper M2M
 * relation to the touren collection. Creates junction block_tourGrid_touren,
 * backs up old JSON data, maps old entries by exact title match, drops the
 * old field, creates the new alias field.
 *
 * Flags:
 *   --dry     Print plan, do not write.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { directus } from './directus.mjs';
import {
  readCollections,
  readFieldsByCollection,
  readRelations,
  readItems,
  createCollection,
  createField,
  createRelation,
  updateRelation,
  createItem,
  deleteField,
} from '@directus/sdk';

const DRY = process.argv.includes('--dry');

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '../exports/migrations');

function log(label, msg) {
  console.log(`${DRY ? '  (dry) ' : '  '}${label} ${msg}`);
}

async function ensureJunction() {
  const cols = await directus.request(readCollections());
  if (!cols.find((c) => c.collection === 'block_tourGrid_touren')) {
    log(DRY ? '→' : '+', 'create collection block_tourGrid_touren');
    if (!DRY) {
      await directus.request(
        createCollection({
          collection: 'block_tourGrid_touren',
          meta: { hidden: true, icon: 'import_contacts', note: 'Junction block_tourGrid ↔ touren' },
          schema: {},
          fields: [
            {
              field: 'id',
              type: 'integer',
              meta: { hidden: true, interface: 'input', readonly: true },
              schema: { is_primary_key: true, has_auto_increment: true },
            },
          ],
        }),
      );
    }
  } else {
    log('✓', 'collection block_tourGrid_touren');
  }

  const existing = DRY ? [] : await directus.request(readFieldsByCollection('block_tourGrid_touren'));
  const have = new Set(existing.map((f) => f.field));
  const defs = [
    {
      field: 'block_tourGrid_id',
      type: 'uuid',
      schema: {},
      meta: { hidden: true, interface: 'select-dropdown-m2o', special: ['m2o'] },
    },
    {
      field: 'touren_id',
      type: 'uuid',
      schema: {},
      meta: { hidden: true, interface: 'select-dropdown-m2o', special: ['m2o'] },
    },
    { field: 'sort', type: 'integer', schema: {}, meta: { hidden: true, interface: 'input' } },
  ];
  for (const d of defs) {
    if (have.has(d.field)) {
      log('✓', `field ${d.field}`);
      continue;
    }
    log(DRY ? '→' : '+', `field ${d.field}`);
    if (!DRY) await directus.request(createField('block_tourGrid_touren', d));
  }

  const rels = DRY ? [] : await directus.request(readRelations());
  if (!rels.find((r) => r.collection === 'block_tourGrid_touren' && r.field === 'block_tourGrid_id')) {
    log(DRY ? '→' : '+', 'relation block_tourGrid_touren.block_tourGrid_id');
    if (!DRY) {
      await directus.request(
        createRelation({
          collection: 'block_tourGrid_touren',
          field: 'block_tourGrid_id',
          related_collection: 'block_tourGrid',
          meta: {
            one_field: 'tours',
            junction_field: 'touren_id',
            sort_field: 'sort',
            one_deselect_action: 'nullify',
          },
          schema: { on_delete: 'CASCADE' },
        }),
      );
      // Directus SDK createRelation does not reliably persist one_field — patch it explicitly.
      await directus.request(
        updateRelation('block_tourGrid_touren', 'block_tourGrid_id', {
          meta: { one_field: 'tours', junction_field: 'touren_id', sort_field: 'sort', one_deselect_action: 'nullify' },
        }),
      );
    }
  } else {
    log('✓', 'relation .block_tourGrid_id');
  }
  if (!rels.find((r) => r.collection === 'block_tourGrid_touren' && r.field === 'touren_id')) {
    log(DRY ? '→' : '+', 'relation block_tourGrid_touren.touren_id');
    if (!DRY) {
      await directus.request(
        createRelation({
          collection: 'block_tourGrid_touren',
          field: 'touren_id',
          related_collection: 'touren',
          meta: { one_field: null, junction_field: 'block_tourGrid_id', one_deselect_action: 'nullify' },
          schema: { on_delete: 'CASCADE' },
        }),
      );
    }
  } else {
    log('✓', 'relation .touren_id');
  }
}

async function backupOldData() {
  const blocks = await directus.request(
    readItems('block_tourGrid', { fields: ['id', 'headline', 'tours'], limit: -1 }),
  );
  mkdirSync(MIGRATIONS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const path = resolve(MIGRATIONS_DIR, `block_tourGrid-backup-${ts}.json`);
  if (!DRY) writeFileSync(path, JSON.stringify(blocks, null, 2));
  log(DRY ? '→' : '+', `backup ${path}`);
  return blocks;
}

async function mapToJunctions(blocks) {
  const touren = await directus.request(
    readItems('touren', { fields: ['id', 'title'], limit: -1 }),
  );
  const byTitle = new Map(touren.map((t) => [t.title.toLowerCase(), t.id]));

  for (const block of blocks) {
    const json = block.tours;
    if (!Array.isArray(json) || json.length === 0) {
      log('·', `block ${block.id} — no tours`);
      continue;
    }
    for (let i = 0; i < json.length; i++) {
      const oldTour = json[i];
      const tourenId = byTitle.get(oldTour.title?.toLowerCase());
      if (!tourenId) {
        log('!', `block ${block.id} #${i}: no touren matches "${oldTour.title}"`);
        continue;
      }
      log(DRY ? '→' : '+', `junction block=${block.id} touren=${oldTour.title} sort=${i + 1}`);
      if (!DRY) {
        await directus.request(
          createItem('block_tourGrid_touren', {
            block_tourGrid_id: block.id,
            touren_id: tourenId,
            sort: i + 1,
          }),
        );
      }
    }
  }
}

async function dropOldFieldAndAddAlias() {
  const fields = DRY ? [] : await directus.request(readFieldsByCollection('block_tourGrid'));
  const oldField = fields.find((f) => f.field === 'tours' && f.type === 'json');
  if (oldField) {
    log(DRY ? '→' : '-', 'drop block_tourGrid.tours (old json)');
    if (!DRY) await directus.request(deleteField('block_tourGrid', 'tours'));
  } else {
    log('·', 'no old json field to drop');
  }

  const aliasExists = fields.find((f) => f.field === 'tours' && f.type === 'alias');
  if (!aliasExists) {
    log(DRY ? '→' : '+', 'create block_tourGrid.tours (alias/m2m)');
    if (!DRY) {
      await directus.request(
        createField('block_tourGrid', {
          field: 'tours',
          type: 'alias',
          schema: null,
          meta: {
            interface: 'list-m2m',
            special: ['m2m'],
            options: { enableCreate: false, enableSelect: true, layout: 'list' },
            width: 'full',
            note: 'Ausgewählte Touren — Reihenfolge per Drag&Drop',
          },
        }),
      );
    }
  } else {
    log('✓', 'alias tours already exists');
  }
}

async function run() {
  console.log(`→ migrate block_tourGrid.tours → M2M ${DRY ? '(DRY RUN)' : ''}`);
  const blocks = await backupOldData();

  // Idempotency guard: if already migrated, Directus returns tours as an array of
  // junction IDs (numbers) or M2M objects — not the old JSON {title, …} objects.
  // Old JSON entries always have a string `title` property; anything else means migrated.
  const firstTour = blocks[0]?.tours?.[0];
  const alreadyMigrated =
    blocks.length > 0 &&
    Array.isArray(blocks[0]?.tours) &&
    blocks[0].tours.length > 0 &&
    !(typeof firstTour === 'object' && firstTour !== null && typeof firstTour.title === 'string');
  if (alreadyMigrated) {
    console.log('  ✓ already migrated — skipping junction creation');
  }

  await ensureJunction();
  if (!alreadyMigrated) {
    await mapToJunctions(blocks);
  }
  await dropOldFieldAndAddAlias();
  console.log('✓ done');
}

run().catch((err) => {
  console.error('✗ failed:', err?.errors ?? err);
  process.exit(1);
});
