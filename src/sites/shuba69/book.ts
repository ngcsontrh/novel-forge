import { absoluteUrl, parseHtml, text } from '~/sites/document'
import { loadRenderedHtml, loadRenderedImage } from '~/services/resourceLoader'
import {
  isShuba69BookUrl,
  normalizeShuba69BookUrl,
  normalizeShuba69ChapterUrl,
  readShuba69BookId,
  SHUBA69_BOOK_URL_HINT,
  shuba69CatalogUrl,
} from '~/sites/shuba69/url'
import type { ChapterLink, ScrapedBook } from '~/types'

const BOOK_READY_SELECTOR = '.bookbox'
const CATALOG_READY_SELECTOR = '#catalog li a[href]'
const CATALOG_ITEM_SELECTOR = '#catalog ul li'
const CATALOG_LINK_SELECTOR = '#catalog a[href]'
const VOLUME_TITLE = '全部章節'
const TITLE_NOISE = /(?:无弹窗|無彈窗|最新章节|最新章節|全文阅读|全文閱讀|txt全集下载|txt全集下載).*$/

export interface CatalogEntry {
  order: number | undefined
  link: ChapterLink
}

export async function readShuba69Book(sourceUrl: string): Promise<ScrapedBook> {
  if (!isShuba69BookUrl(sourceUrl)) throw new Error(SHUBA69_BOOK_URL_HINT)

  const url = normalizeShuba69BookUrl(sourceUrl)
  const bookDocument = parseHtml(await loadRenderedHtml(url, BOOK_READY_SELECTOR))
  const title = readTitle(bookDocument)
  if (!title) throw new Error('Không nhận diện được tên truyện từ trang 69書吧 này.')

  const catalogUrl = shuba69CatalogUrl(url)
  const catalogDocument = parseHtml(await loadRenderedHtml(catalogUrl, CATALOG_READY_SELECTOR))
  const chapters = readChapterLinks(catalogDocument, catalogUrl)
  if (!chapters.length) throw new Error('Không đọc được mục lục chương từ trang 69書吧 này.')

  return {
    metadata: {
      sourceUrl: url,
      title,
      author: readAuthor(bookDocument),
      description: readDescription(bookDocument),
      tags: readTags(bookDocument),
      delayMs: 2500,
      coverUrl: await readCoverUrl(bookDocument, url),
    },
    chapters,
  }
}

export function readChapterLinks(document: Document, catalogUrl: string): ChapterLink[] {
  const bookId = readShuba69BookId(catalogUrl)
  if (!bookId) return []

  const items = [...document.querySelectorAll<HTMLElement>(CATALOG_ITEM_SELECTOR)]
  const entries = items.length
    ? items.flatMap((item) => toCatalogEntry(
      item.querySelector<HTMLAnchorElement>('a[href]'),
      catalogUrl,
      bookId,
      readItemOrder(item),
    ))
    : [...document.querySelectorAll<HTMLAnchorElement>(CATALOG_LINK_SELECTOR)]
      .flatMap((anchor) => toCatalogEntry(anchor, catalogUrl, bookId, undefined))

  return orderChapterEntries(entries)
}

export function orderChapterEntries(entries: readonly CatalogEntry[]): ChapterLink[] {
  const unique = new Map<string, CatalogEntry>()
  entries.forEach((entry) => {
    if (!unique.has(entry.link.url)) unique.set(entry.link.url, entry)
  })

  const values = [...unique.values()]
  const ordered = values.every((entry) => entry.order !== undefined)
    ? values.slice().sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    : values.slice().reverse()

  return ordered.map((entry) => entry.link)
}

export function parseTagList(value: string) {
  return value
    .split(/[|,，、/]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export type BookInfoField = 'articlename' | 'author' | 'sortName' | 'tags'

export function readBookInfoValue(script: string, field: BookInfoField) {
  return new RegExp(`\\b${field}\\s*:\\s*'([^']*)'`).exec(script)?.[1]?.trim() ?? ''
}

export function cleanBookTitle(value: string) {
  return value.replace(/\s+/g, ' ').replace(TITLE_NOISE, '').replace(/[\s,，-]+$/, '').trim()
}

function toCatalogEntry(
  anchor: HTMLAnchorElement | null,
  catalogUrl: string,
  bookId: string,
  order: number | undefined,
): CatalogEntry[] {
  if (!anchor) return []

  const href = absoluteUrl(anchor.getAttribute('href'), catalogUrl)
  const url = href ? normalizeShuba69ChapterUrl(href, bookId) : undefined
  const title = anchor.textContent?.replace(/\s+/g, ' ').trim()
  if (!url || !title) return []

  return [{ order, link: { title, url, volumeTitle: VOLUME_TITLE } }]
}

function readItemOrder(item: HTMLElement) {
  const raw = item.getAttribute('data-num')?.trim()
  if (!raw || !/^\d+$/.test(raw)) return undefined
  return Number(raw)
}

function readTitle(document: Document) {
  const candidates = [
    metaContent(document, 'og:novel:book_name'),
    readBookInfoValue(readBookInfoScript(document), 'articlename'),
    text(document, ['.booknav2 h1', '.muluh1', 'h1']),
    metaContent(document, 'og:title'),
  ]
  return candidates.map(cleanBookTitle).find(Boolean) ?? ''
}

function readAuthor(document: Document) {
  return metaContent(document, 'og:novel:author')
    || readBookInfoValue(readBookInfoScript(document), 'author')
    || text(document, ['.booknav2 a[href*="author"]'])
}

function readDescription(document: Document) {
  const paragraph = [...document.querySelectorAll('.navtxt p')]
    .find((node) => !/小说关键词|小說關鍵詞/.test(node.textContent ?? ''))
  if (paragraph) {
    const lines = toPlainLines(paragraph)
    if (lines) return lines
  }
  return metaContent(document, 'og:description').replace(/\s+/g, ' ').trim()
}

function readTags(document: Document) {
  const script = readBookInfoScript(document)
  const rendered = [...document.querySelectorAll('#tagul a, #tagul li')]
    .map((node) => node.textContent?.trim() ?? '')

  return [
    ...parseTagList(metaContent(document, 'og:novel:category')),
    ...parseTagList(readBookInfoValue(script, 'sortName')),
    ...parseTagList(readBookInfoValue(script, 'tags')),
    ...rendered.flatMap(parseTagList),
  ]
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
    .join(', ')
}

async function readCoverUrl(document: Document, bookUrl: string) {
  const remoteCoverUrl = absoluteUrl(
    document.querySelector<HTMLImageElement>('.bookimg2 img')?.getAttribute('src')
      ?? metaContent(document, 'og:image'),
    bookUrl,
  )
  if (!remoteCoverUrl) return undefined
  return loadRenderedImage(remoteCoverUrl).catch(() => remoteCoverUrl)
}

function readBookInfoScript(document: Document) {
  return [...document.querySelectorAll('script')]
    .map((node) => node.textContent ?? '')
    .find((content) => content.includes('bookinfo')) ?? ''
}

function metaContent(document: Document, property: string) {
  const node = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
    ?? document.querySelector<HTMLMetaElement>(`meta[name="${property}"]`)
  return node?.getAttribute('content')?.trim() ?? ''
}

function toPlainLines(element: Element) {
  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll('br').forEach((node) => {
    node.replaceWith(clone.ownerDocument.createTextNode('\n'))
  })
  return (clone.textContent ?? '')
    .split('\n')
    .map((line) => line.replace(/[\s\u3000]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}
