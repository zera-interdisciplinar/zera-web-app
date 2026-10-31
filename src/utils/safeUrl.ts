/**
 * An address that comes from the API and ends up in an `<img src>`: only http(s) is accepted, so a `javascript:` or
 * `data:` value can never be used (XSS). Anything else becomes "no photo".
 */
export function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value, 'https://placeholder.invalid')
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : null
  } catch {
    return null
  }
}
