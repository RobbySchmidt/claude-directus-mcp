import type {
  BuchungCreateInput,
  BuchungDetail,
  BuchungListItem,
  BuchungResult,
} from '~~/shared/types/buchung'

type ApiResult<T = void> = BuchungResult<T>

async function callJson<T>(
  url: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    return await $fetch<ApiResult<T>>(url, { method, body })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; data?: ApiResult<T> }
    if (e.data?.ok === false) return e.data
    return { ok: false, error: 'server_error', message: 'Verbindungsproblem — bitte erneut versuchen.' }
  }
}

export function useBuchungen() {
  return {
    async createBuchung(input: BuchungCreateInput) {
      return callJson<BuchungDetail>('/api/buchungen', 'POST', input)
    },
    async listBuchungen() {
      return callJson<BuchungListItem[]>('/api/buchungen', 'GET')
    },
    async getBuchung(id: string) {
      return callJson<BuchungDetail>(`/api/buchungen/${id}`, 'GET')
    },
    async cancelBuchung(id: string) {
      return callJson<BuchungDetail>(`/api/buchungen/${id}/cancel`, 'POST')
    },
  }
}
