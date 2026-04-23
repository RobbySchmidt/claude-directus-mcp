<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{ submit: [{ password: string }] }>()
defineProps<{ pending?: boolean; success?: boolean; errorMessage?: string | null }>()

const localePath = useLocalePath()

const password = ref('')
const confirm = ref('')

// TODO(Task 26): migrate to zod-i18n-map
const localError = computed(() => {
  if (password.value && password.value.length < 8) return 'Passwort muss mindestens 8 Zeichen lang sein'
  if (confirm.value && confirm.value !== password.value) return 'Passwörter stimmen nicht überein'
  return null
})

const canSubmit = computed(() => password.value.length >= 8 && password.value === confirm.value)
const onSubmit = () => {
  if (!canSubmit.value) return
  emit('submit', { password: password.value })
}
</script>

<template>
  <form class="flex flex-col gap-5" @submit.prevent="onSubmit">
    <div v-if="success" class="rounded-lg bg-primary/10 p-4 text-sm text-foreground" role="status">
      {{ $t('auth.reset_password') }}
      <NuxtLink :to="localePath('/anmelden')" class="font-medium text-primary hover:underline">{{ $t('auth.login') }}</NuxtLink>
    </div>
    <template v-else>
      <div class="flex flex-col gap-2">
        <Label for="pwreset-password">{{ $t('auth.new_password') }}</Label>
        <Input id="pwreset-password" v-model="password" type="password" required minlength="8" autocomplete="new-password" />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="pwreset-confirm">{{ $t('auth.password_repeat') }}</Label>
        <Input id="pwreset-confirm" v-model="confirm" type="password" required autocomplete="new-password" />
      </div>
      <p v-if="localError || errorMessage" class="text-sm text-destructive" role="alert">{{ localError || errorMessage }}</p>
      <Button type="submit" :disabled="pending || !canSubmit">{{ pending ? $t('form.loading') : $t('auth.reset_password') }}</Button>
    </template>
  </form>
</template>
