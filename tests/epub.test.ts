import assert from 'node:assert/strict'
import test from 'node:test'
import JSZip from 'jszip'
import { buildEpub, safeFilename } from '~/epub'
import type { BookMetadata, Chapter } from '~/types'

const metadata: BookMetadata = {
  sourceUrl: 'https://docln.sbs/truyen/example?a=1&b=2',
  title: 'Tên <truyện> & thử nghiệm',
  author: 'Tác giả',
  description: 'Mô tả',
  tags: 'Fantasy, Phiêu lưu',
  delayMs: 2500,
}

const chapters: Chapter[] = [
  {
    title: 'Chương <1>',
    url: 'https://docln.sbs/truyen/example/c1-example',
    volumeTitle: 'Volume & Một',
    content: '<p>Nội dung chương một.</p>',
  },
  {
    title: 'Chương 2',
    url: 'https://docln.sbs/truyen/example/c2-example',
    volumeTitle: 'Volume & Một',
    content: '<p>Nội dung chương hai.</p>',
  },
]

test('builds a readable EPUB archive with metadata, navigation and chapters', async () => {
  const epub = await buildEpub(metadata, chapters)
  const zip = await JSZip.loadAsync(await epub.arrayBuffer())

  assert.equal(await zip.file('mimetype')?.async('string'), 'application/epub+zip')
  assert.ok(zip.file('META-INF/container.xml'))
  assert.ok(zip.file('OEBPS/style.css'))

  const packageXml = await zip.file('OEBPS/content.opf')!.async('string')
  assert.match(packageXml, /<dc:title>Tên &lt;truyện&gt; &amp; thử nghiệm<\/dc:title>/)
  assert.match(packageXml, /<dc:subject>Fantasy<\/dc:subject>/)
  assert.match(packageXml, /<itemref idref="chapter-1"\/><itemref idref="chapter-2"\/>/)

  const navigation = await zip.file('OEBPS/nav.xhtml')!.async('string')
  assert.match(navigation, /<span>Volume &amp; Một<\/span>/)
  assert.match(navigation, /href="chapter-0001.xhtml">Chương &lt;1&gt;<\/a>/)
  assert.match(navigation, /href="chapter-0002.xhtml">Chương 2<\/a>/)

  const firstChapter = await zip.file('OEBPS/chapter-0001.xhtml')!.async('string')
  assert.match(firstChapter, /<h1>Chương &lt;1&gt;<\/h1><p>Nội dung chương một.<\/p>/)
})

test('creates an operating-system-safe EPUB filename', () => {
  assert.equal(safeFilename('  Tên: truyện?  '), 'Tên truyện.epub')
  assert.equal(safeFilename('<>:"/\\|?*\u0000'), 'truyen.epub')
})
