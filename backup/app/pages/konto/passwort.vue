<script setup lang="ts">
import { useSeoMeta } from '#imports'
import { Input } from '@/components/ui/input'

const localePath = useLocalePath()
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

definePageMeta({ middleware: 'auth' })
defineI18nRoute({
  paths: {
    de: '/konto/passwort',
    en: '/account/password',
  },
})

const { public: pub } = useRuntimeConfig()
const { updateProfile } = useAuth()
const { t } = useI18n()

useSeoMeta({ title: () => `${t('auth.change_password')} | ${pub.siteName}` })

const current = ref('')
const next = ref('')
const confirm = ref('')

const pending = ref(false)
const message = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// TODO(Task 26): migrate to zod-i18n-map
const localError = computed(() => {
  if (next.value && next.value.length < 8) return 'Neues Passwort muss mindestens 8 Zeichen lang sein'
  if (confirm.value && confirm.value !== next.value) return 'Passwörter stimmen nicht überein'
  return null
})
const canSubmit = computed(() => current.value && next.value.length >= 8 && next.value === confirm.value)

const onSubmit = async () => {
  if (!canSubmit.value) return
  pending.value = true
  message.value = null
  errorMessage.value = null
  const res = await updateProfile({ current_password: current.value, new_password: next.value })
  pending.value = false
  if (!res.ok) {
    errorMessage.value = res.message
    return
  }
  message.value = t('form.success')
  current.value = ''
  next.value = ''
  confirm.value = ''
}
</script>

<template>
  <section class="mx-auto max-w-md px-4 py-f-16 sm:px-6">
    <nav class="mb-6 flex gap-4 text-sm">
      <NuxtLink :to="localePath('/konto')" class="text-muted-foreground hover:text-foreground">{{ $t('auth.profile') }}</NuxtLink>
      <NuxtLink :to="localePath('/konto/passwort')" class="font-medium text-foreground">{{ $t('auth.password') }}</NuxtLink>
      <NuxtLink :to="localePath('/konto/buchungen')" class="text-muted-foreground hover:text-foreground">{{ $t('booking.my_bookings') }}</NuxtLink>
    </nav>
    <h1 class="font-heading text-f-4xl font-medium text-foreground">{{ $t('auth.change_password') }}</h1>
    <form class="mt-8 flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm" @submit.prevent="onSubmit">
      <div class="flex flex-col gap-2">
        <Label for="pw-current">{{ $t('auth.current_password') }}</Label>
        <Input id="pw-current" v-model="current" type="password" required autocomplete="current-password" />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="pw-new">{{ $t('auth.new_password') }}</Label>
        <Input id="pw-new" v-model="next" type="password" required minlength="8" autocomplete="new-password" />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="pw-confirm">{{ $t('auth.password_repeat') }}</Label>
        <Input id="pw-confirm" v-model="confirm" type="password" required autocomplete="new-password" />
      </div>
      <p v-if="message" class="text-sm text-primary" role="status">{{ message }}</p>
      <p v-if="localError || errorMessage" class="text-sm text-destructive" role="alert">{{ localError || errorMessage }}</p>
      <Button type="submit" :disabled="pending || !canSubmit">{{ pending ? $t('form.loading') : $t('auth.change_password') }}</Button>
      <NuxtLink :to="localePath('/konto')" class="text-center text-sm text-muted-foreground hover:text-foreground">
        {{ $t('common.back') }}
      </NuxtLink>
    </form>
  </section>
</template>
