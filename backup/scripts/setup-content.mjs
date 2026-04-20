/**
 * Creates the homepage: one row in `pages` (slug="home"), one item per block,
 * and links them via pages_blocks. Also sets general.homepage to the new page.
 *
 * Idempotent: aborts gracefully if a page with slug="home" already exists.
 */
import { directus } from './directus.mjs';
import {
  readItems,
  createItem,
  updateSingleton,
  createItems,
} from '@directus/sdk';

// ───────── file IDs (uploaded by the user) ─────────
const FILES = {
  hero_sky: 'd25bcb01-ebfd-4940-adfd-f7cff4601238',
  hero_back: '05bec3ba-87fc-4197-b686-516ad5011dd6',
  hero_mid: 'a5d3731c-193e-4895-8b41-11decaf7b66f',
  hero_front: 'd4cc18df-ce81-4846-b3b9-c586acf5c801',
  mountain_panorama: '71199720-7445-465b-b221-2c6fbf089c50',
};

// ───────── guard: already set up? ─────────
const existing = await directus.request(
  readItems('pages', { filter: { slug: { _eq: 'home' } }, limit: 1 }),
);
if (existing.length) {
  console.log('✗ A page with slug="home" already exists. Aborting.');
  console.log('  Either delete it in Directus or update this script.');
  process.exit(1);
}

console.log('═══ Populating homepage content ═══\n');

// ───────── 1. hero banner ─────────
console.log('→ block_heroBanner');
const hero = await directus.request(
  createItem('block_heroBanner', {
    eyebrow: 'Saison 2026 — jetzt buchbar',
    title: '<p>Dort, wo der Himmel <strong>die Gipfel</strong> berührt.</p>',
    lead:
      'Geführte Wanderungen durch die schönsten Regionen der Alpen — vom sanften Almweg bis zur Hochtour. Kleine Gruppen, lokale Guides, unvergessliche Aussichten.',
    cta_primary_label: 'Touren entdecken',
    cta_primary_href: '#touren',
    cta_secondary_label: 'Routenplaner öffnen',
    cta_secondary_href: '#',
    image_sky: FILES.hero_sky,
    image_back: FILES.hero_back,
    image_mid: FILES.hero_mid,
    image_front: FILES.hero_front,
    trust_signals: [
      { icon: 'sun', label: '4.9/5 aus über 2.800 Bewertungen' },
      { icon: 'compass', label: 'Zertifizierte Bergführer' },
    ],
  }),
);
console.log(`   id=${hero.id}`);

// ───────── 2. stats band ─────────
console.log('→ block_statsBand');
const stats = await directus.request(
  createItem('block_statsBand', {
    items: [
      { value: '240+', label: 'Geführte Touren im Programm', icon: 'peak' },
      { value: '18', label: 'Alpenregionen in 5 Ländern', icon: 'compass' },
      { value: '12.000+', label: 'Wanderer seit 2014 begleitet', icon: 'boot' },
    ],
  }),
);
console.log(`   id=${stats.id}`);

// ───────── 3. tour grid ─────────
console.log('→ block_tourGrid');
const tourGrid = await directus.request(
  createItem('block_tourGrid', {
    eyebrow: 'Beliebte Touren',
    headline: 'Wanderungen, die man nicht vergisst',
    lead:
      'Eine Auswahl unserer beliebtesten Routen — von der entspannten Tagestour bis zur mehrtägigen Gipfelbesteigung.',
    cta_label: 'Alle 240 Touren ansehen',
    cta_href: '#',
    tours: [
      {
        title: 'Königssee-Rundweg',
        region: 'Berchtesgadener Alpen',
        difficulty: 'leicht',
        distance: '14 km',
        ascent: '420 hm',
        duration: '5 Std.',
        variant: 'alpine-see',
      },
      {
        title: 'Drei-Zinnen-Umrundung',
        region: 'Dolomiten, Südtirol',
        difficulty: 'mittel',
        distance: '10 km',
        ascent: '380 hm',
        duration: '4 Std.',
        variant: 'hochgebirge',
      },
      {
        title: 'Watzmann-Überschreitung',
        region: 'Bayerische Alpen',
        difficulty: 'schwer',
        distance: '22 km',
        ascent: '2.100 hm',
        duration: '2 Tage',
        variant: 'almwiese',
      },
    ],
  }),
);
console.log(`   id=${tourGrid.id}`);

