import { absoluteUrl, parseHtml, text } from '~/hako/document'
import { fetchRenderedHtml, fetchRenderedImageDataUrl } from '~/services/renderedPage'
import type { ChapterLink, ScrapedBook } from '~/types'
import { isUukanshuBookUrl, normalizeUukanshuBookUrl } from '~/uukanshu/url'

export async function readUukanshuBook(sourceUrl: string): Promise<ScrapedBook> {
  if (!isUukanshuBookUrl(sourceUrl)) {
    throw new Error('Hãy nhập URL sách dạng https://uukanshu.cc/book/17318/.')
  }

  const url = normalizeUukanshuBookUrl(sourceUrl)
  const document = parseHtml(await fetchRenderedHtml(url, '#list-chapterAll'))
  const title = text(document, ['.bookinfo h1', 'h1'])
  if (!title) throw new Error('Không nhận diện được tên truyện từ trang UU看書 này.')
  const remoteCoverUrl = absoluteUrl(
    document.querySelector<HTMLImageElement>('.bookcover img')?.getAttribute('src')
      ?? document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content,
    url,
  )
  const coverUrl = remoteCoverUrl
    ? await fetchRenderedImageDataUrl(remoteCoverUrl).catch(() => remoteCoverUrl)
    : undefined

  return {
    metadata: {
      sourceUrl: url,
      title,
      author: text(document, ['.booktag a.red', '.bookinfo [rel="author"]']),
      description: text(document, ['.bookintro']),
      tags: readTags(document),
      delayMs: 2500,
      coverUrl,
    },
    chapters: readChapterLinks(document, url),
  }
}

function readTags(document: Document) {
  return [...document.querySelectorAll<HTMLAnchorElement>('.booktag a:not(.red), .path a[href*="/class_"]')]
    .map((node) => node.textContent?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(', ')
}

function readChapterLinks(document: Document, sourceUrl: string) {
  const bookPath = new URL(sourceUrl).pathname
  const chapters = new Map<string, ChapterLink>()

  document.querySelectorAll<HTMLAnchorElement>('#list-chapterAll dd a, #list-chapterAll a')
    .forEach((anchor) => {
      const url = absoluteUrl(anchor.getAttribute('href'), sourceUrl)
      const title = anchor.textContent?.trim().replace(/\s+/g, ' ')
      if (!url || !title) return

      const parsedUrl = new URL(url)
      if (
        parsedUrl.hostname !== 'uukanshu.cc'
        && parsedUrl.hostname !== 'www.uukanshu.cc'
      ) return
      if (!parsedUrl.pathname.startsWith(bookPath) || !/\/\d+\.html$/.test(parsedUrl.pathname)) return

      parsedUrl.hostname = 'uukanshu.cc'
      chapters.set(parsedUrl.href, {
        title,
        url: parsedUrl.href,
        volumeTitle: '全部章節',
      })
    })

  return [...chapters.values()]
}
