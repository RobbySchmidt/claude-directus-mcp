<script setup lang="ts">
import { useSeoMeta } from '#imports'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: false, middleware: 'auth' })

const { public: pub } = useRuntimeConfig()
const { updateProfile } = useAuth()

useSeoMeta({ title: () => `Passwort ändern | ${pub.siteName}` })

const current = ref('')
const next = ref('')
const confirm = ref('')

const pending = ref(false)
const message = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

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
  message.value = 'Passwort geändert.'
  current.value = ''
  next.value = ''
  confirm.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main class="pt-[68px]">
      <section class="mx-auto max-w-md px-4 py-f-16 sm:px-6">
        <h1 class="font-heading text-f-4xl font-medium text-foreground">Passwort ändern</h1>
        <form class="mt-8 flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm" @submit.prevent="onSubmit">
          <div class="flex flex-col gap-2">
            <Label for="pw-current">Aktuelles Passwort</Label>
            <Input id="pw-current" v-model="current" type="password" required autocomplete="current-password" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="pw-new">Neues Passwort (min. 8 Zeichen)</Label>
            <Input id="pw-new" v-model="next" type="password" required minlength="8" autocomplete="new-password" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="pw-confirm">Bestätigen</Label>
            <Input id="pw-confirm" v-model="confirm" type="password" required autocomplete="new-password" />
          </div>
          <p v-if="message" class="text-sm text-primary" role="status">{{ message }}</p>
          <p v-if="localError || errorMessage" class="text-sm text-destructive" role="alert">{{ localError || errorMessage }}</p>
          <Button type="submit" :disabled="pending || !canSubmit">{{ pending ? 'Wird gespeichert …' : 'Passwort ändern' }}</Button>
          <NuxtLink to="/konto" class="text-center text-sm text-muted-foreground hover:text-foreground">
            Zurück zum Profil
          </NuxtLink>
        </form>
      </section>
    </main>
    <SectionsTheFooter />
  </div>
</template>
