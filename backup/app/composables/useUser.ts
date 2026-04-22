import type { AuthUser } from '~~/shared/types/auth'

export function useUser() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const isLoggedIn = computed(() => user.value !== null)
  return { user, isLoggedIn }
}
