# Landing Page: Wandern in den Alpen

## 1. Visuelle Richtung & Stimmung

**Konzept:** Eine moderne, naturnahe Landing Page, die die Ruhe, Weite und Ursprünglichkeit der Alpen einfängt. Die Stimmung ist klar, einladend und leicht premium — inspiriert von alpinen Morgenstunden: frische Luft, kühles Licht, tiefgrüne Wälder und schneebedeckte Gipfel.

**Bildsprache:** Statt Fotografien werden durchgängig **eigene SVG-Illustrationen / Vektorgrafiken** im Flat-Design-Stil mit sanften Verläufen (Gradients) verwendet. Das schafft einen konsistenten, eigenständigen Look — ohne externe Bild-APIs, ohne API-Key, perfekt skalierbar und performant.

**Illustrationsstil:**
- Flat + sanfte Gradients (Himmel, Nebel, Schnee-Schattierungen)
- Geometrische Berggipfel in gestaffelten Ebenen (Tiefenwirkung)
- Natur-Details: Tannen, Wanderwege, Sonne, Wolken, Wanderer-Silhouetten
- Dezente Texturen durch Overlay-Formen (z. B. Wolkenstreifen)

## 2. Farbpalette

Inspiriert von alpiner Morgendämmerung — tiefes Waldgrün als Primary, warmes Sonnenlicht als Accent.

```css
/* Primary — Alpen-Waldgrün */
--primary:              oklch(0.42 0.09 155);   /* #2f6b4e */
--primary-foreground:   oklch(0.98 0.01 95);    /* #fbfaf5 */

/* Secondary — Bergnebel-Blau */
--secondary:            oklch(0.72 0.05 230);   /* #9dbcd6 */
--secondary-foreground: oklch(0.22 0.03 240);   /* #1f2b3a */

/* Accent — Sonnenaufgang-Orange */
--accent:               oklch(0.78 0.14 60);    /* #f0a95c */
--accent-foreground:    oklch(0.22 0.03 40);    /* #2d1f12 */

/* Neutrals — Schnee, Fels, Nacht */
--background:           oklch(0.985 0.005 95);  /* Schnee-Weiß (warm) */
--foreground:           oklch(0.22 0.02 240);   /* Fels-Anthrazit */
--muted:                oklch(0.95 0.01 95);    /* Heller Nebel */
--muted-foreground:     oklch(0.50 0.02 230);   /* Mittlerer Fels */
--border:               oklch(0.90 0.01 230);   /* Eis-Grau */

/* Destructive */
--destructive:          oklch(0.58 0.22 28);    /* Sonnenuntergang-Rot */
```

**Farb-Semantik:**
| Rolle | Farbe | Einsatz |
|---|---|---|
| Primary (Waldgrün) | `#2f6b4e` | CTAs, Icons, Headlines-Akzente |
| Secondary (Nebel-Blau) | `#9dbcd6` | Hintergrund-Sektionen, Karten |
| Accent (Sonnen-Orange) | `#f0a95c` | Highlights, Hover-States, Badges |
| Schnee-Weiß | `#fbfaf5` | Hauptbackground, warm statt steril |
| Fels-Anthrazit | `#1f2b3a` | Fließtext, Überschriften |

## 3. Typografie

**Headlines:** `Fraunces` (Google Fonts) — moderne Serif mit variabler Optical Size, wirkt hochwertig & warm, erinnert an Outdoor-/Reisemagazine.

**Body:** `Inter` (Google Fonts) — neutrale Sans-Serif, exzellente Lesbarkeit, hervorragende Screen-Performance.

```css
--font-heading: 'Fraunces', Georgia, serif;
--font-sans:    'Inter', system-ui, sans-serif;
```

**Type-Scale (fluid):**
- H1 Hero: `text-f-7xl` (~45–72 px), `font-heading`, `font-semibold`, tracking-tight
- H2 Section: `text-f-5xl` (~32–48 px), `font-heading`, `font-medium`
- H3 Card: `text-f-2xl` (~18–24 px), `font-heading`, `font-medium`
- Body: `text-f-lg` (~16–18 px), `font-sans`, leading-relaxed
- Eyebrow/Label: `text-sm`, `uppercase`, `tracking-widest`, Primary-Farbe

## 4. Seitenstruktur

