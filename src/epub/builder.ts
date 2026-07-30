import JSZip from 'jszip'
import type { BookMetadata, Chapter } from '~/types'
import { fetchCover } from '~/epub/cover'
import {
  BOOK_STYLES,
  chapterDocument,
  CONTAINER_DOCUMENT,
  navigationDocument,
  packageDocument,
} from '~/epub/documents'
import { createBookStructure } from '~/epub/model'

export async function buildEpub(metadata: BookMetadata, chapters: Chapter[]) {
  const zip = new JSZip()
  const cover = await fetchCover(metadata)
  const { chapterItems, volumes } = createBookStructure(chapters)

  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file('META-INF/container.xml', CONTAINER_DOCUMENT)
  zip.file('OEBPS/content.opf', packageDocument(metadata, chapterItems, cover))
  zip.file('OEBPS/nav.xhtml', navigationDocument(volumes))
  zip.file('OEBPS/style.css', BOOK_STYLES)

  if (cover) zip.file(`OEBPS/cover.${cover.extension}`, cover.data)
  chapterItems.forEach((chapter) => {
    zip.file(`OEBPS/${chapter.file}`, chapterDocument(chapter))
  })

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}
