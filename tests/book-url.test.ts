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
