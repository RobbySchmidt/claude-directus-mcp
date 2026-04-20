<script setup lang="ts">
const cols = [
  {
    title: 'Touren',
    links: ['Tagestouren', 'Mehrtägig', 'Hochtouren', 'Familientouren', 'Winter-Wandern'],
  },
  {
    title: 'Regionen',
    links: ['Berchtesgaden', 'Dolomiten', 'Zillertal', 'Berner Oberland', 'Alle Regionen'],
  },
  {
    title: 'Unternehmen',
    links: ['Über uns', 'Unsere Guides', 'Partner', 'Presse', 'Karriere'],
  },
  {
    title: 'Service',
    links: ['Kontakt', 'FAQ', 'Ausrüstungs-Guide', 'Gutscheine', 'Hilfe'],
  },
]
</script>

<template>
  <footer class="bg-foreground text-background">
    <div class="mx-auto max-w-7xl px-4 py-f-20 sm:px-6 lg:px-8">
      <div class="grid gap-12 lg:grid-cols-[1.5fr_3fr]">
        <div>
          <a href="#" class="flex items-center gap-2">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IllustrationsIconPeak class="h-6 w-6" />
            </div>
            <span class="font-heading text-2xl font-semibold">Alpenpfad</span>
          </a>
          <p class="mt-5 max-w-sm text-sm leading-relaxed text-background/70">
            Seit 2014 geführte Wanderungen in den Alpen. Zertifizierte Guides,
            kleine Gruppen, nachhaltige Organisation.
          </p>
          <div class="mt-6 flex gap-3">
            <a
              v-for="sn in ['IG', 'FB', 'YT']"
              :key="sn"
              href="#"
              class="flex h-10 w-10 items-center justify-center rounded-lg border border-background/20 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
              :aria-label="sn"
            >
              {{ sn }}
            </a>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div v-for="col in cols" :key="col.title">
            <h3 class="font-heading text-sm font-semibold uppercase tracking-widest text-background">
              {{ col.title }}
            </h3>
            <ul class="mt-5 space-y-3">
              <li v-for="link in col.links" :key="link">
                <a href="#" class="text-sm text-background/70 transition-colors hover:text-accent">
                  {{ link }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-16 flex flex-col items-start justify-between gap-4 border-t border-background/15 pt-8 text-sm text-background/60 sm:flex-row sm:items-center">
        <p>© 2026 Alpenpfad GmbH. Alle Rechte vorbehalten.</p>
        <div class="flex gap-6">
          <a href="#" class="hover:text-accent">Impressum</a>
          <a href="#" class="hover:text-accent">Datenschutz</a>
          <a href="#" class="hover:text-accent">AGB</a>
        </div>
      </div>
    </div>
  </footer>
</template>
