<script setup lang="ts">
import { useSeoMeta } from '#imports'

const localePath = useLocalePath()

definePageMeta({})
defineI18nRoute({
  paths: {
    de: '/anmelden',
    en: '/login',
  },
})

const { public: pub } = useRuntimeConfig()
const { isLoggedIn } = useUser()
const { login } = useAuth()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

useSeoMeta({ title: () => `${t('auth.login')} | ${pub.siteName}` })

const redirectTo = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') ? r : localePath('/konto')
})

if (isLoggedIn.value) await router.replace(redirectTo.value)

const pending = ref(false)
const errorMessage = ref<string | null>(null)

const onSubmit = async (input: { email: string; password: string }) => {
  pending.value = true
  errorMessage.value = null
  const res = await login(input)
  pending.value = false
  if (!res.ok) {
    errorMessage.value = res.message
    return
  }
  await router.push(redirectTo.value)
}
</script>

<template>
  <section class="mx-auto flex max-w-md flex-col gap-8 px-4 py-f-16 sm:px-6">
    <div class="text-center">
      <h1 class="font-heading text-f-4xl font-medium text-foreground">{{ $t('auth.login') }}</h1>
      <p class="mt-2 text-sm text-muted-foreground">{{ $t('auth.login_sub') }}</p>
    </div>
    <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <AuthLoginForm :pending="pending" :error-message="errorMessage" @submit="onSubmit" />
    </div>
  </section>
</template>
