import { readShuba69Book } from '~/sites/shuba69/book'
import { readShuba69Chapter } from '~/sites/shuba69/chapter'
import { isShuba69BookUrl, normalizeShuba69BookUrl } from '~/sites/shuba69/url'
import type { SiteAdapter } from '~/sites/types'

export const shuba69Site: SiteAdapter = {
  id: '69shuba',
  defaultCrawlDelayMs: 2500,
  supportsBookUrl: isShuba69BookUrl,
  normalizeBookUrl: normalizeShuba69BookUrl,
  readBook: readShuba69Book,
  readChapter: readShuba69Chapter,
}
