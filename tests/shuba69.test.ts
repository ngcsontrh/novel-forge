import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cleanBookTitle,
  orderChapterEntries,
  parseTagList,
  readBookInfoValue,
  readChapterLinks,
} from '~/sites/shuba69/book'
import {
  isSiteNotice,
  normalizeBlockText,
  splitBlocks,
  toChapterHtml,
} from '~/sites/shuba69/chapter'
import {
  isShuba69BookUrl,
  normalizeShuba69BookUrl,
  normalizeShuba69ChapterUrl,
  readShuba69BookId,
  shuba69CatalogUrl,
} from '~/sites/shuba69/url'

const CATALOG_URL = 'https://www.69shuba.com/book/90442/'

test('recognizes 69shuba book URLs in both published forms', () => {
  assert.equal(isShuba69BookUrl('https://www.69shuba.com/book/90442.htm'), true)
  assert.equal(isShuba69BookUrl('https://69shuba.com/book/90442.htm'), true)
  assert.equal(isShuba69BookUrl('https://www.69shuba.com/book/90442/'), true)
  assert.equal(readShuba69BookId('https://69shuba.com/book/90442.htm'), '90442')
})

test('rejects unsupported 69shuba URLs', () => {
  assert.equal(isShuba69BookUrl('http://www.69shuba.com/book/90442.htm'), false)
  assert.equal(isShuba69BookUrl('https://www.69shuba.com/txt/90442/40755363'), false)
  assert.equal(isShuba69BookUrl('https://www.69shuba.com/book/90442'), false)
  assert.equal(isShuba69BookUrl('https://www.69shuba.com/novels/class/10.htm'), false)
  assert.equal(isShuba69BookUrl('https://www.69shuba.com.evil.test/book/90442.htm'), false)
  assert.equal(isShuba69BookUrl('not-a-url'), false)
})

test('normalizes book and catalog URLs to the canonical host', () => {
  assert.equal(
    normalizeShuba69BookUrl('https://69shuba.com/book/90442.htm?from=test#catalog'),
    'https://www.69shuba.com/book/90442.htm',
  )
  assert.equal(
    normalizeShuba69BookUrl('https://www.69shuba.com/book/90442/'),
    'https://www.69shuba.com/book/90442.htm',
  )
  assert.equal(shuba69CatalogUrl('https://69shuba.com/book/90442.htm'), CATALOG_URL)
  assert.throws(() => normalizeShuba69BookUrl('https://www.69shuba.com/'), /69shuba\.com\/book/)
})

test('accepts chapter URLs only for the requested book', () => {
  assert.equal(
    normalizeShuba69ChapterUrl('https://69shuba.com/txt/90442/40755363', '90442'),
    'https://www.69shuba.com/txt/90442/40755363',
  )
  assert.equal(normalizeShuba69ChapterUrl('https://www.69shuba.com/txt/90175/1', '90442'), undefined)
  assert.equal(normalizeShuba69ChapterUrl('https://evil.test/txt/90442/1', '90442'), undefined)
  assert.equal(normalizeShuba69ChapterUrl('https://www.69shuba.com/book/90442.htm', '90442'), undefined)
})

test('reads the catalog in ascending chapter order using data-num', () => {
  const document = catalogDocument([
    item('569', '/txt/90442/41051913', '第568章 尾章'),
    item('568', '/txt/90442/41051737', '第567章 giữa'),
    item('1', 'https://www.69shuba.com/txt/90442/40755363', '第1章 đầu'),
  ])

  const chapters = readChapterLinks(document, CATALOG_URL)

  assert.deepEqual(chapters.map((chapter) => chapter.url), [
    'https://www.69shuba.com/txt/90442/40755363',
    'https://www.69shuba.com/txt/90442/41051737',
    'https://www.69shuba.com/txt/90442/41051913',
  ])
  assert.deepEqual(chapters[0], {
    title: '第1章 đầu',
    url: 'https://www.69shuba.com/txt/90442/40755363',
    volumeTitle: '全部章節',
  })
})

test('drops catalog rows that are not chapters of the requested book', () => {
  const document = catalogDocument([
    item('2', '/txt/90442/40755364', '第2章'),
    item('1', '/txt/90442/40755363', '第1章'),
    item(undefined, 'https://evil.test/txt/90442/40755365', '恶意'),
    item(undefined, '/txt/90175/40755366', '别的书'),
    item(undefined, '/novels/class/10.htm', '分类'),
    item(undefined, '/txt/90442/40755367', ' '),
  ])

  const chapters = readChapterLinks(document, CATALOG_URL)
  assert.deepEqual(chapters.map((chapter) => chapter.title), ['第1章', '第2章'])
})

test('falls back to reversed document order when data-num is absent', () => {
  const entries = [
    { order: undefined, link: link('https://www.69shuba.com/txt/90442/3', '第3章') },
    { order: undefined, link: link('https://www.69shuba.com/txt/90442/2', '第2章') },
    { order: undefined, link: link('https://www.69shuba.com/txt/90442/1', '第1章') },
  ]

  assert.deepEqual(
    orderChapterEntries(entries).map((chapter) => chapter.title),
    ['第1章', '第2章', '第3章'],
  )
})

