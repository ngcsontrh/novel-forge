import assert from 'node:assert/strict'
import test from 'node:test'
import { readChapterLinks } from '~/sites/novel543/book'
import { findContinuationUrl } from '~/sites/novel543/chapter'

test('reads Novel543 chapters from the second chapter list', () => {
  const anchors = [
    anchor('/0410698823/8096_1.html', '第一章'),
    anchor('/0410698823/8096_2.html', '第二章'),
  ]
  const document = {
    querySelector: (selector: string) => selector === 'div.chaplist ul:nth-of-type(2)'
      ? { querySelectorAll: () => anchors }
      : null,
  } as unknown as Document

  assert.deepEqual(readChapterLinks(document, 'https://www.novel543.com/0410698823/'), [
    {
      title: '第一章',
      url: 'https://www.novel543.com/0410698823/8096_1.html',
      volumeTitle: '全部章節',
    },
    {
      title: '第二章',
      url: 'https://www.novel543.com/0410698823/8096_2.html',
      volumeTitle: '全部章節',
    },
  ])
})

test('follows only continuation pages belonging to the same Novel543 chapter', () => {
  const chapterUrl = 'https://www.novel543.com/0410698823/8096_1.html'
  const continuation = footNavDocument('/0410698823/8096_1_2.html')
  const nextChapter = footNavDocument('/0410698823/8096_2.html')

  assert.equal(
    findContinuationUrl(continuation, chapterUrl),
    'https://www.novel543.com/0410698823/8096_1_2.html',
  )
  assert.equal(findContinuationUrl(nextChapter, chapterUrl), undefined)
})

function anchor(href: string, title = '') {
  return {
    getAttribute: (name: string) => name === 'href' ? href : null,
    textContent: title,
  } as unknown as HTMLAnchorElement
}

function footNavDocument(nextHref: string) {
  return {
    querySelectorAll: () => [anchor('/0410698823/'), anchor(nextHref)],
  } as unknown as Document
}
