<script setup lang="ts">
import { useSeoMeta } from '#imports'

definePageMeta({ layout: false, middleware: 'auth' })

const { public: pub } = useRuntimeConfig()
const { user } = useUser()
const { updateProfile, uploadAvatar } = useAuth()
const { t } = useI18n()

useSeoMeta({ title: () => `${t('auth.account')} | ${pub.siteName}` })

const pending = ref(false)
const message = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

const onSubmit = async (input: { email: string; first_name: string | null; last_name: string | null }) => {
  pending.value = true
  message.value = null
  errorMessage.value = null
  const res = await updateProfile(input)
  pending.value = false
  if (!res.ok) {
    errorMessage.value = res.message
    return
  }
  message.value = t('form.success')
}

const onAvatar = async (file: File) => {
  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = 'Datei zu groß (max 2 MB)'
    return
  }
  pending.value = true
  message.value = null
  errorMessage.value = null
  const res = await uploadAvatar(file)
  pending.value = false
  if (!res.ok) {
    errorMessage.value = res.message
    return
  }
  message.value = t('form.success')
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main class="pt-17">
      <section class="mx-auto max-w-3xl px-4 py-f-16 sm:px-6 lg:px-8">
        <nav class="mb-6 flex gap-4 text-sm">
          <NuxtLink to="/konto" class="font-medium text-foreground">{{ $t('auth.profile') }}</NuxtLink>
          <NuxtLink to="/konto/passwort" class="text-muted-foreground hover:text-foreground">{{ $t('auth.password') }}</NuxtLink>
          <NuxtLink to="/konto/buchungen" class="text-muted-foreground hover:text-foreground">{{ $t('booking.my_bookings') }}</NuxtLink>
        </nav>
        <h1 class="font-heading text-f-5xl font-medium text-foreground">{{ $t('auth.account') }}</h1>
        <p class="mt-2 text-muted-foreground">{{ $t('auth.profile_lead') }}</p>

        <div class="mt-f-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 class="font-heading text-f-2xl font-medium text-foreground">{{ $t('auth.profile') }}</h2>
          <div class="mt-6">
            <AuthProfileForm
              v-if="user"
              :user="user"
              :pending="pending"
              :message="message"
              :error-message="errorMessage"
              @submit="onSubmit"
              @avatar-selected="onAvatar"
            />
          </div>
        </div>

        <div class="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 class="font-heading text-f-2xl font-medium text-foreground">{{ $t('auth.security') }}</h2>
          <NuxtLink
            to="/konto/passwort"
            class="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {{ $t('auth.change_password') }}
          </NuxtLink>
        </div>
      </section>
    </main>
    <SectionsTheFooter />
  </div>
</template>
