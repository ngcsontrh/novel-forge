import type { SiteAdapter } from '~/sites'
import type { Chapter, ChapterLink } from '~/types'

type ProgressCallback = (completed: number, total: number, chapter: ChapterLink) => void

export async function crawlChapters(
  site: SiteAdapter,
  chapters: ChapterLink[],
  delayMs: number,
  onProgress: ProgressCallback,
): Promise<Chapter[]> {
  const crawled: Chapter[] = []
  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index]
    onProgress(index, chapters.length, chapter)
    crawled.push(await site.readChapter(chapter))

    if (index < chapters.length - 1 && delayMs > 0) {
      await wait(delayMs)
    }
  }
  return crawled
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))
}
