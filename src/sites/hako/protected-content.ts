function decodeBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export function decodeProtectedPayload(method: string, key: string, chunks: string[]) {
  const decoder = new TextDecoder('utf-8')
  return [...chunks]
    .sort((left, right) => Number.parseInt(left.slice(0, 4), 10) - Number.parseInt(right.slice(0, 4), 10))
    .map((chunk) => {
      let payload = chunk.slice(4)
      if (method === 'base64_reverse') payload = [...payload].reverse().join('')
      const bytes = decodeBase64(payload)
      if (method !== 'xor_shuffle') return decoder.decode(bytes)
      if (!key) throw new Error('Nội dung chương được bảo vệ nhưng thiếu khóa giải mã.')

      const decoded = new Uint8Array(bytes.length)
      for (let index = 0; index < bytes.length; index += 1) {
        decoded[index] = bytes[index] ^ key.charCodeAt(index % key.length)
      }
      return decoder.decode(decoded)
    })
    .join('')
}

export function revealProtectedContent(document: Document, content: Element) {
  const protectedElement = content.querySelector<HTMLElement>('#chapter-c-protected')
  if (!protectedElement) return

  const method = protectedElement.dataset.s ?? 'none'
  const key = protectedElement.dataset.k ?? ''
  let chunks: string[]
  try {
    chunks = JSON.parse(protectedElement.dataset.c ?? '[]') as string[]
  } catch {
    throw new Error('Dữ liệu chương được bảo vệ không đúng định dạng.')
  }
  if (!Array.isArray(chunks) || !chunks.length) {
    throw new Error('Không tìm thấy dữ liệu nội dung chương.')
  }

  const wrapper = document.createElement('div')
  wrapper.innerHTML = decodeProtectedPayload(method, key, chunks)
  protectedElement.replaceWith(...wrapper.childNodes)
}
