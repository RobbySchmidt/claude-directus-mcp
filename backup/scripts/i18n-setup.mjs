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
import { directus, readCollections, createCollection, readItems, createItem } from './directus.mjs'
import { readPolicies, readPermissions, createPermission } from '@directus/sdk'

const DRY = process.argv.includes('--dry-run')
const ROLLBACK = process.argv.includes('--rollback')
const BACKUP_DIR = path.resolve('exports/migrations')
const BACKUP_DATE = '2026-04-23'

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
  const policies = await directus.request(readPolicies({ filter: { name: { _eq: 'Kunde' } }, limit: 1 }))
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

  // NOTE: This ROLLBACK check must remain AFTER all task calls above so that
  // --rollback only runs once all backups + (no-op) task phases have executed.
  if (ROLLBACK) {
    console.log('\nRollback not yet implemented — manual restore from exports/migrations/')
    process.exit(0)
  }

  // Tasks 3–7 hängen hier weitere Schritte an:
  // await ensureContentTranslations()
  // await ensureBlockTranslations()
  // await ensureItemSubCollections()
  // await migrateData()
  // await seedNavigation()
  // await ensurePermissions()
  // await printReport()

  console.log('\n--- done ---')
}

run().catch((e) => { console.error(e); process.exit(1) })