```
1. Header / Navigation          (sticky, transparent → solid on scroll)
2. Hero                         (SVG-Bergpanorama, H1, Sub, CTA)
3. Feature-Statistiken          (3 Zahlen-Cards mit Icons)
4. Beliebte Touren              (3 Tour-Cards mit SVG-Illustrationen)
5. Warum mit uns wandern        (4 Benefit-Cards mit SVG-Icons)
6. Regionen-Showcase            (Split-Layout: SVG-Panorama + Text)
7. Testimonials                 (2–3 Karten mit Avatar-Initialen)
8. Newsletter / CTA             (Banner mit Input + Button)
9. Footer                       (Multi-Column: Links, Social, Legal)
```

## 5. Komponentenliste

Alle Komponenten werden unter `app/components/` erstellt:

### Illustrationen (SVG) — `app/components/illustrations/`
- `MountainHero.vue` — Full-width Bergpanorama mit Gradient-Himmel, gestaffelten Gipfeln, Sonne, Wolken, Wanderer-Silhouette
- `MountainPanorama.vue` — Weiteres Panorama für Regionen-Sektion (andere Komposition)
- `TourIllustration.vue` — Props-basiert: 3 Varianten (alpine-see, hochgebirge, almwiese)
- `IconPeak.vue` — Berg-Icon
- `IconBoot.vue` — Wanderschuh-Icon
- `IconCompass.vue` — Kompass-Icon
- `IconTree.vue` — Tannen-Icon
- `IconSun.vue` — Sonnen-Icon
- `IconTrail.vue` — Wanderweg-Icon

### Sections — `app/components/sections/`
- `TheHeader.vue`
- `SectionHero.vue`
- `SectionStats.vue`
- `SectionTours.vue`
- `SectionBenefits.vue`
- `SectionRegions.vue`
- `SectionTestimonials.vue`
- `SectionNewsletter.vue`
- `TheFooter.vue`

### shared — `app/components/`
- `TourCard.vue` — Card mit SVG, Titel, Difficulty-Badge, Distanz, Höhenmeter, Dauer
- `BenefitCard.vue` — Icon + Titel + Beschreibung
- `StatCard.vue` — Große Zahl + Label + Icon
- `TestimonialCard.vue` — Zitat + Avatar (Initialen) + Name + Tour

### Page
- `app/pages/index.vue` — setzt alle Sections zusammen

## 6. Inhalte (Platzhalter-Texte, DE)

- **Brand:** „Alpenpfad"
- **Hero-Headline:** „Dort, wo der Himmel die Gipfel berührt."
- **Hero-Sub:** „Geführte Wanderungen durch die schönsten Regionen der Alpen — vom sanften Almweg bis zur Hochtour."
- **CTAs:** „Touren entdecken" (primary), „Routenplaner öffnen" (ghost)
- **Stats:** „240+ Touren", „18 Alpenregionen", „12.000+ Wanderer begleitet"
- **Tours:** „Königssee-Rundweg", „Drei-Zinnen-Umrundung", „Watzmann-Überschreitung"
- **Benefits:** „Zertifizierte Guides", „Kleine Gruppen (max. 8)", „Alle Schwierigkeitsgrade", „Nachhaltig & lokal"

## 7. Responsive-Verhalten (mobile-first)

- **< 640 px:** Single-Column, Hero-SVG bleibt sichtbar aber kompakter, Stats untereinander, Tours als Carousel-artiger Stack
- **640–1024 px:** 2-Spalten-Grids für Tours/Benefits
- **> 1024 px:** 3-Spalten, Hero-SVG full-bleed, Regionen-Sektion 2-spaltig (SVG links, Text rechts)

## 8. Interaktion & Details

- Sticky Header wechselt ab ~80 px Scroll von transparent → `bg-background/80 backdrop-blur`
- Tour-Cards: Hover hebt leicht (`-translate-y-1`), Schatten intensiviert
- Buttons: Primary mit Waldgrün, Hover → Accent-Orange
- SVGs verwenden `aria-hidden="true"` + alt-Text via Wrapper, da dekorativ
- Parallax-light: Hero-SVG bekommt sehr dezentes `scroll-behavior` (optional, reines CSS)

---

**Bitte gib mir dein OK, dann starte ich mit Phase 2 (Implementierung).**
