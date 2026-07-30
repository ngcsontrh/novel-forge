const SUPPORTED_HOSTS = new Set(['ln.hako.vn', 'docln.sbs'])
const SUPPORTED_PATH = /^\/(?:truyen|ai-dich)\//

export function isHakoBookUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && SUPPORTED_HOSTS.has(url.hostname)
      && SUPPORTED_PATH.test(url.pathname)
  } catch {
    return false
  }
}

export function normalizeHakoBookUrl(value: string) {
  const url = new URL(value)
  url.hash = ''
  url.search = ''
  return url.href
}
