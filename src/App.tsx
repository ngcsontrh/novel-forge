import '~/App.css'
import { BookMetadataForm } from '~/components/book'
import { ChapterSelector } from '~/components/chapters'
import { useBookWorkflow } from '~/hooks/useBookWorkflow'

function App() {
  const {
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
  } = useBookWorkflow()

  return (
    <main className="app">
      <header>
        <img className="mark" src="/icons/logo.png" alt="" />
        <div><h1>NovelForge</h1><p>Chọn chương, tùy chỉnh thông tin và xuất sách EPUB</p></div>
      </header>

      {(progress || error) && <div className={`status ${error ? 'error' : ''}`} aria-live="polite">
        {loading && <i />} {error || progress}
      </div>}

      <section className="card source">
        <label htmlFor="source">URL trang truyện</label>
        <div className="source-row">
          <input id="source" type="url" placeholder="Hako, UU看書 hoặc https://www.novel543.com/0410698823/" value={metadata.sourceUrl}
            onChange={(event) => updateMetadata('sourceUrl', event.target.value)} disabled={loading} />
          <button className="secondary" onClick={() => void inspect()} disabled={loading || !metadata.sourceUrl.trim()}>
            Đọc trang
          </button>
        </div>
      </section>

      <BookMetadataForm
        chapterCount={chapters.length}
        metadata={metadata}
        onChange={updateMetadata}
        onError={setError}
      />

      {chapters.length > 0 && (
        <ChapterSelector
          chapters={chapters}
          selectedUrls={selectedChapterUrls}
          onChange={setSelectedChapterUrls}
        />
      )}

      <button className="download" onClick={download} disabled={!ready}>
        <span>↓</span>{loading ? 'Đang xử lý…' : 'Tạo và tải EPUB'}
      </button>
      <p className="hint">Chỉ tải nội dung bạn có quyền sử dụng. Có thể chuyển tab trong lúc crawl, nhưng đừng đóng trang này.</p>
    </main>
  )
}

export default App
