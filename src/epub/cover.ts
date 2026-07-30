import type { BookMetadata } from '~/types'

export interface CoverAsset {
  data: ArrayBuffer
  extension: string
  type: string
}

export async function fetchCover(metadata: BookMetadata): Promise<CoverAsset | undefined> {
  if (!metadata.coverUrl) return undefined
  try {
    const response = await fetch(metadata.coverUrl)
    if (!response.ok) return undefined

    const type = response.headers.get('content-type') ?? 'image/jpeg'
    if (!type.startsWith('image/')) return undefined
    return {
      data: await response.arrayBuffer(),
      type: type.split(';')[0],
      extension: imageExtension(type),
    }
  } catch {
    return undefined
  }
}

function imageExtension(contentType: string) {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
  return 'jpg'
}
