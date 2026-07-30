import type { Chapter, ChapterLink, ScrapedBook } from '~/types'

export interface SiteAdapter {
  readonly id: string
  readonly defaultCrawlDelayMs: number
  supportsBookUrl(value: string): boolean
  normalizeBookUrl(value: string): string
  readBook(sourceUrl: string): Promise<ScrapedBook>
  readChapter(chapter: ChapterLink): Promise<Chapter>
}
