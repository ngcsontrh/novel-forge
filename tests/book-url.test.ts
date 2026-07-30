import assert from 'node:assert/strict'
import test from 'node:test'
import { findSiteForBookUrl, normalizeSupportedBookUrl } from '~/sites'

test('supports story and AI translation URLs on both Hako domains', () => {
  const supportedUrls = [
    'https://ln.hako.vn/truyen/example',
    'https://ln.hako.vn/ai-dich/example',
    'https://docln.sbs/truyen/example',
    'https://docln.sbs/ai-dich/example',
  ]

  supportedUrls.forEach((url) => {
    assert.equal(findSiteForBookUrl(url)?.id, 'hako')
  })
})

test('rejects unsafe URLs and removes non-book URL parts', () => {
  const unsupportedUrls = [
    'http://ln.hako.vn/truyen/example',
    'https://ln.hako.vn.evil.test/truyen/example',
    'https://docln.sbs/tin-tuc/example',
    'not-a-url',
  ]

  unsupportedUrls.forEach((url) => {
    assert.equal(findSiteForBookUrl(url), undefined)
  })
  assert.equal(
    normalizeSupportedBookUrl('https://docln.sbs/truyen/example?tab=chapters#chapter-list'),
    'https://docln.sbs/truyen/example',
  )
})

test('supports and normalizes UU看書 book URLs', () => {
  assert.equal(findSiteForBookUrl('https://uukanshu.cc/book/17318/')?.id, 'uukanshu')
  assert.equal(findSiteForBookUrl('https://www.uukanshu.cc/book/17318')?.id, 'uukanshu')
  assert.equal(findSiteForBookUrl('https://uukanshu.cc/book/17318/10252476.html'), undefined)
  assert.equal(findSiteForBookUrl('http://uukanshu.cc/book/17318/'), undefined)
  assert.equal(findSiteForBookUrl('https://uukanshu.cc.evil.test/book/17318/'), undefined)
  assert.equal(
    normalizeSupportedBookUrl('https://www.uukanshu.cc/book/17318?from=test#chapters'),
    'https://uukanshu.cc/book/17318/',
  )
})

test('supports and normalizes Novel543 book URLs', () => {
  assert.equal(findSiteForBookUrl('https://www.novel543.com/0410698823/')?.id, 'novel543')
  assert.equal(findSiteForBookUrl('https://novel543.com/0410698823')?.id, 'novel543')
  assert.equal(findSiteForBookUrl('https://www.novel543.com/0410698823/8096_1.html'), undefined)
  assert.equal(findSiteForBookUrl('http://www.novel543.com/0410698823/'), undefined)
  assert.equal(findSiteForBookUrl('https://www.novel543.com.evil.test/0410698823/'), undefined)
  assert.equal(
    normalizeSupportedBookUrl('https://novel543.com/0410698823?from=test#chapters'),
    'https://www.novel543.com/0410698823/',
  )
})
