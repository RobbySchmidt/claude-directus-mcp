<script setup lang="ts">
defineProps<{
  items: Array<{ id: number; title: string; href: string; open_in_new_tab: boolean; children: any[] }>
  mobile?: boolean
}>()
defineEmits<{ (e: 'navigate'): void }>()
</script>

<template>
  <nav :aria-label="$t('nav.main_navigation')">
    <ul :class="mobile ? 'flex flex-col gap-2' : 'flex items-center gap-8'">
      <WebsiteMenuItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        :mobile="mobile"
        @navigate="$emit('navigate')"
      />
    </ul>
  </nav>
</template>
