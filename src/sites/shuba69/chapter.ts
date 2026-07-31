import { firstElement, parseHtml, text } from '~/sites/document'
import { loadRenderedHtml } from '~/services/resourceLoader'
import type { Chapter, ChapterLink } from '~/types'

const CHAPTER_READY_SELECTOR = '.txtnav'
const ELEMENT_NODE = 1
const TEXT_NODE = 3

const CONTENT_SELECTORS = ['.txtnav', '#content', '.txtcontent']
const TITLE_SELECTORS = ['.txtnav h1', 'h1.hide720', 'h1.hide', 'h1']

const REMOVED_SELECTOR = [
  'script', 'style', 'iframe', 'form', 'button', 'ins', 'noscript',
  'img', 'picture', 'source', 'svg', 'canvas', 'audio', 'video',
  'h1', 'h2', '.txtinfo', '#txtright', '.contentadv', '.bottom-ad', '.bottom-ad2',
  '.page1', '.baocuo', '.tuijian', '.ads', '.adsbygoogle', '.yueduad1', '.tools',
  '[style*="display:none"]', '[style*="display: none"]',
].join(', ')

const BLOCK_TAGS = new Set([
  'P', 'DIV', 'SECTION', 'ARTICLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'CENTER', 'TABLE', 'TR', 'TD', 'TH',
])

const NOTICE_PATTERN = new RegExp([
  '69\\s*(?:书|書)\\s*吧', '69shuba', '69shu\\b', 'cdnshu',
  '六九(?:书|書)吧', '(?:请|請)(?:记住|記住)本(?:书|書)', '首(?:发|發)(?:域名|网址|網址)',
  '手机版(?:阅读|閱讀)?(?:网址|網址)', '加入(?:书|書|收藏)(?:签|籤|架)',
  '本章未完', '(?:点击|點擊)下一(?:页|頁)', '(?:章节|章節)(?:报错|報錯)',
  '(?:一秒|一秒钟)?(?:记住|記住)本站', '(?:请|請)收藏本站',
].join('|'), 'i')

export async function readShuba69Chapter(link: ChapterLink): Promise<Chapter> {
  const document = parseHtml(await loadRenderedHtml(link.url, CHAPTER_READY_SELECTOR))
  const container = firstElement(document, CONTENT_SELECTORS)
  if (!container) throw new Error(`Không tìm thấy nội dung: ${link.title}`)

  const title = text(document, TITLE_SELECTORS) || link.title
  const content = toChapterHtml(readContentBlocks(container), title)
  if (!content) throw new Error(`Nội dung chương rỗng: ${link.title}`)

  return { ...link, title, content }
}

export function readContentBlocks(element: Element) {
  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll(REMOVED_SELECTOR).forEach((node) => node.remove())
  return splitBlocks([...clone.childNodes])
}

export function splitBlocks(nodes: readonly ChildNode[]) {
  const blocks: string[] = []
  let buffer = ''
  const flush = () => {
    blocks.push(buffer)
    buffer = ''
  }

  const visit = (children: readonly ChildNode[]) => {
    children.forEach((node) => {
      if (node.nodeType === TEXT_NODE) {
        buffer += node.nodeValue ?? ''
        return
      }
      if (node.nodeType !== ELEMENT_NODE) return

      const child = node as Element
      if (child.tagName === 'BR' || child.tagName === 'HR') {
        flush()
        return
      }
      if (BLOCK_TAGS.has(child.tagName)) {
        flush()
        visit([...child.childNodes])
        flush()
        return
      }
      visit([...child.childNodes])
    })
  }

  visit(nodes)
  flush()
  return blocks
}

export function toChapterHtml(blocks: readonly string[], title: string) {
  return dropLeadingTitle(
    blocks.map(normalizeBlockText).filter((block) => block && !isSiteNotice(block)),
    title,
  )
    .map((block) => `<p>${escapeHtml(block)}</p>`)
    .join('\n')
}

export function normalizeBlockText(value: string) {
  return value.replace(/[\s\u00a0\u2002\u2003\u3000]+/g, ' ').trim()
}

export function isSiteNotice(value: string) {
  if (NOTICE_PATTERN.test(value)) return true
  return /^[（([【]?\s*本章(?:完|结束|終)\s*[)）\]】]?$/.test(value)
}

function dropLeadingTitle(blocks: readonly string[], title: string) {
  const wanted = normalizeBlockText(title)
  if (!wanted) return blocks

  let start = 0
  while (start < blocks.length && normalizeBlockText(blocks[start]) === wanted) start += 1
  return blocks.slice(start)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  })[character]!)
}
