<script setup lang="ts">
const scrolled = ref(false)
const mobileOpen = ref(false)

const onScroll = () => {
  scrolled.value = window.scrollY > 40
}

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') mobileOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKey)
  if (typeof document !== 'undefined') document.documentElement.style.overflow = ''
})

watch(mobileOpen, (open) => {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = open ? 'hidden' : ''
})

const nav = [
  { label: 'Touren', href: '/#touren' },
  { label: 'Regionen', href: '/#regionen' },
  { label: 'Warum wir', href: '/#benefits' },
  { label: 'Stimmen', href: '/#stimmen' },
]

const { isLoggedIn, user } = useUser()
const { logout } = useAuth()
const router = useRouter()
const onMobileLogout = async () => {
  mobileOpen.value = false
  await logout()
  await router.push('/')
}
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
    :class="scrolled || mobileOpen ? 'border-b border-border bg-background/80 backdrop-blur-md' : 'bg-transparent'"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="flex items-center gap-2">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <IllustrationsIconPeak class="h-5 w-5" />
        </div>
        <span class="font-heading text-xl font-semibold text-foreground">Alpenpfad</span>
      </NuxtLink>

      <nav class="hidden items-center gap-8 md:flex">
        <NuxtLink
          v-for="item in nav"
          :key="item.href"
          :to="item.href"
          class="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="hidden items-center gap-3 md:flex">
        <template v-if="isLoggedIn">
          <AuthUserMenu />
        </template>
        <template v-else>
          <Button variant="ghost" size="sm" as="a" href="/anmelden">Anmelden</Button>
        </template>
        <Button size="sm" class="bg-primary text-primary-foreground hover:bg-primary/90">
          Tour buchen
        </Button>
      </div>

      <button
        class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground md:hidden"
        :aria-label="mobileOpen ? 'Menü schließen' : 'Menü öffnen'"
        :aria-expanded="mobileOpen"
        @click="mobileOpen = !mobileOpen"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <!-- Mobile drawer: teleported to body to escape the header's backdrop-filter
         containing block (backdrop-filter traps fixed descendants) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-400 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <aside
          v-if="mobileOpen"
          class="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Hauptnavigation"
        >
        <div class="flex items-center justify-between border-b border-border px-6 py-5">
          <div class="flex items-center gap-2">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IllustrationsIconPeak class="h-5 w-5" />
            </div>
            <span class="font-heading text-lg font-semibold text-foreground">Alpenpfad</span>
          </div>
          <button
            class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
            aria-label="Menü schließen"
            @click="mobileOpen = false"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>

        <nav class="flex flex-col px-6 py-6">
          <NuxtLink
            v-for="(item, i) in nav"
            :key="item.href"
            :to="item.href"
            class="group flex items-center justify-between border-b border-border py-4 font-heading text-2xl text-foreground transition-colors hover:text-primary"
            :style="{ transitionDelay: mobileOpen ? `${i * 60 + 200}ms` : '0ms' }"
            @click="mobileOpen = false"
          >
            <span>{{ item.label }}</span>
            <svg
              class="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </nav>

        <div class="mt-auto flex flex-col gap-3 border-t border-border px-6 py-6">
          <template v-if="isLoggedIn">
            <NuxtLink
              to="/konto"
              class="inline-flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted"
              @click="mobileOpen = false"
            >
              <AuthUserAvatar :user="user" />
              <span class="font-medium text-foreground">{{ user?.first_name || user?.email }}</span>
            </NuxtLink>
            <Button
              variant="ghost"
              size="lg"
              class="h-12 w-full justify-center text-base"
              @click="onMobileLogout"
            >
              Abmelden
            </Button>
          </template>
          <template v-else>
            <Button variant="ghost" size="lg" class="h-12 w-full justify-center text-base" as="a" href="/anmelden">
              Anmelden
            </Button>
          </template>
          <Button size="lg" class="h-12 w-full justify-center bg-primary text-base text-primary-foreground hover:bg-primary/90">
            Tour buchen
          </Button>
          <p class="mt-2 text-center text-xs text-muted-foreground">
            Fragen? <a href="#" class="text-primary hover:underline">Schreib uns</a>
          </p>
        </div>
        </aside>
      </Transition>
    </Teleport>
  </header>
</template>
