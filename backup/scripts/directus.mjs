import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDirectus,
  rest,
  staticToken,
  readMe,
  readCollections,
  readCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  readFields,
  createField,
  updateField,
  deleteField,
  readItems,
  readItem,
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
} from '@directus/sdk';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, '..', '.env');

function loadEnv(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // .env is optional; process env may already be populated
  }
}

loadEnv(envPath);

const url = process.env.DIRECTUS_URL;
const token = process.env.DIRECTUS_TOKEN;

if (!url) throw new Error('DIRECTUS_URL is not set (expected in backup/.env)');
if (!token) throw new Error('DIRECTUS_TOKEN is not set (expected in backup/.env)');

export const directus = createDirectus(url).with(staticToken(token)).with(rest());

export {
  readMe,
  readCollections,
  readCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  readFields,
  createField,
  updateField,
  deleteField,
  readItems,
  readItem,
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
};
