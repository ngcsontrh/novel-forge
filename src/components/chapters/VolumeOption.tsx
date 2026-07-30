import type { ChapterLink } from '~/types'
import { toggleChapterSelection, toggleVolumeSelection } from '~/components/chapters/selection'
import '~/components/chapters/VolumeOption.css'

interface VolumeOptionProps {
  title: string
  chapters: ChapterLink[]
  selectedUrls: Set<string>
  onChange: (selectedUrls: Set<string>) => void
}

export function VolumeOption({ title, chapters, selectedUrls, onChange }: VolumeOptionProps) {
  const selectedCount = chapters.filter((chapter) => selectedUrls.has(chapter.url)).length

  function toggleChapter(url: string) {
    onChange(toggleChapterSelection(selectedUrls, url))
  }

  function toggleVolume() {
    onChange(toggleVolumeSelection(selectedUrls, chapters))
  }

  return (
    <details className="volume-option">
      <summary>
        <input
          type="checkbox"
          checked={selectedCount === chapters.length}
          ref={(element) => {
            if (element) element.indeterminate = selectedCount > 0 && selectedCount < chapters.length
          }}
          onClick={(event) => event.stopPropagation()}
          onChange={toggleVolume}
        />
        <span className="volume-title" title={title}>{title}</span>
        <span className="volume-count">{selectedCount}/{chapters.length}</span>
      </summary>
      <div className="chapter-list">
        {chapters.map((chapter, index) => (
          <label className="chapter-option" key={chapter.url}>
            <input
              type="checkbox"
              checked={selectedUrls.has(chapter.url)}
              onChange={() => toggleChapter(chapter.url)}
            />
            <span className="chapter-number">{index + 1}</span>
            <span title={chapter.title}>{chapter.title}</span>
          </label>
        ))}
      </div>
    </details>
  )
}
