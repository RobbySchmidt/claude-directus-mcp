<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{ submit: [{ email: string; password: string }] }>()
defineProps<{ pending?: boolean; errorMessage?: string | null }>()

const email = ref('')
const password = ref('')
const confirm = ref('')

const localError = computed(() => {
  if (password.value && password.value.length < 8) return 'Passwort muss mindestens 8 Zeichen lang sein'
  if (confirm.value && confirm.value !== password.value) return 'Passwörter stimmen nicht überein'
  return null
})

const canSubmit = computed(() =>
  email.value && password.value.length >= 8 && password.value === confirm.value,
)

const onSubmit = () => {
  if (!canSubmit.value) return
  emit('submit', { email: email.value, password: password.value })
}
</script>

<template>
  <form class="flex flex-col gap-5" @submit.prevent="onSubmit">
    <div class="flex flex-col gap-2">
      <Label for="reg-email">E-Mail</Label>
      <Input id="reg-email" v-model="email" type="email" required autocomplete="email" />
    </div>
    <div class="flex flex-col gap-2">
      <Label for="reg-password">Passwort (min. 8 Zeichen)</Label>
      <Input id="reg-password" v-model="password" type="password" required minlength="8" autocomplete="new-password" />
    </div>
    <div class="flex flex-col gap-2">
      <Label for="reg-confirm">Passwort bestätigen</Label>
      <Input id="reg-confirm" v-model="confirm" type="password" required autocomplete="new-password" />
    </div>
    <p v-if="localError || errorMessage" class="text-sm text-destructive" role="alert">{{ localError || errorMessage }}</p>
    <Button type="submit" :disabled="pending || !canSubmit">{{ pending ? 'Wird angelegt …' : 'Account anlegen' }}</Button>
    <p class="text-center text-sm text-muted-foreground">
      Schon registriert?
      <NuxtLink to="/anmelden" class="text-primary hover:underline">Hier anmelden</NuxtLink>
    </p>
  </form>
</template>
