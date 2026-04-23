<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{ submit: [{ email: string; password: string }] }>()
defineProps<{ pending?: boolean; errorMessage?: string | null }>()

const email = ref('')
const password = ref('')
const onSubmit = () => emit('submit', { email: email.value, password: password.value })
</script>

<template>
  <form class="flex flex-col gap-5" @submit.prevent="onSubmit">
    <div class="flex flex-col gap-2">
      <Label for="login-email">{{ $t('auth.email') }}</Label>
      <Input id="login-email" v-model="email" type="email" required autocomplete="email" />
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <Label for="login-password">{{ $t('auth.password') }}</Label>
        <NuxtLink to="/passwort-vergessen" class="text-xs text-muted-foreground hover:text-foreground">
          {{ $t('auth.forgot_password') }}
        </NuxtLink>
      </div>
      <Input id="login-password" v-model="password" type="password" required autocomplete="current-password" />
    </div>
    <p v-if="errorMessage" class="text-sm text-destructive" role="alert">{{ errorMessage }}</p>
    <Button type="submit" :disabled="pending">{{ pending ? $t('form.loading') : $t('auth.login_cta') }}</Button>
    <p class="text-center text-sm text-muted-foreground">
      {{ $t('auth.no_account_yet') }}
      <NuxtLink to="/registrieren" class="text-primary hover:underline">{{ $t('auth.register') }}</NuxtLink>
    </p>
  </form>
</template>
