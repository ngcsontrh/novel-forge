import type { SiteAdapter } from '~/sites'
import { readUukanshuBook } from '~/uukanshu/book'
import { readUukanshuChapter } from '~/uukanshu/chapter'
import { isUukanshuBookUrl, normalizeUukanshuBookUrl } from '~/uukanshu/url'

export const uukanshuSite: SiteAdapter = {
  id: 'uukanshu',
  defaultCrawlDelayMs: 2500,
  supportsBookUrl: isUukanshuBookUrl,
  normalizeBookUrl: normalizeUukanshuBookUrl,
  readBook: readUukanshuBook,
  readChapter: readUukanshuChapter,
}
