import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_CRAWL_DELAY_MS, isSupportedBookUrl } from '~/config'
import { buildEpub, safeFilename } from '~/epub'
import { findInitialBookUrl, rememberBookUrl, saveBlob } from '~/services/browser'
import { crawlChapters } from '~/services/chapterCrawler'
import { requireSiteForBookUrl } from '~/sites'
import type { BookMetadata, ChapterLink } from '~/types'

const INITIAL_METADATA: BookMetadata = {
  sourceUrl: '',
  title: '',
  author: '',
  description: '',
  tags: '',
  delayMs: DEFAULT_CRAWL_DELAY_MS,
}

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback
}

export function useBookWorkflow() {
  const [metadata, setMetadata] = useState(INITIAL_METADATA)
  const [chapters, setChapters] = useState<ChapterLink[]>([])
  const [selectedChapterUrls, setSelectedChapterUrls] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const initialized = useRef(false)

  const selectedChapters = useMemo(
    () => chapters.filter((chapter) => selectedChapterUrls.has(chapter.url)),
    [chapters, selectedChapterUrls],
  )
  const ready = Boolean(metadata.title.trim() && selectedChapterUrls.size && !loading)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    void findInitialBookUrl().then((sourceUrl) => {
      if (!sourceUrl) return
      setMetadata((current) => ({ ...current, sourceUrl }))
      if (isSupportedBookUrl(sourceUrl)) void inspect(sourceUrl)
    })
  }, [])

  function updateMetadata<K extends keyof BookMetadata>(key: K, value: BookMetadata[K]) {
    setMetadata((current) => ({ ...current, [key]: value }))
  }

  async function inspect(sourceUrl = metadata.sourceUrl) {
    setLoading(true)
    setError('')
    setProgress('Đang đọc thông tin truyện…')
    try {
      const site = requireSiteForBookUrl(sourceUrl.trim())
      const book = await site.readBook(site.normalizeBookUrl(sourceUrl.trim()))
      if (!book.chapters.length) throw new Error('Không tìm thấy chương nào trên trang truyện.')

      setMetadata(book.metadata)
      setChapters(book.chapters)
      setSelectedChapterUrls(new Set(book.chapters.map((chapter) => chapter.url)))
      await rememberBookUrl(book.metadata.sourceUrl)
      setProgress(`Đã tìm thấy ${book.chapters.length} chương. Bạn có thể sửa metadata trước khi tải.`)
    } catch (reason) {
      setChapters([])
      setSelectedChapterUrls(new Set())
      setError(errorMessage(reason, 'Có lỗi khi đọc trang truyện.'))
      setProgress('')
    } finally {
      setLoading(false)
    }
  }

  async function download() {
    setLoading(true)
    setError('')
    try {
      const crawled = await crawlChapters(
        requireSiteForBookUrl(metadata.sourceUrl),
        selectedChapters,
        metadata.delayMs,
        (completed, total, chapter) => {
          setProgress(`Đang tải chương ${completed + 1}/${total}: ${chapter.title}`)
        },
      )

      setProgress('Đang đóng gói EPUB…')
      const blob = await buildEpub(metadata, crawled)
      await saveBlob(blob, safeFilename(metadata.title))
      setProgress(`Hoàn tất ${selectedChapters.length} chương.`)
    } catch (reason) {
      setError(errorMessage(reason, 'Không thể tạo EPUB.'))
    } finally {
      setLoading(false)
    }
  }

  return {
    chapters,
    download,
    error,
    inspect,
    loading,
    metadata,
    progress,
    ready,
    selectedChapterUrls,
    setError,
    setSelectedChapterUrls,
    updateMetadata,
  }
}
