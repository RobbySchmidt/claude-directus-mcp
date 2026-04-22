import type { AuthUser } from '~~/shared/types/auth'

export default defineNuxtPlugin(async () => {
  const user = useState<AuthUser | null>('auth-user', () => null)
  if (user.value !== null) return // already loaded
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  try {
    user.value = await $fetch<AuthUser | null>('/api/auth/me', { headers })
  } catch {
    user.value = null
  }
})
