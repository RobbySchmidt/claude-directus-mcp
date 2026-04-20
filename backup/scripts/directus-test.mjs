import {
  directus,
  readMe,
  readCollections,
  createCollection,
  createField,
  deleteCollection,
  createItem,
  readItems,
  deleteItem,
} from './directus.mjs';

const COLLECTION = 'claude_test_playground';

function line(label) {
  console.log(`\n── ${label} ──`);
}

async function main() {
  line('1) Who am I?');
  const me = await directus.request(readMe({ fields: ['id', 'email', 'first_name', 'role'] }));
  console.log(me);

  line('2) List existing collections (non-system)');
  const cols = await directus.request(readCollections());
  const userCols = cols
    .filter((c) => !c.collection.startsWith('directus_'))
    .map((c) => c.collection);
  console.log(userCols.length ? userCols : '(none yet)');

  if (userCols.includes(COLLECTION)) {
    line(`(cleanup) Removing leftover "${COLLECTION}" from previous run`);
    await directus.request(deleteCollection(COLLECTION));
  }

  line(`3) Create collection "${COLLECTION}" with an id field`);
  await directus.request(
    createCollection({
      collection: COLLECTION,
      meta: {
        icon: 'science',
        note: 'Temporary sandbox created by Claude to verify SDK access',
        hidden: false,
        singleton: false,
      },
      schema: {},
      fields: [
        {
          field: 'id',
          type: 'integer',
          meta: { hidden: true, interface: 'input', readonly: true },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
      ],
    }),
  );
  console.log('collection created');

  line('4) Add a "title" string field');
  await directus.request(
    createField(COLLECTION, {
      field: 'title',
      type: 'string',
      meta: { interface: 'input', width: 'full' },
      schema: { is_nullable: false },
    }),
  );
  console.log('field created');

  line('5) Create two items');
  const a = await directus.request(createItem(COLLECTION, { title: 'Hallo Directus' }));
  const b = await directus.request(createItem(COLLECTION, { title: 'Zweites Item' }));
  console.log({ a, b });

  line('6) Read items back');
  const items = await directus.request(readItems(COLLECTION, { fields: ['id', 'title'] }));
  console.log(items);

  line('7) Cleanup: delete items + collection');
  await directus.request(deleteItem(COLLECTION, a.id));
  await directus.request(deleteItem(COLLECTION, b.id));
  await directus.request(deleteCollection(COLLECTION));
  console.log('cleaned up');

  line('OK — SDK is fully operational');
}

main().catch((err) => {
  console.error('\n✗ Test failed:');
  if (err?.errors) console.error(JSON.stringify(err.errors, null, 2));
  else console.error(err);
  process.exitCode = 1;
});
