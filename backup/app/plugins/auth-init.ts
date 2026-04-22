import type { AuthUser } from '~~/shared/types/auth'

export default defineNuxtPlugin(async () => {
  const user = useState<AuthUser | null>('auth-user', () => null)
  if (user.value !== null) return // already loaded
  try {
    user.value = await $fetch<AuthUser | null>('/api/auth/me')
  } catch {
    user.value = null
  }
})
