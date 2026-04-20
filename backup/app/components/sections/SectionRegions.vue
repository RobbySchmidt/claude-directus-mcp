<script setup lang="ts">
const regions = [
  { name: 'Berchtesgadener Land', tours: 28 },
  { name: 'Dolomiten', tours: 42 },
  { name: 'Zillertal', tours: 31 },
  { name: 'Berner Oberland', tours: 26 },
  { name: 'Ötztal', tours: 19 },
  { name: 'Karwendel', tours: 22 },
]
</script>

<template>
  <section id="regionen" class="relative overflow-hidden bg-primary py-f-24 text-primary-foreground">
    <div class="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div>
        <span class="text-xs font-medium uppercase tracking-widest text-accent">
          18 Regionen
        </span>
        <h2 class="mt-3 font-heading text-f-5xl font-medium leading-tight tracking-tight">
          Vom Berchtesgadener Land bis in die Dolomiten.
        </h2>
        <p class="mt-5 text-f-lg leading-relaxed text-primary-foreground/85">
          Wir kennen jede Region persönlich und arbeiten ausschließlich mit lokalen
          Partnern zusammen. So erlebst du echte Orte statt austauschbare Tourismusziele.
        </p>

        <ul class="mt-8 grid grid-cols-2 gap-x-8 gap-y-3">
          <li
            v-for="region in regions"
            :key="region.name"
            class="flex items-center justify-between border-b border-primary-foreground/15 pb-3"
          >
            <span class="font-medium">{{ region.name }}</span>
            <span class="text-sm text-primary-foreground/60">{{ region.tours }} Touren</span>
          </li>
        </ul>

        <Button size="lg" class="mt-10 h-12 bg-accent px-8 text-accent-foreground hover:bg-accent/90">
          Regionen erkunden
        </Button>
      </div>

      <div class="relative overflow-hidden rounded-3xl shadow-2xl">
        <IllustrationsMountainPanorama />
      </div>
    </div>
  </section>
</template>
