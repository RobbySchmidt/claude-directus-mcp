<script setup lang="ts">
import { useSeoMeta } from '#imports'

const localePath = useLocalePath()

definePageMeta({ layout: false })
defineI18nRoute({
  paths: {
    de: '/registrieren',
    en: '/register',
  },
})

const { public: pub } = useRuntimeConfig()
const { isLoggedIn } = useUser()
const { register } = useAuth()
const { t } = useI18n()
const router = useRouter()

useSeoMeta({ title: () => `${t('auth.register')} | ${pub.siteName}` })

if (isLoggedIn.value) await router.replace(localePath('/konto'))

const pending = ref(false)
const errorMessage = ref<string | null>(null)

const onSubmit = async (input: { email: string; password: string }) => {
  pending.value = true
  errorMessage.value = null
  const res = await register(input)
  pending.value = false
  if (!res.ok) {
    errorMessage.value = res.message
    return
  }
  await router.push(localePath('/konto'))
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main class="pt-17">
      <section class="mx-auto flex max-w-md flex-col gap-8 px-4 py-f-16 sm:px-6">
        <div class="text-center">
          <h1 class="font-heading text-f-4xl font-medium text-foreground">{{ $t('auth.register') }}</h1>
          <p class="mt-2 text-sm text-muted-foreground">{{ $t('auth.register_sub') }}</p>
        </div>
        <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <AuthRegisterForm :pending="pending" :error-message="errorMessage" @submit="onSubmit" />
        </div>
      </section>
    </main>
    <SectionsTheFooter />
  </div>
</template>
