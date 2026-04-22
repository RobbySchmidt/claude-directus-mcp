/**
 * Uploads 12 tour SVGs to Directus as files, in folder "touren-gallery".
 * Idempotent: re-running skips already-uploaded files (matched by title).
 * Links files to touren records via the gallery M2M — if the touren record
 * with the matching slug already exists; otherwise logs a warning and
 * continues (we'll re-run after seeding).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { directus } from './directus.mjs';
import {
  readFolders,
  createFolder,
  readFiles,
  readItems,
  createItem,
} from '@directus/sdk';

const FOLDER_NAME = 'touren-gallery';
const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORTS_ROOT = resolve(__dirname, '../exports/touren');

const cfg = {
  url: process.env.DIRECTUS_URL,
  token: process.env.DIRECTUS_TOKEN,
};
if (!cfg.url || !cfg.token) {
  console.error('DIRECTUS_URL and DIRECTUS_TOKEN must be set (from .env).');
  process.exit(1);
}

async function ensureFolder() {
  const folders = await directus.request(readFolders({ filter: { name: { _eq: FOLDER_NAME } }, limit: 1 }));
  if (folders.length) {
    console.log(`  ✓ folder ${FOLDER_NAME}`);
    return folders[0].id;
  }
  const folder = await directus.request(createFolder({ name: FOLDER_NAME }));
  console.log(`  + folder ${FOLDER_NAME}`);
  return folder.id;
}

async function uploadFile(filePath, title, folderId) {
  const existing = await directus.request(
    readFiles({ filter: { folder: { _eq: folderId }, title: { _eq: title } }, limit: 1 }),
  );
  if (existing.length) {
    console.log(`    ✓ ${title}`);
    return existing[0].id;
  }

  const buffer = readFileSync(filePath);
  const form = new FormData();
  form.append('folder', folderId);
  form.append('title', title);
  form.append('file', new Blob([buffer], { type: 'image/svg+xml' }), basename(filePath));

  const res = await fetch(`${cfg.url}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`upload ${title} failed: ${res.status} ${await res.text()}`);
  }
  const { data } = await res.json();
  console.log(`    + ${title} (${data.id})`);
  return data.id;
}

async function linkToTour(slug, fileIds) {
  const [tour] = await directus.request(
    readItems('touren', { filter: { slug: { _eq: slug } }, limit: 1, fields: ['id'] }),
  );
  if (!tour) {
    console.log(`    ! no touren record for slug="${slug}" — skipping M2M link (re-run after seed)`);
    return;
  }
  // Read current junction entries to avoid duplicates
  const current = await directus.request(
    readItems('touren_files', {
      filter: { touren_id: { _eq: tour.id } },
      fields: ['id', 'directus_files_id', 'sort'],
      limit: 100,
    }),
  );
  const linkedIds = new Set(current.map((j) => j.directus_files_id));

  for (let i = 0; i < fileIds.length; i++) {
    const fileId = fileIds[i];
    if (linkedIds.has(fileId)) {
      console.log(`      ✓ link #${i + 1}`);
      continue;
    }
    await directus.request(
      createItem('touren_files', {
        touren_id: tour.id,
        directus_files_id: fileId,
        sort: i + 1,
      }),
    );
    console.log(`      + link #${i + 1}`);
  }
}

async function run() {
  console.log('→ uploading tour gallery SVGs');
  const folderId = await ensureFolder();

  const slugs = readdirSync(EXPORTS_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const slug of slugs) {
    console.log(`  → ${slug}`);
    const dir = join(EXPORTS_ROOT, slug);
    const svgs = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
    const fileIds = [];
    for (const filename of svgs) {
      const title = `${slug}/${filename.replace(/\.svg$/, '')}`;
      const id = await uploadFile(join(dir, filename), title, folderId);
      fileIds.push(id);
    }
    await linkToTour(slug, fileIds);
  }

  console.log('✓ done');
}

run().catch((err) => {
  console.error('✗ failed:', err?.errors ?? err);
  process.exit(2);
});
