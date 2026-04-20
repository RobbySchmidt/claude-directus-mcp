<script setup lang="ts">
defineProps<{ name?: string | null }>()
</script>

<template>
  <IllustrationsIconPeak v-if="name === 'peak'" />
  <IllustrationsIconCompass v-else-if="name === 'compass'" />
  <IllustrationsIconBoot v-else-if="name === 'boot'" />
  <IllustrationsIconTrail v-else-if="name === 'trail'" />
  <IllustrationsIconTree v-else-if="name === 'tree'" />
  <IllustrationsIconSun v-else-if="name === 'sun'" />
</template>
