interface RenderedPageResponse {
  html?: string
  error?: string
}

export async function fetchRenderedHtml(url: string, readySelector: string) {
  const response = await chrome.runtime.sendMessage<
    { type: 'fetch-rendered-page', url: string, readySelector: string },
    RenderedPageResponse
  >({
    type: 'fetch-rendered-page',
    url,
    readySelector,
  })

  if (response.error) throw new Error(response.error)
  if (!response.html) throw new Error(`Không đọc được nội dung đã render từ ${url}`)
  return response.html
}

export async function fetchRenderedImageDataUrl(url: string) {
  const response = await chrome.runtime.sendMessage<
    { type: 'fetch-rendered-image', url: string },
    { dataUrl?: string, error?: string }
  >({
    type: 'fetch-rendered-image',
    url,
  })

  if (response.error) throw new Error(response.error)
  if (!response.dataUrl) throw new Error(`Không đọc được ảnh đã render từ ${url}`)
  return response.dataUrl
}
