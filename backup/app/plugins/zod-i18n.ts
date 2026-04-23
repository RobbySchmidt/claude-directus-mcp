import { z, ZodIssueCode, ZodParsedType, defaultErrorMap } from 'zod'

export default defineNuxtPlugin((nuxtApp) => {
  const { t } = nuxtApp.$i18n as { t: (key: string, fallback?: string) => string }

  z.setErrorMap((issue, ctx) => {
    // For required/undefined fields, use our locale key
    if (
      issue.code === ZodIssueCode.invalid_type &&
      issue.received === ZodParsedType.undefined
    ) {
      return { message: t('zod.errors.invalid_type_received_undefined', ctx.defaultError) }
    }

    // Fall back to the default Zod error map (English)
    return defaultErrorMap(issue, ctx)
  })
})
