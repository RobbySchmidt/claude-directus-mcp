<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{ submit: [{ email: string; password: string }] }>()
defineProps<{ pending?: boolean; errorMessage?: string | null }>()

const { t } = useI18n()
const localePath = useLocalePath()

const email = ref('')
const password = ref('')
const confirm = ref('')

const localError = computed(() => {
  if (password.value && password.value.length < 8)
    return t('validation.min_length', { count: 8 })
  if (confirm.value && confirm.value !== password.value)
    return t('validation.passwords_dont_match')
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
      <Label for="reg-email">{{ $t('auth.email') }}</Label>
      <Input id="reg-email" v-model="email" type="email" required autocomplete="email" />
    </div>
    <div class="flex flex-col gap-2">
      <Label for="reg-password">{{ $t('auth.password') }}</Label>
      <Input id="reg-password" v-model="password" type="password" required minlength="8" autocomplete="new-password" />
    </div>
    <div class="flex flex-col gap-2">
      <Label for="reg-confirm">{{ $t('auth.password_repeat') }}</Label>
      <Input id="reg-confirm" v-model="confirm" type="password" required autocomplete="new-password" />
    </div>
    <p v-if="localError || errorMessage" class="text-sm text-destructive" role="alert">{{ localError || errorMessage }}</p>
    <Button type="submit" :disabled="pending || !canSubmit">{{ pending ? $t('form.loading') : $t('auth.create_account') }}</Button>
    <p class="text-center text-sm text-muted-foreground">
      {{ $t('auth.already_registered') }}
      <NuxtLink :to="localePath('/anmelden')" class="text-primary hover:underline">{{ $t('auth.login') }}</NuxtLink>
    </p>
  </form>
</template>
