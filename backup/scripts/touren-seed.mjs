/**
 * Idempotent seed for the three initial touren records.
 * Upserts by slug: creates if missing, updates content fields if present.
 */
import { directus } from './directus.mjs';
import { readItems, createItem, updateItem } from '@directus/sdk';

const TOUREN = [
  {
    slug: 'koenigssee-rundweg',
    status: 'published',
    sort: 1,
    title: 'Königssee-Rundweg',
    subtitle: 'Still, tief, sagenumwoben — ein Tag am smaragdgrünen Juwel',
    region: 'Berchtesgadener Alpen',
    difficulty: 'leicht',
    variant: 'alpine-see',
    distance: '14 km',
    ascent: '420 hm',
    duration: '5 Std.',
    group_size_max: 12,
    intro:
      'Der Königssee zählt zu den saubersten Seen Deutschlands. Auf dieser gemütlichen Rundtour folgen wir dem Ufer, passieren den berühmten Malerwinkel und lassen uns vom Echo der Bartholomäuswand überraschen.',
    highlights: [
      'Panoramablick vom Malerwinkel',
      'Fahrt mit dem elektrischen Boot (inkl.)',
      'Einkehr auf St. Bartholomä',
      'Echo-Demonstration an der Steilwand',
    ],
    included: ['Geführte Wanderung', 'Bootsfahrt Hin & Zurück', 'Ortskundiger Guide', 'Kleine Brotzeit'],
    not_included: ['Anreise', 'Getränke', 'Eintritt Eishöhle (optional)'],
    meeting_point: 'Parkplatz Königssee-Seelände, 83471 Schönau',
    season: 'Mai–Oktober',
    price_from: 89,
    booking_url: '',
  },
  {
    slug: 'drei-zinnen-umrundung',
    status: 'published',
    sort: 2,
    title: 'Drei-Zinnen-Umrundung',
    subtitle: 'Das UNESCO-Wahrzeichen der Dolomiten — ein Tag zwischen Felsnadeln',
    region: 'Dolomiten, Südtirol',
    difficulty: 'mittel',
    variant: 'hochgebirge',
    distance: '10 km',
    ascent: '380 hm',
    duration: '4 Std.',
    group_size_max: 10,
    intro:
      'Die drei markanten Felstürme sind ein Mythos für jeden Bergfreund. Unsere Umrundung führt über zwei Schutzhütten und bietet ständig neue Perspektiven auf das weltberühmte Panorama.',
    highlights: [
      'Einkehr Auronzohütte & Lavaredohütte',
      'Blick auf Nord-, Ost- und Westwand der Zinnen',
      'Historische WWI-Stellungen am Wegrand',
      'Alpenglühen auf der Heimfahrt',
    ],
    included: ['Bergführung', 'Maut zur Auronzohütte', 'Wanderkarte', 'Brotzeit-Paket'],
    not_included: ['Anreise ins Höhlensteintal', 'Hüttengetränke', 'Unfallversicherung'],
    meeting_point: 'Parkplatz Rifugio Auronzo (2.320 m), Misurina',
    season: 'Juni–Oktober',
    price_from: 129,
    booking_url: '',
  },
  {
    slug: 'watzmann-ueberschreitung',
    status: 'published',
    sort: 3,
    title: 'Watzmann-Überschreitung',
    subtitle: 'Zwei Tage, drei Gipfel, ein Mythos — die Königsroute der Bayerischen Alpen',
    region: 'Bayerische Alpen',
    difficulty: 'schwer',
    variant: 'almwiese',
    distance: '22 km',
    ascent: '2.100 hm',
    duration: '2 Tage',
    group_size_max: 6,
    intro:
      'Hocheck, Mittelspitze, Südspitze — die klassische Überschreitung verlangt Trittsicherheit, Schwindelfreiheit und einen ausdauernden Körper. Die Belohnung: eine der spektakulärsten Gratwanderungen der Ostalpen.',
    highlights: [
      'Übernachtung auf dem Watzmannhaus (1.928 m)',
      'Gipfelkreuz Mittelspitze (2.713 m)',
      'Ausgesetzter Grat mit Stahlseil-Passagen',
      'Blick hinunter zum Königssee',
    ],
    included: [
      'Staatlich geprüfter Bergführer',
      'Halbpension auf dem Watzmannhaus',
      'Klettersteig-Set (Leihgabe)',
      'Helm',
    ],
    not_included: ['Anreise', 'Getränke auf der Hütte', 'Bergbahn Jenner (optional)'],
    meeting_point: 'Wimbachbrücke, Ramsau bei Berchtesgaden',
    season: 'Juli–September',
    price_from: 429,
    booking_url: '',
  },
];

async function upsert(item) {
  const [existing] = await directus.request(
    readItems('touren', { filter: { slug: { _eq: item.slug } }, limit: 1, fields: ['id'] }),
  );
  if (existing) {
    await directus.request(updateItem('touren', existing.id, item));
    console.log(`  ✓ updated ${item.slug}`);
    return existing.id;
  }
  const created = await directus.request(createItem('touren', item));
  console.log(`  + created ${item.slug} (${created.id})`);
  return created.id;
}

async function run() {
  console.log('→ seeding touren');
  for (const t of TOUREN) await upsert(t);
  console.log('✓ done');
}

run().catch((err) => {
  console.error('✗ failed:', err?.errors ?? err);
  process.exit(1);
});
