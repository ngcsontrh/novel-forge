import type { SiteAdapter } from '~/sites/types'
import { readUukanshuBook } from '~/sites/uukanshu/book'
import { readUukanshuChapter } from '~/sites/uukanshu/chapter'
import { isUukanshuBookUrl, normalizeUukanshuBookUrl } from '~/sites/uukanshu/url'

export const uukanshuSite: SiteAdapter = {
  id: 'uukanshu',
  defaultCrawlDelayMs: 2500,
  supportsBookUrl: isUukanshuBookUrl,
  normalizeBookUrl: normalizeUukanshuBookUrl,
  readBook: readUukanshuBook,
  readChapter: readUukanshuChapter,
}
