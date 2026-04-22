<script setup lang="ts">
import { useSeoMeta } from '#imports'

definePageMeta({ layout: false })

const { public: pub } = useRuntimeConfig()
const { resetPassword } = useAuth()
const route = useRoute()

useSeoMeta({ title: () => `Passwort zurücksetzen | ${pub.siteName}` })

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const tokenMissing = computed(() => !token.value)

const pending = ref(false)
const success = ref(false)
const errorMessage = ref<string | null>(null)

const onSubmit = async (input: { password: string }) => {
  if (!token.value) return
  pending.value = true
  errorMessage.value = null
  const res = await resetPassword({ token: token.value, password: input.password })
  pending.value = false
  if (!res.ok) {
    errorMessage.value = res.message
    return
  }
  success.value = true
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main class="pt-[68px]">
      <section class="mx-auto flex max-w-md flex-col gap-8 px-4 py-f-16 sm:px-6">
        <div class="text-center">
          <h1 class="font-heading text-f-4xl font-medium text-foreground">Neues Passwort setzen</h1>
        </div>
        <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div v-if="tokenMissing" class="text-sm text-destructive" role="alert">
            Ungültiger Reset-Link. <NuxtLink to="/passwort-vergessen" class="text-primary hover:underline">Erneut anfordern</NuxtLink>
          </div>
          <AuthPasswordResetForm v-else :pending="pending" :success="success" :error-message="errorMessage" @submit="onSubmit" />
        </div>
      </section>
    </main>
    <SectionsTheFooter />
  </div>
</template>
