import { readNovel543Book } from '~/novel543/book'
import { readNovel543Chapter } from '~/novel543/chapter'
import { isNovel543BookUrl, normalizeNovel543BookUrl } from '~/novel543/url'
import type { SiteAdapter } from '~/sites'

export const novel543Site: SiteAdapter = {
  id: 'novel543',
  defaultCrawlDelayMs: 2500,
  supportsBookUrl: isNovel543BookUrl,
  normalizeBookUrl: normalizeNovel543BookUrl,
  readBook: readNovel543Book,
  readChapter: readNovel543Chapter,
}
