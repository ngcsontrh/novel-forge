const SUPPORTED_HOSTS = new Set(['uukanshu.cc', 'www.uukanshu.cc'])
const BOOK_PATH = /^\/book\/\d+\/?$/

export function isUukanshuBookUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && SUPPORTED_HOSTS.has(url.hostname)
      && BOOK_PATH.test(url.pathname)
  } catch {
    return false
  }
}

export function normalizeUukanshuBookUrl(value: string) {
  const url = new URL(value)
  url.hostname = 'uukanshu.cc'
  url.hash = ''
  url.search = ''
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url.href
}
