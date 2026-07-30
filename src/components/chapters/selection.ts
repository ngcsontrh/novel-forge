import type { ChapterLink } from '~/types'

export interface ChapterVolume {
  title: string
  chapters: ChapterLink[]
}

export function groupChaptersByVolume(chapters: ChapterLink[]): ChapterVolume[] {
  const grouped = new Map<string, ChapterLink[]>()
  chapters.forEach((chapter) => {
    const volumeChapters = grouped.get(chapter.volumeTitle) ?? []
    volumeChapters.push(chapter)
    grouped.set(chapter.volumeTitle, volumeChapters)
  })
  return [...grouped].map(([title, volumeChapters]) => ({
    title,
    chapters: volumeChapters,
  }))
}

export function toggleChapterSelection(selectedUrls: Set<string>, chapterUrl: string) {
  const next = new Set(selectedUrls)
  if (next.has(chapterUrl)) next.delete(chapterUrl)
  else next.add(chapterUrl)
  return next
}

export function toggleVolumeSelection(
  selectedUrls: Set<string>,
  chapters: ChapterLink[],
) {
  const next = new Set(selectedUrls)
  const shouldSelect = chapters.some((chapter) => !next.has(chapter.url))
  chapters.forEach((chapter) => {
    if (shouldSelect) next.add(chapter.url)
    else next.delete(chapter.url)
  })
  return next
}
