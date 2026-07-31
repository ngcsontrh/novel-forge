import { readBookPage } from '~/sites/hako/book'
import { readChapter } from '~/sites/hako/chapter'
import { isHakoBookUrl, normalizeHakoBookUrl } from '~/sites/hako/url'
import type { SiteAdapter } from '~/sites/types'

export const hakoSite: SiteAdapter = {
  id: 'hako',
  defaultCrawlDelayMs: 2500,
  supportsBookUrl: isHakoBookUrl,
  normalizeBookUrl: normalizeHakoBookUrl,
  readBook: readBookPage,
  readChapter,
}
