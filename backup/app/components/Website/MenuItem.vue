<script setup lang="ts">
const props = defineProps<{
  item: { id: number; title: string; href: string; open_in_new_tab: boolean; children: any[] }
  mobile?: boolean
}>()
defineEmits<{ (e: 'navigate'): void }>()

const open = ref(false)
const hasChildren = computed(() => props.item.children?.length > 0)
const isExternal = computed(() => props.item.href.startsWith('http'))
</script>

<template>
  <li :class="mobile ? 'border-b border-border last:border-0' : ''">
    <template v-if="!hasChildren">
      <NuxtLink
        v-if="!isExternal"
        :to="item.href"
        :target="item.open_in_new_tab ? '_blank' : undefined"
        :class="mobile ? 'block py-4 font-heading text-2xl' : 'text-sm font-medium text-foreground/80 hover:text-primary transition-colors'"
        @click="$emit('navigate')"
      >
        {{ item.title }}
      </NuxtLink>
      <a
        v-else
        :href="item.href"
        :target="item.open_in_new_tab ? '_blank' : undefined"
        rel="noopener"
        :class="mobile ? 'block py-4 font-heading text-2xl' : 'text-sm font-medium text-foreground/80 hover:text-primary transition-colors'"
        @click="$emit('navigate')"
      >
        {{ item.title }}
      </a>
    </template>

    <template v-else>
      <button
        type="button"
        class="flex w-full items-center justify-between py-4 font-heading text-2xl"
        :aria-expanded="open"
        @click="open = !open"
      >
        {{ item.title }}
        <svg class="h-5 w-5 transition-transform" :class="{ 'rotate-180': open }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <ul v-show="open" class="pb-2 pl-4">
        <li v-for="child in item.children" :key="child.id" class="py-1">
          <NuxtLink
            :to="child.href"
            :target="child.open_in_new_tab ? '_blank' : undefined"
            class="block text-base text-foreground/70 hover:text-primary"
            @click="$emit('navigate')"
          >
            {{ child.title }}
          </NuxtLink>
        </li>
      </ul>
    </template>
  </li>
</template>
