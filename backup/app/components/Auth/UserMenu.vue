<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const { user } = useUser()
const { logout } = useAuth()
const router = useRouter()
const localePath = useLocalePath()

const onLogout = async () => {
  await logout()
  await router.push('/')
}

const displayName = computed(() => {
  const u = user.value
  if (!u) return ''
  if (u.first_name) return u.first_name
  return u.email
})
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      class="inline-flex items-center gap-2 rounded-full transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      :aria-label="`${$t('auth.account')} (${displayName})`"
    >
      <AuthUserAvatar :user="user" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel class="truncate">
        {{ displayName }}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem as-child>
        <NuxtLink :to="localePath('/konto')">{{ $t('auth.account') }}</NuxtLink>
      </DropdownMenuItem>
      <DropdownMenuItem as-child>
        <NuxtLink :to="localePath('/konto/passwort')">{{ $t('auth.change_password') }}</NuxtLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="onLogout">{{ $t('auth.logout') }}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
