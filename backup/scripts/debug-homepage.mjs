import { directus } from './directus.mjs';
import { readSingleton, readItems } from '@directus/sdk';

console.log('── Test 1: readSingleton("general") with simple fields');
try {
  const s = await directus.request(readSingleton('general', { fields: ['id', 'homepage'] }));
  console.log(JSON.stringify(s, null, 2));
} catch (e) {
  console.log('  err:', e?.errors ?? e);
}

console.log('\n── Test 2: readSingleton("general") with nested homepage.* fields');
try {
  const s = await directus.request(
    readSingleton('general', {
      fields: [
        'id',
        'homepage.id',
        'homepage.slug',
        'homepage.title',
        'homepage.status',
        'homepage.blocks.collection',
        'homepage.blocks.item',
        'homepage.blocks.sort',
      ],
    }),
  );
  console.log(JSON.stringify(s, null, 2));
} catch (e) {
  console.log('  err:', e?.errors ?? e);
}

console.log('\n── Test 3: readItems("general") (current endpoint approach)');
try {
  const r = await directus.request(
    readItems('general', {
      fields: ['id', 'homepage.id', 'homepage.slug'],
      limit: 1,
    }),
  );
  console.log('rows:', JSON.stringify(r, null, 2));
} catch (e) {
  console.log('  err:', e?.errors ?? e);
}
