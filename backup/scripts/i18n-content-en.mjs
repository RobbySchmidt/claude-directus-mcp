// EN draft translations for Task 6 data migration.
// Robby reviews these in the Directus admin after migration; texts can be
// edited freely without touching the schema.
// Keys are matching identifiers (DE-slug for tours/pages, DE-label for items, etc.)
// See plan: docs/superpowers/plans/2026-04-23-i18n.md § Task 6.3.

export const TOUREN_EN = {
  'koenigssee-rundweg': {
    slug: 'koenigssee-loop',
    title: 'Königssee Loop',
    subtitle: 'Alpine idyll at the Bavarian fjord',
    intro: 'Guided half-day tour around Lake Königssee with a boat crossing to St. Bartholomä. Ideal for beginners and families. Easy terrain along the lakeshore with views of the Watzmann east face.',
    highlights: [
      'Boat to St. Bartholomä',
      'Echo at the cliff face',
      'Views of the Watzmann east face',
      'Flat lakeside path',
    ],
    included: [
      'Certified guide',
      'Boat ticket',
      'Emergency kit',
      'Tea at the halfway point',
    ],
    not_included: [
      'Food and drinks',
      'Travel to/from Schönau',
      'Personal equipment',
    ],
    meeting_point: 'Königssee boat dock, Schönau am Königssee',
    season: 'May – October',
  },
  'drei-zinnen-umrundung': {
    slug: 'tre-cime-loop',
    title: 'Tre Cime Loop',
    subtitle: 'Classic Dolomites circuit around three iconic peaks',
    intro: 'Full-day guided hike around the Tre Cime di Lavaredo — one of the most iconic mountain landscapes in the Alps. Moderate terrain on well-marked trails through the heart of the Dolomites.',
    highlights: [
      'Three iconic peaks from every angle',
      'Lunch at Rifugio Locatelli',
      'WWI trail remnants',
      'Panoramic views across the Dolomites',
    ],
    included: [
      'Certified guide',
      'Topo map',
      'Insurance',
      'Refreshments',
    ],
    not_included: [
      'Lunch at hut',
      'Toll road fee',
      'Personal gear',
    ],
    meeting_point: 'Rifugio Auronzo parking',
    season: 'June – September',
  },
  'watzmann-ueberschreitung': {
    slug: 'watzmann-traverse',
    title: 'Watzmann Traverse',
    subtitle: 'Demanding 2-day ridge traverse with hut overnight',
    intro: 'Two-day alpine traverse across all three Watzmann summits. One of the great classic routes in the Berchtesgaden Alps — reserved for experienced hikers comfortable on exposed terrain.',
    highlights: [
      'All three Watzmann summits',
      'Overnight at Watzmannhaus',
      'Sunrise above the Alps',
      'Exposed ridge sections',
    ],
    included: [
      'Certified alpine guide',
      'Hut reservation',
      'Via-ferrata set',
      'Emergency gear',
    ],
    not_included: [
      'Hut meals',
      'Personal alpine gear',
      'Travel to trailhead',
    ],
    meeting_point: 'Wimbachbrücke parking',
    season: 'July – September',
  },
}

export const TOUR_TERMINE_EN = {
  // Empty — no current termine have a hinweis. Add per-termin overrides here later.
}

export const PAGES_EN = {
  home: { slug: 'home', title: 'Home' },
}

export const SEO_EN = {
  DEFAULT: {
    title: 'Alpenpfad — Guided hikes in the Alps',
    meta_description: 'Guided hiking tours in the Alps. Certified guides, small groups, sustainable organization. Since 2014.',
  },
}

