import type { BookMetadata } from '~/types'
import { CoverEditor } from '~/components/book/CoverEditor'
import '~/components/book/BookMetadataForm.css'

interface BookMetadataFormProps {
  chapterCount: number
  metadata: BookMetadata
  onChange: <K extends keyof BookMetadata>(key: K, value: BookMetadata[K]) => void
  onError: (message: string) => void
}

export function BookMetadataForm({
  chapterCount,
  metadata,
  onChange,
  onError,
}: BookMetadataFormProps) {
  return (
    <section className="card fields">
      <div className="section-title">
        <h2>Thông tin sách</h2>
        {chapterCount > 0 && <span>{chapterCount} chương</span>}
      </div>
      <CoverEditor
        coverUrl={metadata.coverUrl}
        onChange={(coverUrl) => onChange('coverUrl', coverUrl)}
        onError={onError}
      />
      <label htmlFor="title">Tên truyện</label>
      <input id="title" value={metadata.title} onChange={(event) => onChange('title', event.target.value)} />
      <label htmlFor="author">Tác giả</label>
      <input id="author" value={metadata.author} onChange={(event) => onChange('author', event.target.value)} />
      <label htmlFor="description">Mô tả</label>
      <textarea
        id="description"
        rows={4}
        value={metadata.description}
        onChange={(event) => onChange('description', event.target.value)}
      />
      <label htmlFor="tags">Tag truyện <small>phân cách bằng dấu phẩy</small></label>
      <input id="tags" value={metadata.tags} onChange={(event) => onChange('tags', event.target.value)} />
      <label htmlFor="delay">Thời gian crawl mỗi chương <small>mili giây</small></label>
      <div className="unit-input">
        <input
          id="delay"
          type="number"
          min="0"
          step="100"
          value={metadata.delayMs}
          onChange={(event) => onChange('delayMs', Math.max(0, Number(event.target.value) || 0))}
        />
        <span>ms</span>
      </div>
    </section>
  )
}
