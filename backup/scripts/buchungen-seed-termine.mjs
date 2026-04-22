/**
 * Seeds 3 future tour_termine per published tour for demo/testing.
 * Idempotent: find-or-create by (tour, date_from).
 */
import { directus } from './directus.mjs';
import { readItems, createItem } from '@directus/sdk';

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function plusDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

async function run() {
  const tours = await directus.request(
    readItems('touren', {
      filter: { status: { _eq: 'published' } },
      fields: ['id', 'slug', 'title'],
    }),
  );
  console.log(`Found ${tours.length} published tours.`);

  const today = new Date();

  for (const tour of tours) {
    console.log(`→ ${tour.title} (${tour.slug})`);

    const candidates = [
      { date_from: iso(plusDays(today, 30)), date_to: iso(plusDays(today, 32)) },
      { date_from: iso(plusDays(today, 60)), date_to: iso(plusDays(today, 62)) },
      { date_from: iso(plusDays(today, 90)), date_to: iso(plusDays(today, 92)) },
    ];

    for (const c of candidates) {
      const existing = await directus.request(
        readItems('tour_termine', {
          filter: { tour: { _eq: tour.id }, date_from: { _eq: c.date_from } },
          limit: 1,
        }),
      );
      if (existing.length) {
        console.log(`  ✓ ${c.date_from} already exists`);
        continue;
      }
      await directus.request(
        createItem('tour_termine', {
          status: 'published',
          tour: tour.id,
          date_from: c.date_from,
          date_to: c.date_to,
          hinweis: null,
          price_override: null,
        }),
      );
      console.log(`  + ${c.date_from} – ${c.date_to}`);
    }
  }

  console.log('\n✓ seeding done.');
}

run().catch((err) => {
  console.error('✗ failed:', err?.errors ?? err);
  process.exit(1);
});
