import type { Chapter } from '~/types'

export interface EpubChapter extends Chapter {
  id: string
  file: string
}

export interface EpubVolume {
  title: string
  chapters: EpubChapter[]
}

export function createBookStructure(chapters: Chapter[]) {
  const chapterItems: EpubChapter[] = chapters.map((chapter, index) => ({
    ...chapter,
    id: `chapter-${index + 1}`,
    file: `chapter-${String(index + 1).padStart(4, '0')}.xhtml`,
  }))

  const volumes: EpubVolume[] = [...new Set(chapterItems.map((chapter) => chapter.volumeTitle))]
    .map((title) => ({
      title,
      chapters: chapterItems.filter((chapter) => chapter.volumeTitle === title),
    }))

  return { chapterItems, volumes }
}