export const BLOCK_SCALARS_EN = {
  block_heroBanner: {
    DEFAULT: {
      title: 'Where the sky meets the peaks.',
      eyebrow: 'Season 2026 — bookings open',
      lead: 'Guided hikes through the most beautiful regions of the Alps — from gentle alpine paths to high-altitude tours.',
      cta_primary_label: 'Discover tours',
      cta_secondary_label: 'Open route planner',
    },
  },
  block_tourGrid: {
    DEFAULT: {
      eyebrow: 'Popular tours',
      headline: 'Hikes you will never forget',
      lead: 'A selection of our most popular routes.',
      cta_label: 'View all tours',
    },
  },
  block_benefits: {
    DEFAULT: {
      eyebrow: 'Why us',
      headline: 'Certified. Small. Sustainable.',
      lead: 'We keep groups small, guides local, and organization carbon-balanced.',
    },
  },
  block_regionList: {
    DEFAULT: {
      eyebrow: 'Regions',
      headline: 'From Berchtesgaden to the Bernese Oberland',
      lead: '18 regions across 5 countries.',
      cta_label: 'Browse regions',
    },
  },
  block_testimonials: {
    DEFAULT: {
      eyebrow: 'Testimonials',
      headline: 'Voices from the trail',
    },
  },
  block_newsletter: {
    DEFAULT: {
      eyebrow: 'Stay up to date',
      headline: 'New tours. New seasons. No spam.',
      lead: 'Monthly newsletter with route suggestions, seasonal tips, and early access to new bookings.',
      placeholder: 'you@example.com',
      cta_label: 'Subscribe',
      success_title: 'Almost done.',
      success_text: 'Please confirm the link we just emailed you.',
    },
  },
  block_carousel: {
    DEFAULT: { title: 'Impressions from the trail' },
  },
  block_imageText: {
    DEFAULT: { text: 'More about us — coming soon in English.' },
  },
  block_text: {
    DEFAULT: { content: '<p>English version coming soon.</p>' },
  },
  block_banner: {
    DEFAULT: { title: 'Open positions' },
  },
}

export const BLOCK_ITEMS_EN = {
  block_statsBand_items: {
    // key: DE label
    'Geführte Touren im Programm': { value: '240+', label: 'Guided tours on offer' },
    'Alpenregionen in 5 Ländern':  { value: '18',   label: 'Alpine regions in 5 countries' },
    'Wanderer seit 2014 begleitet': { value: '12,000+', label: 'Hikers guided since 2014' },
  },
  block_benefits_items: {
    // key: DE title
    'Zertifizierte Guides':         { title: 'Certified guides',    description: 'All alpine guides are UIAGM-certified and know their region inside out.' },
    'Kleine Gruppen':               { title: 'Small groups',        description: 'Max. 8 participants per tour — real nature experience, no crowds on narrow ridges.' },
    'Alle Schwierigkeitsgrade':     { title: 'Every difficulty',    description: 'From casual panorama paths to two-day tours with hut overnight — we match your level.' },
    'Nachhaltig & lokal':           { title: 'Sustainable & local', description: 'Local hut hosts, public transport to and from the trailhead, CO₂ offset per tour.' },
  },
  block_testimonials_items: {
    // key: name (non-translatable)
    'Marianne Berger': { quote: 'We thought we knew the Alps. After three days with Lukas as our guide, we realized we had only scratched the surface.' },
    'Jonas Fellner':   { quote: 'Perfectly organized from the first email to the ride home. Cozy hut, small friendly group — exactly what we wanted.' },
    'Sophia Kraus':    { quote: 'As a beginner, I was nervous. But our guide Anne paced it perfectly. I will come back — next time a little higher.' },
  },
  block_regionList_regions: {
    // key: DE name
    'Berchtesgadener Land': { name: 'Berchtesgadener Land' },
    'Dolomiten':            { name: 'Dolomites' },
    'Zillertal':            { name: 'Zillertal' },
    'Berner Oberland':      { name: 'Bernese Oberland' },
    'Ötztal':               { name: 'Ötztal' },
    'Karwendel':            { name: 'Karwendel' },
  },
  block_heroBanner_trust_signals: {
    // EN drafts intentionally omitted. The active hero-banner currently has
    // 2 trust signals in German (e.g. "4.9/5 aus über 2.800 Bewertungen",
    // "Zertifizierte Bergführer"); they are migrated DE-only and Robby adds
    // EN translations manually in the Directus admin.
  },
  block_imageText_buttons: {
    // key: DE label
    'mehr über uns': { label: 'More about us' },
  },
  block_banner_buttons: {
    // key: DE label
    'Stellen ansehen': { label: 'View openings' },
  },
}
