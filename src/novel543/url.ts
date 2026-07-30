const NOVEL543_HOSTS = new Set(['novel543.com', 'www.novel543.com'])
const BOOK_PATH = /^\/\d+\/?$/

export function isNovel543BookUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && NOVEL543_HOSTS.has(url.hostname)
      && BOOK_PATH.test(url.pathname)
  } catch {
    return false
  }
}

export function normalizeNovel543BookUrl(value: string) {
  if (!isNovel543BookUrl(value)) {
    throw new Error('Hãy nhập URL truyện dạng https://www.novel543.com/0410698823/.')
  }

  const url = new URL(value)
  url.hostname = 'www.novel543.com'
  url.pathname = `/${url.pathname.split('/').filter(Boolean)[0]}/`
  url.search = ''
  url.hash = ''
  return url.href
}
