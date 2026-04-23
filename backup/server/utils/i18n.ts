export const SUPPORTED_LOCALES = ['de', 'en'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

const NUXT_TO_DIRECTUS: Record<string, string> = { de: 'de-DE', en: 'en-US' }

export function toDirectusLocale(nuxtLocale: unknown): string {
  if (typeof nuxtLocale !== 'string') return 'de-DE'
  return NUXT_TO_DIRECTUS[nuxtLocale] ?? 'de-DE'
}

export function toNuxtLocale(directusLocale: string): SupportedLocale {
  const rev: Record<string, SupportedLocale> = { 'de-DE': 'de', 'en-US': 'en' }
  return rev[directusLocale] ?? 'de'
}
