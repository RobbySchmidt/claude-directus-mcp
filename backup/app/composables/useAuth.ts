import type {
  AuthResult,
  AuthUser,
  LoginInput,
  RegisterInput,
  ProfileUpdateInput,
  PasswordChangeInput,
  PasswordRequestInput,
  PasswordResetInput,
} from '~~/shared/types/auth'

type ApiResult<T = void> = AuthResult<T>

async function callJson<T>(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<ApiResult<T>> {
  try {
    return await $fetch<ApiResult<T>>(url, { method, body })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; data?: ApiResult<T> }
    if (e.data?.ok === false) return e.data
    return { ok: false, error: 'server_error', message: 'Verbindungsproblem — bitte später erneut versuchen' }
  }
}

export function useAuth() {
  const { user } = useUser()

  const setUser = (next: AuthUser | null) => {
    user.value = next
  }

  return {
    async login(input: LoginInput) {
      const res = await callJson<AuthUser>('/api/auth/login', 'POST', input)
      if (res.ok) setUser(res.data)
      return res
    },
    async register(input: RegisterInput) {
      const res = await callJson<AuthUser>('/api/auth/register', 'POST', input)
      if (res.ok) setUser(res.data)
      return res
    },
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      setUser(null)
    },
    async updateProfile(input: ProfileUpdateInput & Partial<PasswordChangeInput>) {
      const res = await callJson<AuthUser>('/api/auth/me', 'PATCH', input)
      if (res.ok) setUser(res.data)
      return res
    },
    async uploadAvatar(file: File): Promise<ApiResult<AuthUser>> {
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await $fetch<ApiResult<AuthUser>>('/api/auth/avatar', { method: 'POST', body: form })
        if (res.ok) setUser(res.data)
        return res
      } catch (err: unknown) {
        const e = err as { data?: ApiResult<AuthUser> }
        if (e.data?.ok === false) return e.data
        return { ok: false, error: 'server_error', message: 'Upload fehlgeschlagen' }
      }
    },
    async requestPasswordReset(input: PasswordRequestInput) {
      return callJson<void>('/api/auth/password-request', 'POST', input)
    },
    async resetPassword(input: PasswordResetInput) {
      return callJson<void>('/api/auth/password-reset', 'POST', input)
    },
  }
}
