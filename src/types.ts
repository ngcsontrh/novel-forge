export interface BookMetadata {
  sourceUrl: string
  title: string
  author: string
  description: string
  tags: string
  delayMs: number
  coverUrl?: string
}

export interface ChapterLink {
  title: string
  url: string
  volumeTitle: string
}

export interface Chapter extends ChapterLink {
  content: string
}

export interface ScrapedBook {
  metadata: BookMetadata
  chapters: ChapterLink[]
}
