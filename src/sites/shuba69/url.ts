const CANONICAL_HOST = 'www.69shuba.com'
const SUPPORTED_HOSTS = new Set(['69shuba.com', 'www.69shuba.com'])
const BOOK_PATH = /^\/book\/(\d+)(?:\.htm|\/)$/
const CHAPTER_PATH = /^\/txt\/(\d+)\/(\d+)$/

export const SHUBA69_BOOK_URL_HINT = 'Hãy nhập URL sách dạng https://www.69shuba.com/book/90442.htm.'

export function readShuba69BookId(value: string) {
  const url = parseSupportedUrl(value)
  return url ? BOOK_PATH.exec(url.pathname)?.[1] : undefined
}

export function isShuba69BookUrl(value: string) {
  return readShuba69BookId(value) !== undefined
}

export function normalizeShuba69BookUrl(value: string) {
  return `https://${CANONICAL_HOST}/book/${requireBookId(value)}.htm`
}

export function shuba69CatalogUrl(value: string) {
  return `https://${CANONICAL_HOST}/book/${requireBookId(value)}/`
}

export function normalizeShuba69ChapterUrl(value: string, bookId: string) {
  const url = parseSupportedUrl(value)
  const match = url ? CHAPTER_PATH.exec(url.pathname) : undefined
  if (!match || match[1] !== bookId) return undefined
  return `https://${CANONICAL_HOST}/txt/${match[1]}/${match[2]}`
}

function requireBookId(value: string) {
  const bookId = readShuba69BookId(value)
  if (!bookId) throw new Error(SHUBA69_BOOK_URL_HINT)
  return bookId
}

function parseSupportedUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !SUPPORTED_HOSTS.has(url.hostname)) return undefined
    return url
  } catch {
    return undefined
  }
}
