<script setup lang="ts">
import type { AuthUser } from '~~/shared/types/auth'

const props = withDefaults(defineProps<{
  user: AuthUser | null
  size?: 'sm' | 'md' | 'lg'
}>(), { size: 'sm' })

const { public: pub } = useRuntimeConfig()

const sizeClass = computed(() => ({
  sm: 'h-9 w-9 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
}[props.size]))

const avatarUrl = computed(() =>
  props.user?.avatar ? `${pub.directusUrl}/assets/${props.user.avatar}?width=160&height=160&fit=cover` : null,
)

const initials = computed(() => {
  const u = props.user
  if (!u) return '?'
  const a = u.first_name?.[0]?.toUpperCase() ?? ''
  const b = u.last_name?.[0]?.toUpperCase() ?? ''
  if (a || b) return `${a}${b}`
  return u.email[0]?.toUpperCase() ?? '?'
})
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-foreground ring-1 ring-border"
    :class="sizeClass"
  >
    <img v-if="avatarUrl" :src="avatarUrl" :alt="user?.email ?? ''" class="h-full w-full object-cover" />
    <span v-else>{{ initials }}</span>
  </span>
</template>