// ───────── 4. benefits ─────────
console.log('→ block_benefits');
const benefits = await directus.request(
  createItem('block_benefits', {
    eyebrow: 'Warum Alpenpfad',
    headline: 'Bergerlebnisse, die wirklich gut gemacht sind.',
    lead:
      'Wir organisieren seit über zehn Jahren Wanderungen in den Alpen — und wir wissen, worauf es ankommt: fachliche Sicherheit, echte Naturmomente und Organisation, die einfach funktioniert.',
    items: [
      {
        icon: 'compass',
        title: 'Zertifizierte Guides',
        description:
          'Alle Bergführer sind geprüft nach UIAGM-Standard und kennen ihre Region wie die eigene Westentasche.',
      },
      {
        icon: 'trail',
        title: 'Kleine Gruppen',
        description:
          'Maximal 8 Teilnehmer pro Tour — für echte Natur-Erlebnisse statt Massentourismus auf schmalen Graten.',
      },
      {
        icon: 'boot',
        title: 'Alle Schwierigkeitsgrade',
        description:
          'Vom gemütlichen Panoramaweg bis zur Zweitagestour mit Übernachtung auf der Hütte — wir passen zu deinem Level.',
      },
      {
        icon: 'tree',
        title: 'Nachhaltig & lokal',
        description:
          'Unterkünfte bei lokalen Hüttenwirten, öffentliche An- und Abreise inklusive, CO₂-Ausgleich pro Tour.',
      },
    ],
  }),
);
console.log(`   id=${benefits.id}`);

// ───────── 5. region list ─────────
console.log('→ block_regionList');
const regions = await directus.request(
  createItem('block_regionList', {
    eyebrow: '18 Regionen',
    headline: 'Vom Berchtesgadener Land bis in die Dolomiten.',
    lead:
      'Wir kennen jede Region persönlich und arbeiten ausschließlich mit lokalen Partnern zusammen. So erlebst du echte Orte statt austauschbare Tourismusziele.',
    cta_label: 'Regionen erkunden',
    cta_href: '#',
    image: FILES.mountain_panorama,
    regions: [
      { name: 'Berchtesgadener Land', tours: 28 },
      { name: 'Dolomiten', tours: 42 },
      { name: 'Zillertal', tours: 31 },
      { name: 'Berner Oberland', tours: 26 },
      { name: 'Ötztal', tours: 19 },
      { name: 'Karwendel', tours: 22 },
    ],
  }),
);
console.log(`   id=${regions.id}`);

// ───────── 6. testimonials ─────────
console.log('→ block_testimonials');
const testimonials = await directus.request(
  createItem('block_testimonials', {
    eyebrow: 'Stimmen',
    headline: 'Was unsere Wanderer erzählen',
    items: [
      {
        quote:
          'Wir dachten, wir kennen die Alpen. Nach drei Tagen mit Lukas als Guide wussten wir: wir haben bisher nur an der Oberfläche gekratzt.',
        name: 'Marianne Berger',
        tour: 'Drei-Zinnen-Umrundung',
        initials: 'MB',
      },
      {
        quote:
          'Perfekt organisiert vom ersten Mail bis zur Heimfahrt. Die Hütte war urig, die Gruppe klein und sympathisch — genau, was wir wollten.',
        name: 'Jonas Fellner',
        tour: 'Watzmann-Überschreitung',
        initials: 'JF',
      },
      {
        quote:
          'Als Einsteigerin hatte ich Respekt. Aber unsere Guide Anne hat das Tempo perfekt abgestimmt. Ich komme wieder — nur nächstes Mal etwas höher.',
        name: 'Sophia Kraus',
        tour: 'Königssee-Rundweg',
        initials: 'SK',
      },
    ],
  }),
);
console.log(`   id=${testimonials.id}`);

// ───────── 7. newsletter ─────────
console.log('→ block_newsletter');
const newsletter = await directus.request(
  createItem('block_newsletter', {
    eyebrow: 'Newsletter',
    headline: 'Neue Routen, zuerst in deinem Posteingang.',
    lead:
      'Einmal im Monat: neue Touren, Plätze in begrenzten Gruppen und Tipps von unseren Guides. Kein Spam. Jederzeit abbestellbar.',
    placeholder: 'deine@email.de',
    cta_label: 'Abonnieren',
    success_title: 'Danke — bis gleich im Posteingang!',
    success_text: 'Wir haben dir eine Bestätigungsmail geschickt.',
  }),
);
console.log(`   id=${newsletter.id}`);

// ───────── 8. create page ─────────
console.log('\n→ pages (slug=home)');
const page = await directus.request(
  createItem('pages', {
    slug: 'home',
    title: 'Home',
    status: 'published',
  }),
);
console.log(`   id=${page.id}`);

// ───────── 9. junction: link all blocks to the page ─────────
console.log('\n→ pages_blocks (junction)');
const junction = [
  { collection: 'block_heroBanner', item: hero.id },
  { collection: 'block_statsBand', item: String(stats.id) },
  { collection: 'block_tourGrid', item: tourGrid.id },
  { collection: 'block_benefits', item: benefits.id },
  { collection: 'block_regionList', item: regions.id },
  { collection: 'block_testimonials', item: testimonials.id },
  { collection: 'block_newsletter', item: newsletter.id },
].map((row, i) => ({ ...row, pages_id: page.id, sort: i + 1 }));

await directus.request(createItems('pages_blocks', junction));
console.log(`   linked ${junction.length} blocks`);

// ───────── 10. set general.homepage ─────────
console.log('\n→ general.homepage');
await directus.request(updateSingleton('general', { homepage: page.id }));
console.log(`   → points to page id=${page.id}`);

console.log('\n✓ Homepage populated and wired.');
console.log('  Next: run `yarn dev` and open http://localhost:3000');
