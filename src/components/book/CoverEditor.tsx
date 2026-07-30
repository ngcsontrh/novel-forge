import '~/components/book/CoverEditor.css'

interface CoverEditorProps {
  coverUrl?: string
  onChange: (coverUrl: string | undefined) => void
  onError: (message: string) => void
}

const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function CoverEditor({ coverUrl, onChange, onError }: CoverEditorProps) {
  function upload(file: File | undefined) {
    if (!file) return
    if (!COVER_TYPES.includes(file.type)) {
      onError('Ảnh bìa phải là JPEG, PNG, WebP hoặc GIF.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result)
        onError('')
      }
    }
    reader.onerror = () => onError('Không đọc được tệp ảnh bìa.')
    reader.readAsDataURL(file)
  }

  return (
    <div className="cover-editor">
      <div className="cover-preview">
        {coverUrl
          ? <img src={coverUrl} alt="Ảnh bìa truyện" />
          : <span>Chưa có<br />ảnh bìa</span>}
      </div>
      <div className="cover-controls">
        <strong>Ảnh bìa</strong>
        <p>Ảnh từ website được dùng mặc định. Bạn có thể thay bằng ảnh từ máy.</p>
        <label className="cover-upload">
          Chọn ảnh mới
          <input
            type="file"
            accept={COVER_TYPES.join(',')}
            onChange={(event) => {
              upload(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
        {coverUrl && (
          <button type="button" className="cover-remove" onClick={() => onChange(undefined)}>
            Xóa ảnh
          </button>
        )}
      </div>
    </div>
  )
}
