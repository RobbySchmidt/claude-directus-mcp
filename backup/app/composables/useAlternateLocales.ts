const STATE_KEY = 'i18n-alternate-locales'

export function useAlternateLocales() {
  return useState<Record<string, string> | null>(STATE_KEY, () => null)
}

export function setAlternateLocales(map: Record<string, string> | null) {
  useAlternateLocales().value = map
}
