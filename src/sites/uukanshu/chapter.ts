import { firstElement, parseHtml, text } from '~/sites/document'
import { loadRenderedHtml } from '~/services/resourceLoader'
import type { Chapter, ChapterLink } from '~/types'

const ALLOWED_CONTENT_TAGS = new Set([
  'P', 'BR', 'H2', 'H3', 'H4', 'STRONG', 'B', 'EM', 'I',
  'BLOCKQUOTE', 'HR', 'UL', 'OL', 'LI',
])

export async function readUukanshuChapter(link: ChapterLink): Promise<Chapter> {
  const document = parseHtml(await loadRenderedHtml(link.url, '.readcotent'))
  const title = text(document, ['.readtitle', 'h1']) || link.title
  const content = firstElement(document, ['.readcotent'])
  if (!content) throw new Error(`Không tìm thấy nội dung: ${link.title}`)

  return { ...link, title, content: cleanContent(content) }
}

function cleanContent(element: Element) {
  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll(
    'script, style, iframe, form, button, ins, .ads, .adsbygoogle, [style*="display:none"], [style*="display: none"]',
  ).forEach((node) => node.remove())
  clone.querySelectorAll('img, picture, source, svg, canvas').forEach((node) => node.remove())

  clone.querySelectorAll('*').forEach((node) => {
    if (!ALLOWED_CONTENT_TAGS.has(node.tagName)) {
      node.replaceWith(...node.childNodes)
      return
    }
    ;[...node.attributes].forEach((attribute) => node.removeAttribute(attribute.name))
  })

  removeSiteNotices(clone)
  return clone.innerHTML.trim().replace(/<(br|hr)([^>]*?)(?:\s*\/)?>/gi, '<$1$2/>')
}

function removeSiteNotices(content: HTMLElement) {
  const notice = /UU看書|uukanshu\.cc|加入書籤|加入书签|本章完/i
  content.querySelectorAll('p').forEach((paragraph) => {
    if (notice.test(paragraph.textContent ?? '')) paragraph.remove()
  })

  const walker = content.ownerDocument.createTreeWalker(content, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    node.nodeValue = node.nodeValue
      ?.replace(/一秒記住.*?UU看書.*?(?=\n|$)/gi, '')
      .replace(/請收藏本站.*?uukanshu\.cc.*?(?=\n|$)/gi, '') ?? ''
    node = walker.nextNode()
  }
}
