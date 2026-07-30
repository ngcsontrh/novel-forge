import assert from 'node:assert/strict'
import test from 'node:test'
import { crawlChapters } from '~/services/chapterCrawler'
import type { SiteAdapter } from '~/sites'

test('crawls selected chapters in order and reports progress', async () => {
  const visited: string[] = []
  const progress: string[] = []
  const site: SiteAdapter = {
    id: 'test-site',
    defaultCrawlDelayMs: 0,
    supportsBookUrl: () => true,
    normalizeBookUrl: (value) => value,
    readBook: async () => { throw new Error('Not used in this test') },
    readChapter: async (chapter) => {
      visited.push(chapter.url)
      return { ...chapter, content: `<p>${chapter.title}</p>` }
    },
  }
  const chapters = [
    { title: 'One', url: 'https://example.test/1', volumeTitle: 'Volume' },
    { title: 'Two', url: 'https://example.test/2', volumeTitle: 'Volume' },
  ]

  const result = await crawlChapters(site, chapters, 0, (completed, total, chapter) => {
    progress.push(`${completed}/${total}:${chapter.url}`)
  })

  assert.deepEqual(visited, chapters.map((chapter) => chapter.url))
  assert.deepEqual(progress, [
    '0/2:https://example.test/1',
    '1/2:https://example.test/2',
  ])
  assert.deepEqual(result.map((chapter) => chapter.content), ['<p>One</p>', '<p>Two</p>'])
})
