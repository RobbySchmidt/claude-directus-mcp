export type AuthUser = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar: string | null
  status: 'active' | 'invited' | 'suspended' | 'archived' | 'draft'
}

export type LoginInput = { email: string; password: string }
export type RegisterInput = { email: string; password: string }
export type ProfileUpdateInput = {
  email?: string
  first_name?: string | null
  last_name?: string | null
  avatar?: string | null
}
export type PasswordChangeInput = { current_password: string; new_password: string }
export type PasswordRequestInput = { email: string }
export type PasswordResetInput = { token: string; password: string }

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'invalid_token'
  | 'token_expired'
  | 'account_suspended'
  | 'registration_disabled'
  | 'unauthorized'
  | 'rate_limited'
  | 'server_error'

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: AuthErrorCode; message: string }
