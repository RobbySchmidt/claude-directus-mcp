import { directus } from './directus.mjs';
import { readRelations, updateRelation } from '@directus/sdk';

const NEEDED = [
  'block_heroBanner',
  'block_statsBand',
  'block_tourGrid',
  'block_benefits',
  'block_regionList',
  'block_testimonials',
  'block_newsletter',
];

const rels = await directus.request(readRelations());
const rel = rels.find((r) => r.collection === 'pages_blocks' && r.field === 'item');
if (!rel) {
  console.error('pages_blocks.item relation not found');
  process.exit(1);
}

const current = new Set(rel.meta?.one_allowed_collections ?? []);
const before = [...current];
for (const name of NEEDED) current.add(name);
const after = [...current];

if (before.length === after.length && before.every((x) => current.has(x))) {
  console.log('✓ pages_blocks.item already has all needed allowed_collections');
  console.log('  current:', after.join(', '));
  process.exit(0);
}

await directus.request(
  updateRelation('pages_blocks', 'item', {
    meta: { one_allowed_collections: after },
  }),
);

console.log('+ updated pages_blocks.item allowed_collections');
console.log('  before:', before.join(', '));
console.log('  after: ', after.join(', '));
