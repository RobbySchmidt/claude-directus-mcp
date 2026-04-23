type NavItem = {
  id: number
  sort: number | null
  type: string
  url: string | null
  open_in_new_tab: boolean
  title: string
  href: string
  children: NavItem[]
}

export async function useNavigation() {
  const { locale } = useI18n()
  const { data } = await useFetch<Record<string, NavItem[]>>('/api/content/navigation', {
    query: { locale },
    key: `navigation-${locale.value}`,
  })
  return {
    main: computed(() => data.value?.Main ?? []),
    footer: computed(() => data.value?.Footer ?? []),
    footerLegal: computed(() => data.value?.FooterLegal ?? []),
  }
}
