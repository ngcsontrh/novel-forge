import { firstElement, parseHtml, text } from '~/sites/document'
import { loadRenderedHtml } from '~/services/resourceLoader'
import type { Chapter, ChapterLink } from '~/types'

const MAX_CHAPTER_PAGES = 20
const ALLOWED_CONTENT_TAGS = new Set([
  'P', 'BR', 'H2', 'H3', 'H4', 'STRONG', 'B', 'EM', 'I',
  'BLOCKQUOTE', 'HR', 'UL', 'OL', 'LI',
])

export async function readNovel543Chapter(link: ChapterLink): Promise<Chapter> {
  const pages: string[] = []
  const visited = new Set<string>()
  let pageUrl: string | undefined = link.url
  let title = link.title

  while (pageUrl && pages.length < MAX_CHAPTER_PAGES) {
    if (visited.has(pageUrl)) throw new Error(`Novel543 trả về vòng lặp trang ở chương: ${link.title}`)
    visited.add(pageUrl)

    const document = parseHtml(await loadRenderedHtml(pageUrl, 'div.chapter-content'))
    title = text(document, ['h1.title']) || title
    const content = firstElement(document, [
      'div.chapter-content > div.content',
      'div.chapter-content',
    ])
    if (!content) throw new Error(`Không tìm thấy nội dung: ${link.title}`)
    pages.push(cleanContent(content, link.title))
    pageUrl = findContinuationUrl(document, link.url)
  }

  if (pageUrl) throw new Error(`Chương có quá ${MAX_CHAPTER_PAGES} trang: ${link.title}`)
  return { ...link, title, content: pages.join('\n<hr/>\n') }
}

export function findContinuationUrl(document: Document, chapterUrl: string) {
  const match = new URL(chapterUrl).pathname.match(/\/(\d+_\d+)(?:_\d+)?\.html$/)
  if (!match) return undefined

  const nextLink = [...document.querySelectorAll<HTMLAnchorElement>('.foot-nav a[href]')].at(-1)
  const nextUrl = nextLink?.getAttribute('href')
  if (!nextUrl) return undefined

  const parsed = new URL(nextUrl, chapterUrl)
  return parsed.pathname.includes(`/${match[1]}_`) ? parsed.href : undefined
}

function cleanContent(element: Element, chapterTitle: string) {
  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll(
    'script, style, iframe, form, button, ins, .ads, .adsbygoogle, .adBlock, .gadBlock, :scope > div:last-child, [style*="display:none"], [style*="display: none"]',
  ).forEach((node) => node.remove())
  clone.querySelectorAll('img, picture, source, svg, canvas').forEach((node) => node.remove())
  removeRepeatedTitle(clone, chapterTitle)

  clone.querySelectorAll('*').forEach((node) => {
    if (!ALLOWED_CONTENT_TAGS.has(node.tagName)) {
      node.replaceWith(...node.childNodes)
      return
    }
    ;[...node.attributes].forEach((attribute) => node.removeAttribute(attribute.name))
  })

  return clone.innerHTML.trim().replace(/<(br|hr)([^>]*?)(?:\s*\/)?>/gi, '<$1$2/>')
}

function removeRepeatedTitle(content: HTMLElement, chapterTitle: string) {
  const firstParagraph = content.querySelector('p')
  if (!firstParagraph) return

  const walker = content.ownerDocument.createTreeWalker(firstParagraph, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    const value = node.nodeValue ?? ''
    const leadingWhitespace = value.match(/^\s*/)?.[0] ?? ''
    const visibleValue = value.slice(leadingWhitespace.length)
    if (visibleValue.startsWith(chapterTitle)) {
      node.nodeValue = leadingWhitespace + visibleValue.slice(chapterTitle.length).trimStart()
    }
    if (visibleValue.trim()) return
    node = walker.nextNode()
  }
}