test('deduplicates catalog entries by chapter URL', () => {
  const entries = [
    { order: 1, link: link('https://www.69shuba.com/txt/90442/1', '第1章') },
    { order: 2, link: link('https://www.69shuba.com/txt/90442/1', '第1章（重复）') },
  ]

  const chapters = orderChapterEntries(entries)
  assert.equal(chapters.length, 1)
  assert.equal(chapters[0].title, '第1章')
})

test('reads book metadata fields from the inline bookinfo script', () => {
  const script = [
    'var bookinfo = {',
    "  articleid: '90442',",
    "  articlename: '书名',",
    "  sortName: '官场职场',",
    "  author: '作者名',",
    "  tags: '同人衍生|穿越|魔法|',",
    '};',
  ].join('\n')

  assert.equal(readBookInfoValue(script, 'articlename'), '书名')
  assert.equal(readBookInfoValue(script, 'author'), '作者名')
  assert.equal(readBookInfoValue(script, 'sortName'), '官场职场')
  assert.deepEqual(parseTagList(readBookInfoValue(script, 'tags')), ['同人衍生', '穿越', '魔法'])
  assert.equal(readBookInfoValue('var bookinfo = {};', 'tags'), '')
})

test('removes marketing noise from page titles', () => {
  assert.equal(cleanBookTitle('书名无弹窗,书名最新章节阅读-69书吧'), '书名')
  assert.equal(cleanBookTitle('  书名  '), '书名')
  assert.equal(cleanBookTitle('书名txt全集下载'), '书名')
})

test('rebuilds paragraphs from br-separated chapter text', () => {
  const nodes = [
    textNode('\u3000\u3000第1章 标题\n'),
    element('BR'), element('BR'),
    textNode('\u3000\u3000第一段 <内容> & 符号\n'),
    element('BR'), element('BR'),
    textNode('\u3000\u3000第二段内容\n'),
    element('BR'), element('BR'),
    textNode('\u3000\u3000请记住本书首发域名：www.69shuba.com\n'),
    element('BR'), element('BR'),
    textNode('\u3000\u3000（本章完）\n'),
    element('BR'), element('BR'),
  ]

  assert.equal(toChapterHtml(splitBlocks(nodes), '第1章 标题'), [
    '<p>第一段 &lt;内容&gt; &amp; 符号</p>',
    '<p>第二段内容</p>',
  ].join('\n'))
})

test('splits a single text run into one block per br pair', () => {
  const blocks = splitBlocks([
    textNode('一'),
    element('BR'),
    element('BR'),
    textNode('二'),
  ]).filter(Boolean)

  assert.deepEqual(blocks, ['一', '二'])
})

test('keeps paragraphs that are already wrapped in block elements', () => {
  const nodes = [
    element('P', [textNode('\u3000\u3000第一段')]),
    element('P', [textNode('\u3000\u3000第二段')]),
  ]

  assert.equal(
    toChapterHtml(splitBlocks(nodes), '第1章'),
    '<p>第一段</p>\n<p>第二段</p>',
  )
})

test('keeps inline markup text and drops leading duplicated titles', () => {
  const nodes = [
    textNode('第1章 标题'),
    element('BR'),
    textNode('前'),
    element('STRONG', [textNode('重点')]),
    textNode('后'),
  ]

  assert.equal(toChapterHtml(splitBlocks(nodes), '第1章 标题'), '<p>前重点后</p>')
})

test('normalizes full-width whitespace and detects site notices', () => {
  assert.equal(normalizeBlockText('\u3000\u3000内容\u00a0内容 \n'), '内容 内容')
  assert.equal(isSiteNotice('69书吧'), true)
  assert.equal(isSiteNotice('本章未完，请点击下一页继续阅读'), true)
  assert.equal(isSiteNotice('（本章完）'), true)
  assert.equal(isSiteNotice('手机版阅读网址：m.69shuba.com'), true)
  assert.equal(isSiteNotice('这是正常的小说内容。'), false)
})

function link(url: string, title: string) {
  return { title, url, volumeTitle: '全部章節' }
}

function item(dataNum: string | undefined, href: string, title: string) {
  const anchor = {
    getAttribute: (name: string) => (name === 'href' ? href : null),
    textContent: title,
  } as unknown as HTMLAnchorElement

  return {
    getAttribute: (name: string) => (name === 'data-num' ? (dataNum ?? null) : null),
    querySelector: (selector: string) => (selector === 'a[href]' ? anchor : null),
  } as unknown as HTMLElement
}

function catalogDocument(items: readonly HTMLElement[]) {
  return {
    querySelectorAll: (selector: string) => (selector === '#catalog ul li' ? items : []),
  } as unknown as Document
}

function textNode(value: string) {
  return { nodeType: 3, nodeValue: value } as unknown as ChildNode
}

function element(tagName: string, children: readonly ChildNode[] = []) {
  return {
    nodeType: 1,
    tagName,
    childNodes: children,
  } as unknown as ChildNode
}
