<script setup lang="ts">
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import type { TourGalleryImage } from '~~/shared/types/touren'

const props = defineProps<{
  images: TourGalleryImage[]
  tourTitle: string
}>()

const { public: pub } = useRuntimeConfig()

const srcFor = (img: TourGalleryImage) => `${pub.directusUrl}/assets/${img.id}`
const altFor = (img: TourGalleryImage, idx: number) =>
  img.title && img.title.trim().length > 0 ? img.title : `${props.tourTitle} — Bild ${idx + 1}`
</script>

<template>
  <section v-if="images.length" class="bg-muted/30">
    <div class="mx-auto max-w-7xl px-4 py-f-16 sm:px-6 lg:px-8">
      <h2 class="font-heading text-f-3xl font-medium text-foreground">Impressionen</h2>
      <Carousel
        :opts="{ loop: true, align: 'start' }"
        class="mt-8 w-full"
      >
        <CarouselContent>
          <CarouselItem
            v-for="(img, idx) in images"
            :key="img.id"
            class="md:basis-1/2 lg:basis-1/3"
          >
            <div class="overflow-hidden rounded-2xl bg-card shadow-sm">
              <img
                :src="srcFor(img)"
                :alt="altFor(img, idx)"
                class="aspect-4/3 w-full object-cover"
                loading="lazy"
              />
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious class="ml-12" />
        <CarouselNext class="mr-12" />
      </Carousel>
    </div>
  </section>
</template>
