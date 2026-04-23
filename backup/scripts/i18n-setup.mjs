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
import { directus, readItems } from './directus.mjs'

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

async function run() {
  console.log(`--- i18n-setup ${DRY ? '(DRY RUN)' : ''} ---\n`)
  await fs.mkdir(BACKUP_DIR, { recursive: true })

  console.log('→ Backup')
  for (const c of COLLECTIONS_TO_BACKUP) {
    await backupCollection(c)
  }

  if (ROLLBACK) {
    console.log('\nRollback not yet implemented — manual restore from exports/migrations/')
    process.exit(0)
  }

  // Tasks 2–7 hängen hier weitere Schritte an:
  // await ensureLanguagesCollection()
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
