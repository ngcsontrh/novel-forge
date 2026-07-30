import { absoluteUrl, parseHtml, text } from '~/hako/document'
import { isNovel543BookUrl, normalizeNovel543BookUrl } from '~/novel543/url'
import { loadRenderedHtml, loadRenderedImage } from '~/services/resourceLoader'
import type { ChapterLink, ScrapedBook } from '~/types'

export async function readNovel543Book(sourceUrl: string): Promise<ScrapedBook> {
  if (!isNovel543BookUrl(sourceUrl)) {
    throw new Error('Hãy nhập URL truyện dạng https://www.novel543.com/0410698823/.')
  }

  const url = normalizeNovel543BookUrl(sourceUrl)
  const bookDocument = parseHtml(await loadRenderedHtml(url, 'h1.title'))
  const title = text(bookDocument, ['h1.title'])
  if (!title) throw new Error('Không nhận diện được tên truyện từ Novel543.')

  const directoryDocument = parseHtml(
    await loadRenderedHtml(new URL('dir', url).href, 'div.chaplist'),
  )
  const remoteCoverUrl = absoluteUrl(
    bookDocument.querySelector<HTMLImageElement>('div.cover img')?.getAttribute('src')
      ?? bookDocument.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content,
    url,
  )
  const coverUrl = remoteCoverUrl
    ? await loadRenderedImage(remoteCoverUrl).catch(() => remoteCoverUrl)
    : undefined

  return {
    metadata: {
      sourceUrl: url,
      title,
      author: text(bookDocument, ['span.author']),
      description: text(bookDocument, ['div.intro']),
      tags: text(bookDocument, ["p.meta a[href*='bookstack']"]),
      delayMs: 2500,
      coverUrl,
    },
    chapters: readChapterLinks(directoryDocument, url),
  }
}

export function readChapterLinks(document: Document, sourceUrl: string) {
  const bookPath = new URL(sourceUrl).pathname
  const chapters = new Map<string, ChapterLink>()
  const menu = document.querySelector('div.chaplist ul:nth-of-type(2)')
    ?? document.querySelector('div.chaplist')

  menu?.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const chapterUrl = absoluteUrl(anchor.getAttribute('href'), sourceUrl)
    const title = anchor.textContent?.trim().replace(/\s+/g, ' ')
    if (!chapterUrl || !title) return

    const parsedUrl = new URL(chapterUrl)
    if (!['novel543.com', 'www.novel543.com'].includes(parsedUrl.hostname)) return
    if (!parsedUrl.pathname.startsWith(bookPath) || !/\/\d+_\d+\.html$/.test(parsedUrl.pathname)) return

    parsedUrl.hostname = 'www.novel543.com'
    chapters.set(parsedUrl.href, {
      title,
      url: parsedUrl.href,
      volumeTitle: '全部章節',
    })
  })

  return [...chapters.values()]
}
