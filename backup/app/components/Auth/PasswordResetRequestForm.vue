<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{ submit: [{ email: string }] }>()
defineProps<{ pending?: boolean; sent?: boolean; errorMessage?: string | null }>()

const email = ref('')
const onSubmit = () => emit('submit', { email: email.value })
</script>

<template>
  <form class="flex flex-col gap-5" @submit.prevent="onSubmit">
    <div v-if="sent" class="rounded-lg bg-primary/10 p-4 text-sm text-foreground" role="status">
      Falls ein Account mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen geschickt.
    </div>
    <template v-else>
      <p class="text-sm text-muted-foreground">
        Gib die E-Mail-Adresse deines Accounts ein. Wir schicken dir einen Link zum Zurücksetzen.
      </p>
      <div class="flex flex-col gap-2">
        <Label for="pwreq-email">E-Mail</Label>
        <Input id="pwreq-email" v-model="email" type="email" required autocomplete="email" />
      </div>
      <p v-if="errorMessage" class="text-sm text-destructive" role="alert">{{ errorMessage }}</p>
      <Button type="submit" :disabled="pending">{{ pending ? 'Wird gesendet …' : 'Reset-Link senden' }}</Button>
    </template>
    <p class="text-center text-sm text-muted-foreground">
      <NuxtLink to="/anmelden" class="text-primary hover:underline">Zurück zur Anmeldung</NuxtLink>
    </p>
  </form>
</template>
