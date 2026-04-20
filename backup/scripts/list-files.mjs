import { directus } from './directus.mjs';
import { readFiles } from '@directus/sdk';

const files = await directus.request(
  readFiles({
    fields: ['id', 'title', 'filename_download', 'type'],
    filter: { type: { _eq: 'image/svg+xml' } },
    limit: 100,
    sort: ['title'],
  }),
);

for (const f of files) {
  console.log(`${f.id}  ${f.title.padEnd(22)}  ${f.filename_download}`);
}
