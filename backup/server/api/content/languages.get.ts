import { readItems } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'

export default defineEventHandler(async () => {
  const directus = useDirectusServer()
  const rows = await directus.request(readItems('languages', { limit: -1 }))
  return rows
})
