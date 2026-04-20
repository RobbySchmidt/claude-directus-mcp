import { directus, readFields, readCollection, readItems } from './directus.mjs';
import { readRelations, readFieldsByCollection } from '@directus/sdk';

const targets = [
  'general',
  'pages',
  'pages_blocks',
  'seo',
  'block_heroBanner',
];

function fmtField(f) {
  const meta = f.meta || {};
  const schema = f.schema || {};
  const bits = [];
  bits.push(`${f.field} : ${f.type}`);
  if (meta.interface) bits.push(`ui=${meta.interface}`);
  if (meta.special?.length) bits.push(`s=[${meta.special.join(',')}]`);
  if (schema.is_primary_key) bits.push('PK');
  if (schema.is_nullable === false && !schema.is_primary_key) bits.push('req');
  if (meta.options?.choices) {
    const choices = meta.options.choices.map((c) => c.value ?? c).slice(0, 8).join('|');
    bits.push(`choices=${choices}`);
  }
  return '  ' + bits.join('  ');
}

for (const name of targets) {
  console.log(`\n════ ${name} ════`);
  try {
    await directus.request(readCollection(name));
  } catch {
    console.log('  (collection not found)');
    continue;
  }
  const fields = await directus.request(readFieldsByCollection(name));
  for (const f of fields) console.log(fmtField(f));
}

console.log('\n════ relations touching pages / pages_blocks / general / seo / block_heroBanner ════');
const rels = await directus.request(readRelations());
const names = ['pages', 'pages_blocks', 'block_heroBanner', 'general', 'seo'];
const relevant = rels.filter(
  (r) => names.includes(r.collection) || names.includes(r.related_collection ?? ''),
);
for (const r of relevant) {
  const m = r.meta ?? {};
  console.log(
    `  ${r.collection}.${r.field} → ${r.related_collection ?? '(M2A)'}` +
      (m.one_collection_field ? `  [oneColField=${m.one_collection_field}]` : '') +
      (m.one_field ? `  one_field=${m.one_field}` : '') +
      (m.junction_field ? `  junction=${m.junction_field}` : '') +
      (m.one_allowed_collections ? `  allowed=[${m.one_allowed_collections.join(',')}]` : ''),
  );
}

console.log('\n════ sample: existing block_heroBanner item (first 1) ════');
try {
  const items = await directus.request(
    readItems('block_heroBanner', { limit: 1, fields: ['*'] }),
  );
  console.log(JSON.stringify(items, null, 2));
} catch (e) {
  console.log('  err', e?.errors ?? e);
}

console.log('\n════ sample: general singleton ════');
try {
  const items = await directus.request(
    readItems('general', { limit: 1, fields: ['*'] }),
  );
  console.log(JSON.stringify(items, null, 2));
} catch (e) {
  console.log('  err', e?.errors ?? e);
}

console.log('\n════ sample: pages list ════');
try {
  const items = await directus.request(
    readItems('pages', { limit: 5, fields: ['id', 'slug', 'status', 'blocks.collection'] }),
  );
  console.log(JSON.stringify(items, null, 2));
} catch (e) {
  console.log('  err', e?.errors ?? e);
}
