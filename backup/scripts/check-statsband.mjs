import { directus } from './directus.mjs';
import { readFieldsByCollection } from '@directus/sdk';

const fields = await directus.request(readFieldsByCollection('block_statsBand'));
for (const f of fields) {
  console.log(JSON.stringify(f, null, 2));
}
