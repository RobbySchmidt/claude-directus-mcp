export function asset(fileId?: string | null): string | undefined {
  if (!fileId) return undefined
  return `/api/asset/${fileId}`
}
