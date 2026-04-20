import { directus } from './directus.mjs';
import { readItems, updateSingleton } from '@directus/sdk';

const pages = await directus.request(
  readItems('pages', { filter: { slug: { _eq: 'home' } }, limit: 1 }),
);
const page = pages[0];
if (!page) {
  console.error('✗ No page with slug="home" found.');
  process.exit(1);
}

await directus.request(updateSingleton('general', { homepage: page.id }));
console.log(`✓ general.homepage → ${page.id}`);
