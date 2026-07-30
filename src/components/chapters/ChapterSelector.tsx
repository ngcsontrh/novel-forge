import type { ChapterLink } from '~/types'
import { groupChaptersByVolume } from '~/components/chapters/selection'
import { VolumeOption } from '~/components/chapters/VolumeOption'
import '~/components/chapters/ChapterSelector.css'

interface ChapterSelectorProps {
  chapters: ChapterLink[]
  selectedUrls: Set<string>
  onChange: (selectedUrls: Set<string>) => void
}

export function ChapterSelector({ chapters, selectedUrls, onChange }: ChapterSelectorProps) {
  const volumes = groupChaptersByVolume(chapters)

  return (
    <section className="card chapter-options">
      <div className="section-title chapter-heading">
        <div>
          <h2>Chương đưa vào EPUB</h2>
          <p>Đã chọn {selectedUrls.size}/{chapters.length} chương</p>
        </div>
        <div className="chapter-actions">
          <button type="button" onClick={() => onChange(new Set(chapters.map((chapter) => chapter.url)))}>
            Chọn tất cả
          </button>
          <button type="button" onClick={() => onChange(new Set())}>
            Bỏ chọn
          </button>
        </div>
      </div>
      <div className="volume-list">
        {volumes.map((volume) => (
          <VolumeOption
            key={volume.title}
            title={volume.title}
            chapters={volume.chapters}
            selectedUrls={selectedUrls}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  )
}
