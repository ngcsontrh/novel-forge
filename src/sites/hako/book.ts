import { isHakoBookUrl } from '~/sites/hako/url'
import type { ChapterLink, ScrapedBook } from '~/types'
import { absoluteUrl, firstElement, parseHtml, text } from '~/sites/document'
import { fetchHtml } from '~/sites/http'

const CHAPTER_LINK_SELECTOR = [
  '.chapter-name a',
  '.chapter-list a[href*="/c"]',
  '.list-chapters a[href*="/c"]',
  'a[href*="/truyen/"][href*="/c"]',
  'a[href*="/ai-dich/"][href*="/c"]',
].join(', ')

export async function readBookPage(sourceUrl: string): Promise<ScrapedBook> {
  if (!isHakoBookUrl(sourceUrl)) {
    throw new Error('Hãy nhập đúng URL truyện hoặc AI dịch trên ln.hako.vn hoặc docln.sbs.')
  }
  const url = new URL(sourceUrl)

  const document = parseHtml(await fetchHtml(url.href))
  const title = text(document, ['.series-name', '.series-title', 'h1'])
  if (!title) throw new Error('Không nhận diện được tên truyện từ trang này.')

  return {
    metadata: {
      sourceUrl: url.href,
      title,
      author: readAuthor(document),
      description: readDescription(document),
      tags: readTags(document),
      delayMs: 2500,
      coverUrl: readCoverUrl(document, url.href),
    },
    chapters: readChapterLinks(document, url.href),
  }
}

function readDescription(document: Document) {
  const element = firstElement(document, [
    '.series-summary .summary-content',
    '.summary-content',
    '[data-field="description"]',
  ])
  return element?.textContent?.trim().replace(/\s+/g, ' ') ?? ''
}

function readAuthor(document: Document) {
  const authorItem = [...document.querySelectorAll('.series-information .info-item, .info-item')]
    .find((item) => /tác giả|author/i.test(item.querySelector('.info-name')?.textContent ?? ''))
  return authorItem
    ? (authorItem.querySelector('.info-value')?.textContent?.trim().replace(/\s+/g, ' ') ?? '')
    : text(document, ['[data-field="author"]'])
}

function readTags(document: Document) {
  const nodes = document.querySelectorAll(
    '.series-gernes a, .series-genres a, .series-information .tag-item, a[href*="/the-loai/"]',
  )
  return [...nodes]
    .map((node) => node.textContent?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(', ')
}

function readCoverUrl(document: Document, sourceUrl: string) {
  const cover = document.querySelector<HTMLImageElement>('.series-cover img, .series-feature img, .series-img img')
  const socialCover = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')
  return absoluteUrl(cover?.getAttribute('src') ?? socialCover?.getAttribute('content'), sourceUrl)
}

function readChapterLinks(document: Document, sourceUrl: string) {
  const chapters = new Map<string, ChapterLink>()
  const addChapter = (anchor: HTMLAnchorElement, volumeTitle: string) => {
    const chapterUrl = absoluteUrl(anchor.getAttribute('href'), sourceUrl)
    const chapterTitle = anchor.textContent?.trim().replace(/\s+/g, ' ')
    if (chapterUrl && chapterTitle && /\/c\d+-/.test(new URL(chapterUrl).pathname)) {
      chapters.set(chapterUrl, { title: chapterTitle, url: chapterUrl, volumeTitle })
    }
  }

  document.querySelectorAll<HTMLElement>('section.volume-list').forEach((volume, index) => {
    const volumeTitle = volume.querySelector('.sect-title')?.textContent?.trim().replace(/\s+/g, ' ')
      || `Volume ${index + 1}`
    volume.querySelectorAll<HTMLAnchorElement>(CHAPTER_LINK_SELECTOR)
      .forEach((anchor) => addChapter(anchor, volumeTitle))
  })

  if (!chapters.size) {
    document.querySelectorAll<HTMLAnchorElement>(CHAPTER_LINK_SELECTOR)
      .forEach((anchor) => addChapter(anchor, 'Chưa phân volume'))
  }
  return [...chapters.values()]
}
