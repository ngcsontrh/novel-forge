import type { Chapter, ChapterLink } from '~/types'
import { firstElement, parseHtml, text } from '~/hako/document'
import { fetchHtml } from '~/hako/http'
import { revealProtectedContent } from '~/hako/protected-content'

const ALLOWED_CONTENT_TAGS = new Set([
  'P', 'BR', 'H2', 'H3', 'H4', 'STRONG', 'B', 'EM', 'I',
  'BLOCKQUOTE', 'HR', 'UL', 'OL', 'LI',
])

export async function readChapter(link: ChapterLink): Promise<Chapter> {
  const document = parseHtml(await fetchHtml(link.url))
  const title = text(document, [
    'h4.title-item',
    '.chapter-title',
    '.chapter-detail-title',
    'main h1',
    'main h2',
  ]) || link.title
  const content = firstElement(document, [
    '#chapter-content',
    '.chapter-content',
    '.chapter-detail-content',
  ])
  if (!content) throw new Error(`Không tìm thấy nội dung: ${link.title}`)

  revealProtectedContent(document, content)
  return { ...link, title, content: cleanChapterContent(content) }
}

function cleanChapterContent(element: Element) {
  const clone = element.cloneNode(true) as HTMLElement
  normalizeNotes(clone)
  clone
    .querySelectorAll(
      'script, style, iframe, form, button, .ads, .adsbygoogle, .chapter-note, .note-placeholder, :scope > p[style*="display: none"]',
    )
    .forEach((node) => node.remove())
  clone.querySelectorAll('img, picture, source, svg, canvas').forEach((node) => node.remove())

  clone.querySelectorAll('*').forEach((node) => {
    if (!ALLOWED_CONTENT_TAGS.has(node.tagName)) {
      node.replaceWith(...node.childNodes)
      return
    }
    ;[...node.attributes].forEach((attribute) => node.removeAttribute(attribute.name))
  })

  return clone.innerHTML.trim().replace(/<(br|hr)([^>]*?)(?:\s*\/)?>/gi, '<$1$2/>')
}

function normalizeNotes(content: HTMLElement) {
  const notes = [...content.querySelectorAll<HTMLElement>('.note-reg > div[id^="note"]')]
  const noteNumbers = new Map(notes.map((note, index) => [note.id.toLowerCase(), index + 1]))
  const textNodes = content.ownerDocument.createTreeWalker(content, NodeFilter.SHOW_TEXT)

  let textNode = textNodes.nextNode()
  while (textNode) {
    textNode.nodeValue = textNode.nodeValue?.replace(/\[note(\d+)\]/gi, (_, id: string) => {
      const number = noteNumbers.get(`note${id}`)
      return number ? `[${number}]` : ''
    }) ?? ''
    textNode = textNodes.nextNode()
  }

  notes.forEach((note, index) => {
    const noteContent = note.querySelector('.note-content_real')?.textContent?.trim().replace(/\s+/g, ' ')
      ?? note.querySelector('.note-content')?.textContent?.trim().replace(/\s+/g, ' ')
    if (!noteContent) {
      note.remove()
      return
    }
    const paragraph = content.ownerDocument.createElement('p')
    paragraph.textContent = `[${index + 1}] ${noteContent}`
    note.replaceWith(paragraph)
  })
}
