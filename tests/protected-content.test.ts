import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeProtectedPayload } from '~/sites/hako'

test('decodes and orders protected chapter payloads', () => {
  const reversed = [...btoa('noi dung')].reverse().join('')

  assert.equal(decodeProtectedPayload('base64_reverse', '', [`0001${reversed}`]), 'noi dung')
  assert.equal(
    decodeProtectedPayload('none', '', [
      `0002${btoa('sau')}`,
      `0001${btoa('truoc ')}`,
    ]),
    'truoc sau',
  )
})

test('decodes XOR-protected UTF-8 content and requires its key', () => {
  const source = new TextEncoder().encode('Nội dung')
  const key = 'hako'
  const encrypted = Uint8Array.from(
    source,
    (byte, index) => byte ^ key.charCodeAt(index % key.length),
  )
  const payload = btoa(String.fromCharCode(...encrypted))

  assert.equal(decodeProtectedPayload('xor_shuffle', key, [`0001${payload}`]), 'Nội dung')
  assert.throws(
    () => decodeProtectedPayload('xor_shuffle', '', [`0001${btoa('payload')}`]),
    /khóa giải mã/,
  )
})
