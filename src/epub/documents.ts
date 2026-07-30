import type { BookMetadata } from '~/types'
import type { CoverAsset } from '~/epub/cover'
import type { EpubChapter, EpubVolume } from '~/epub/model'

export const CONTAINER_DOCUMENT = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`

export const BOOK_STYLES = 'body{font-family:serif;line-height:1.65;margin:5%;color:#24211f}'
  + 'h1{font-size:1.5em;line-height:1.3;margin:0 0 1.5em}'
  + 'p{margin:.8em 0;text-align:justify}'
  + 'blockquote{border-left:.2em solid #aaa;margin:1em;padding-left:1em}'

export function packageDocument(
  metadata: BookMetadata,
  chapters: EpubChapter[],
  cover: CoverAsset | undefined,
) {
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const subjects = metadata.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => `<dc:subject>${escapeXml(tag)}</dc:subject>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="vi">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">${escapeXml(identifier(metadata))}</dc:identifier>
<dc:title>${escapeXml(metadata.title)}</dc:title>
<dc:language>vi</dc:language>
<dc:creator>${escapeXml(metadata.author || 'Không rõ')}</dc:creator>
<dc:description>${escapeXml(metadata.description)}</dc:description>
${subjects}
<dc:source>${escapeXml(metadata.sourceUrl)}</dc:source>
<meta property="dcterms:modified">${modified}</meta>
${cover ? '<meta name="cover" content="cover-image"/>' : ''}
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="css" href="style.css" media-type="text/css"/>
${cover ? `<item id="cover-image" href="cover.${cover.extension}" media-type="${cover.type}" properties="cover-image"/>` : ''}
${chapters.map((chapter) => `<item id="${chapter.id}" href="${chapter.file}" media-type="application/xhtml+xml"/>`).join('\n')}
</manifest>
<spine><itemref idref="nav"/>${chapters.map((chapter) => `<itemref idref="${chapter.id}"/>`).join('')}</spine>
</package>`
}

export function navigationDocument(volumes: EpubVolume[]) {
  const items = volumes.map((volume) =>
    `<li><span>${escapeXml(volume.title)}</span><ol>`
    + volume.chapters.map((chapter) =>
      `<li><a href="${chapter.file}">${escapeXml(chapter.title)}</a></li>`).join('')
    + '</ol></li>',
  ).join('')
  return xhtml('Mục lục', `<nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><h1>Mục lục</h1><ol>${items}</ol></nav>`)
}

export function chapterDocument(chapter: EpubChapter) {
  return xhtml(chapter.title, `<h1>${escapeXml(chapter.title)}</h1>${chapter.content}`)
}

function xhtml(title: string, body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head><meta charset="UTF-8"/><title>${escapeXml(title)}</title><link rel="stylesheet" href="style.css"/></head>
<body>${body}</body></html>`
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character]!)
}

function identifier(metadata: BookMetadata) {
  const input = `${metadata.sourceUrl}|${metadata.title}|${metadata.author}`
  let hash = 2166136261
  for (const char of input) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return `urn:hako:${(hash >>> 0).toString(16)}`
}
