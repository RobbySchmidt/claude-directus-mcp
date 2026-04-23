<script setup lang="ts">
import type { AuthUser } from '~~/shared/types/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  user: AuthUser
  pending?: boolean
  message?: string | null
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  submit: [{ email: string; first_name: string | null; last_name: string | null }]
  avatarSelected: [File]
}>()

const email = ref(props.user.email)
const firstName = ref(props.user.first_name ?? '')
const lastName = ref(props.user.last_name ?? '')

watchEffect(() => {
  email.value = props.user.email
  firstName.value = props.user.first_name ?? ''
  lastName.value = props.user.last_name ?? ''
})

const fileInput = ref<HTMLInputElement | null>(null)
const onPickAvatar = () => fileInput.value?.click()
const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) emit('avatarSelected', file)
  target.value = ''
}

const onSubmit = () =>
  emit('submit', {
    email: email.value,
    first_name: firstName.value || null,
    last_name: lastName.value || null,
  })
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent="onSubmit">
    <div class="flex items-center gap-4">
      <AuthUserAvatar :user="user" size="lg" />
      <div class="flex flex-col gap-2">
        <Button type="button" variant="ghost" size="sm" @click="onPickAvatar">{{ $t('auth.avatar_upload') }}</Button>
        <span class="text-xs text-muted-foreground">PNG/JPG, max. 2 MB</span>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
      </div>
    </div>
    <div class="grid gap-5 sm:grid-cols-2">
      <div class="flex flex-col gap-2">
        <Label for="prof-first">{{ $t('auth.first_name') }}</Label>
        <Input id="prof-first" v-model="firstName" autocomplete="given-name" />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="prof-last">{{ $t('auth.last_name') }}</Label>
        <Input id="prof-last" v-model="lastName" autocomplete="family-name" />
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <Label for="prof-email">{{ $t('auth.email') }}</Label>
      <Input id="prof-email" v-model="email" type="email" required autocomplete="email" />
    </div>
    <p v-if="message" class="text-sm text-primary" role="status">{{ message }}</p>
    <p v-if="errorMessage" class="text-sm text-destructive" role="alert">{{ errorMessage }}</p>
    <Button type="submit" :disabled="pending" class="self-start">{{ pending ? $t('form.loading') : $t('auth.save_profile') }}</Button>
  </form>
</template>
