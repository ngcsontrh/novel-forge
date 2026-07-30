interface RenderedResourceResponse {
  html?: string
  error?: string
}

export async function loadRenderedHtml(url: string, readySelector: string) {
  const response = await chrome.runtime.sendMessage<
    { type: 'load-rendered-html', url: string, readySelector: string },
    RenderedResourceResponse
  >({
    type: 'load-rendered-html',
    url,
    readySelector,
  })

  if (response.error) throw new Error(response.error)
  if (!response.html) throw new Error(`Không đọc được nội dung đã render từ ${url}`)
  return response.html
}

export async function loadRenderedImage(url: string) {
  const response = await chrome.runtime.sendMessage<
    { type: 'load-rendered-image', url: string },
    { dataUrl?: string, error?: string }
  >({
    type: 'load-rendered-image',
    url,
  })

  if (response.error) throw new Error(response.error)
  if (!response.dataUrl) throw new Error(`Không đọc được ảnh đã render từ ${url}`)
  return response.dataUrl
}

export async function releaseResourceLoader() {
  await chrome.runtime.sendMessage({ type: 'release-resource-loader' })
}
