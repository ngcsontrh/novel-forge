import { readBookPage } from '~/hako/book'
import { readChapter } from '~/hako/chapter'
import { isHakoBookUrl, normalizeHakoBookUrl } from '~/hako/url'
import type { SiteAdapter } from '~/sites'

export const hakoSite: SiteAdapter = {
  id: 'hako',
  defaultCrawlDelayMs: 2500,
  supportsBookUrl: isHakoBookUrl,
  normalizeBookUrl: normalizeHakoBookUrl,
  readBook: readBookPage,
  readChapter,
}
