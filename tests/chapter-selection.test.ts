import assert from 'node:assert/strict'
import test from 'node:test'
import {
  groupChaptersByVolume,
  toggleChapterSelection,
  toggleVolumeSelection,
} from '~/components/chapters/selection'
import type { ChapterLink } from '~/types'

const chapters: ChapterLink[] = [
  { title: 'Chương 1', url: 'chapter-1', volumeTitle: 'Volume 1' },
  { title: 'Chương 2', url: 'chapter-2', volumeTitle: 'Volume 1' },
  { title: 'Chương 3', url: 'chapter-3', volumeTitle: 'Volume 2' },
]

test('groups chapters by volume in display order', () => {
  const volumes = groupChaptersByVolume(chapters)

  assert.deepEqual(
    volumes.map((volume) => ({
      title: volume.title,
      chapters: volume.chapters.map((chapter) => chapter.url),
    })),
    [
      { title: 'Volume 1', chapters: ['chapter-1', 'chapter-2'] },
      { title: 'Volume 2', chapters: ['chapter-3'] },
    ],
  )
})

test('changes chapter and volume selections without mutating current state', () => {
  const current = new Set(['chapter-1'])
  const added = toggleChapterSelection(current, 'chapter-2')
  const removed = toggleChapterSelection(current, 'chapter-1')
  const selectedVolume = toggleVolumeSelection(current, chapters.slice(0, 2))
  const clearedVolume = toggleVolumeSelection(selectedVolume, chapters.slice(0, 2))

  assert.deepEqual([...current], ['chapter-1'])
  assert.deepEqual([...added], ['chapter-1', 'chapter-2'])
  assert.deepEqual([...removed], [])
  assert.deepEqual([...selectedVolume], ['chapter-1', 'chapter-2'])
  assert.deepEqual([...clearedVolume], [])
})
