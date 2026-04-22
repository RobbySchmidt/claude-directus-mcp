/**
 * SMTP connection + auth diagnostic.
 *
 * Usage: yarn buchungen:mail-test [to-email]
 *
 * Tries both port 465 (implicit SSL) and port 587 (STARTTLS) with the
 * credentials from .env, reports which one works. Optionally sends a
 * tiny test mail if an address is given as the first CLI arg.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'

// Load .env the same way scripts/directus.mjs does — no dotenv dep.
const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '..', '.env')
try {
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
} catch {
  // .env optional
}

const host = process.env.EMAIL_HOST
const user = process.env.EMAIL_ADDRESS
const pass = process.env.EMAIL_SECRET
const sendTo = process.argv[2] || null

function mask(s) {
  if (!s) return '<UNSET>'
  if (s.length <= 4) return '*'.repeat(s.length)
  return s.slice(0, 2) + '*'.repeat(s.length - 4) + s.slice(-2)
}

console.log('=== SMTP config (from .env) ===')
console.log('EMAIL_HOST:    ', host ?? '<UNSET>')
console.log('EMAIL_ADDRESS: ', user ?? '<UNSET>')
console.log('EMAIL_SECRET:  ', mask(pass), `(length=${pass?.length ?? 0})`)
console.log('EMAIL_PORT:    ', process.env.EMAIL_PORT ?? '(default 587)')

if (!host || !user || !pass) {
  console.error('\n✗ Missing credentials in .env — cannot test.')
  process.exit(1)
}

async function tryConnection(port, secure, label) {
  process.stdout.write(`\n--- ${label} (port=${port}, secure=${secure}) ---\n`)
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
  })
  try {
    await transporter.verify()
    console.log('  ✓ connection + auth OK')
    return transporter
  } catch (err) {
    console.log('  ✗', err?.message ?? err)
    return null
  }
}

const tests = [
  { port: 465, secure: true, label: '465 SSL' },
  { port: 587, secure: false, label: '587 STARTTLS' },
]

let working = null
for (const t of tests) {
  const tx = await tryConnection(t.port, t.secure, t.label)
  if (tx && !working) working = { tx, ...t }
}

if (!working) {
  console.error('\n✗ No working configuration found.')
  console.error('Likely causes:')
  console.error('  - Wrong EMAIL_ADDRESS (must be full address)')
  console.error('  - Wrong EMAIL_SECRET (check for typos, special chars needing .env quoting)')
  console.error('  - SMTP server requires a different auth mechanism')
  console.error('  - Account is locked or mail-sending is disabled')
  process.exit(1)
}

console.log(`\n✓ Use EMAIL_PORT=${working.port} in .env (currently ${process.env.EMAIL_PORT ?? 'unset → defaults to 587'})`)

if (sendTo) {
  console.log(`\n--- Sending test mail to ${sendTo} ---`)
  try {
    const info = await working.tx.sendMail({
      from: `"Alpenpfad SMTP-Test" <${user}>`,
      to: sendTo,
      subject: 'SMTP-Test — Alpenpfad',
      text: 'Wenn du diese Mail siehst, funktioniert der SMTP-Versand.',
    })
    console.log('  ✓ messageId:', info.messageId)
  } catch (err) {
    console.log('  ✗', err?.message ?? err)
  }
}
