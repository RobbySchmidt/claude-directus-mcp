/**
 * i18n-Setup: Zweisprachigkeit (DE/EN) im Directus aufbauen.
 * Idempotent — kann beliebig oft laufen.
 *
 * Usage:
 *   node scripts/i18n-setup.mjs            (voller Lauf)
 *   node scripts/i18n-setup.mjs --dry-run  (zeigt nur geplante Änderungen)
 *   node scripts/i18n-setup.mjs --rollback (stellt Backup wieder her)
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { directus, readCollections, createCollection, createField, readItems, createItem } from './directus.mjs'
import { readPolicies, readPermissions, createPermission, createRelation, readFieldsByCollection } from '@directus/sdk'

const DRY = process.argv.includes('--dry-run')
const ROLLBACK = process.argv.includes('--rollback')
const BACKUP_DIR = path.resolve('exports/migrations')
const BACKUP_DATE = '2026-04-23'

// Format: { <collection>: { fields: [translatable...], hasSlug: bool } }
// hasSlug: marker for Task 6 migration (unique (lang, slug) would be enforced
// at the app layer; DB-level composite unique constraint is known-gap — see
// plan comment at Task 6). Directus v11 has no composite-unique API endpoint;
// the Task 6 migration's existence check provides functional idempotency.
const CONTENT_TRANSLATIONS = {
  touren: {
    fields: [
      { field: 'slug',         type: 'string', schema: { is_nullable: false } },
      { field: 'title',        type: 'string', schema: { is_nullable: false } },
      { field: 'subtitle',     type: 'string', schema: {} },
      { field: 'intro',        type: 'text',   schema: {} },
      { field: 'highlights',   type: 'json',   schema: {}, meta: { interface: 'tags', special: ['cast-json'] } },
      { field: 'included',     type: 'json',   schema: {}, meta: { interface: 'tags', special: ['cast-json'] } },
      { field: 'not_included', type: 'json',   schema: {}, meta: { interface: 'tags', special: ['cast-json'] } },
      { field: 'meeting_point', type: 'string', schema: {} },
      { field: 'season',       type: 'string', schema: {} },
    ],
    hasSlug: true,
  },
  tour_termine: {
    fields: [
      { field: 'hinweis', type: 'string', schema: {} },
    ],
    hasSlug: false,
  },
  pages: {
    fields: [
      { field: 'slug',  type: 'string', schema: { is_nullable: false } },
      { field: 'title', type: 'string', schema: {} },
    ],
    hasSlug: true,
  },
  seo: {
    fields: [
      { field: 'title',            type: 'text', schema: {} },
      { field: 'meta_description', type: 'text', schema: {} },
    ],
    hasSlug: false,
  },
}

const COLLECTIONS_TO_BACKUP = [
  'touren', 'tour_termine', 'pages', 'seo',
  'block_heroBanner', 'block_statsBand', 'block_tourGrid', 'block_benefits',
  'block_regionList', 'block_testimonials', 'block_newsletter', 'block_carousel',
  'block_imageText', 'block_text', 'block_banner',
  'navigation', 'navigation_items',
]

async function backupCollection(name) {
  const file = path.join(BACKUP_DIR, `${BACKUP_DATE}-i18n-${name}.json`)
  try {
    await fs.access(file)
    console.log(`  ✓ backup exists: ${name}`)
    return
  } catch {}
  const data = await directus.request(readItems(name, { limit: -1 }))
  if (DRY) {
    console.log(`  (dry) would write ${file} (${data.length} records)`)
    return
  }
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8')
  console.log(`  + backup: ${name} (${data.length} records)`)
}

async function ensureLanguagesCollection() {
  const cols = await directus.request(readCollections())
  const exists = cols.find((c) => c.collection === 'languages')
  if (!exists) {
    if (DRY) { console.log('  (dry) would create languages collection'); return }
    await directus.request(createCollection({
      collection: 'languages',
      meta: { icon: 'translate', note: 'Aktive Frontend-Sprachen', hidden: false, singleton: false },
      schema: {},
      fields: [
        { field: 'code', type: 'string', schema: { is_primary_key: true, is_nullable: false, max_length: 8 },
          meta: { interface: 'input', required: true, width: 'half' } },
        { field: 'name', type: 'string', schema: { is_nullable: false, max_length: 64 },
          meta: { interface: 'input', required: true, width: 'half' } },
        { field: 'direction', type: 'string', schema: { default_value: 'ltr', is_nullable: false, max_length: 3 },
          meta: { interface: 'select-dropdown', options: { choices: [{ text: 'LTR', value: 'ltr' }, { text: 'RTL', value: 'rtl' }] } } },
      ],
    }))
    console.log('  + languages collection')
  } else {
    console.log('  ✓ languages collection')
  }

  const seeds = [
    { code: 'de-DE', name: 'Deutsch', direction: 'ltr' },
    { code: 'en-US', name: 'English', direction: 'ltr' },
  ]
  const existing = await directus.request(readItems('languages', { limit: -1 }))
  for (const s of seeds) {
    if (existing.find((e) => e.code === s.code)) {
      console.log(`    ✓ ${s.code}`)
      continue
    }
    if (DRY) { console.log(`    (dry) would seed ${s.code}`); continue }
    await directus.request(createItem('languages', s))
    console.log(`    + ${s.code}`)
  }
}

async function ensureLanguagesPermission() {
  const policies = await directus.request(readPolicies({ filter: { name: { _eq: 'Kunde Policy' } }, limit: 1 }))
  if (!policies.length) {
    console.log('  ⚠ Kunde-Policy nicht gefunden (Auth-Setup noch nicht gelaufen?) — überspringe')
    return
  }
  const policyId = policies[0].id
  const perms = await directus.request(readPermissions({
    filter: { policy: { _eq: policyId }, collection: { _eq: 'languages' }, action: { _eq: 'read' } },
    limit: 1,
  }))
  if (perms.length) {
    console.log('  ✓ read-permission on languages')
    return
  }
  if (DRY) { console.log('  (dry) would add read-permission on languages'); return }
  await directus.request(createPermission({
    policy: policyId, collection: 'languages', action: 'read', fields: ['*'], permissions: {}, validation: {},
  }))
  console.log('  + read-permission on languages')
}

async function ensureTranslationsSubtable(parent, cfg) {
  const subtable = `${parent}_translations`
  const cols = await directus.request(readCollections())
  if (cols.find((c) => c.collection === subtable)) {
    console.log(`  ✓ ${subtable}`)
    return
  }
  if (DRY) { console.log(`  (dry) would create ${subtable}`); return }

  // Parent-Collection-PK-Typ ermitteln (uuid oder integer)
  const parentFields = await directus.request(readFieldsByCollection(parent))
  const pk = parentFields.find((f) => f.schema?.is_primary_key)
  const pkType = pk?.type ?? 'uuid'

  await directus.request(createCollection({
    collection: subtable,
    meta: { hidden: true, singleton: false, icon: 'translate' },
    schema: {},
    fields: [
      { field: 'id', type: 'uuid',
        meta: { hidden: true, interface: 'input', readonly: true, special: ['uuid'] },
        schema: { is_primary_key: true, has_auto_increment: false } },
      { field: `${parent}_id`, type: pkType,
        meta: { hidden: true, interface: 'input', readonly: true },
        schema: {} },
      { field: 'languages_code', type: 'string',
        meta: { hidden: true, interface: 'input' }, schema: { max_length: 8 } },
      ...cfg.fields.map((f) => ({ ...f })),
    ],
  }))

  // Relations: <subtable>.<parent>_id → parent (m2o)
  await directus.request(createRelation({
    collection: subtable, field: `${parent}_id`, related_collection: parent,
    meta: { one_field: 'translations', sort_field: null, one_deselect_action: 'delete', junction_field: 'languages_code' },
    schema: { on_delete: 'CASCADE' },
  }))
  // Relations: <subtable>.languages_code → languages (m2o)
  await directus.request(createRelation({
    collection: subtable, field: 'languages_code', related_collection: 'languages',
    meta: { one_field: null, sort_field: null, junction_field: `${parent}_id` },
    schema: { on_delete: 'SET NULL' },
  }))

  // Parent bekommt translations alias-field mit interface 'translations'
  await directus.request(createField(parent, {
    field: 'translations', type: 'alias',
    meta: { interface: 'translations', special: ['translations'], options: { languageField: 'code' } },
    schema: null,
  }))

  console.log(`  + ${subtable} (fields: ${cfg.fields.map((f) => f.field).join(', ')})`)
}

async function ensureContentTranslations() {
  for (const [parent, cfg] of Object.entries(CONTENT_TRANSLATIONS)) {
    await ensureTranslationsSubtable(parent, cfg)
  }
}

async function run() {
  console.log(`--- i18n-setup ${DRY ? '(DRY RUN)' : ''} ---\n`)
  await fs.mkdir(BACKUP_DIR, { recursive: true })

  console.log('→ Backup')
  for (const c of COLLECTIONS_TO_BACKUP) {
    await backupCollection(c)
  }

  console.log('\n→ Languages')
  await ensureLanguagesCollection()
  await ensureLanguagesPermission()

  console.log('\n→ Content translations')
  await ensureContentTranslations()

  // Tasks 4–7 hängen hier weitere Schritte an (NEW CALLS GO ABOVE THIS LINE):
  // await ensureBlockTranslations()
  // await ensureItemSubCollections()
  // await migrateData()
  // await seedNavigation()
  // await ensurePermissions()
  // await printReport()

  // NOTE: This ROLLBACK check must remain the LAST step before "--- done ---".
  // New task calls go ABOVE this block, never below it.
  if (ROLLBACK) {
    console.log('\nRollback not yet implemented — manual restore from exports/migrations/')
    process.exit(0)
  }

  console.log('\n--- done ---')
}

run().catch((e) => { console.error(e); process.exit(1) })
