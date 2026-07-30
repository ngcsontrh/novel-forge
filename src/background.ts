import { cleanBookUrl, isSupportedBookUrl } from '~/config'

const RENDER_TIMEOUT_MS = 45_000
const RENDER_POLL_MS = 500
const UUKANSHU_HOSTS = new Set(['uukanshu.cc', 'www.uukanshu.cc'])

chrome.action.onClicked.addListener(async (tab) => {
  const sourceUrl = tab.url && isSupportedBookUrl(tab.url)
    ? cleanBookUrl(tab.url)
    : ''
  const pageUrl = new URL(chrome.runtime.getURL('index.html'))
  if (sourceUrl) pageUrl.searchParams.set('source', sourceUrl)
  await chrome.tabs.create({ url: pageUrl.href })
})

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (isRenderedPageRequest(message)) {
    void readRenderedPage(message.url, message.readySelector)
      .then((html) => sendResponse({ html }))
      .catch((reason: unknown) => sendResponse({ error: errorMessage(reason) }))
    return true
  }

  if (isRenderedImageRequest(message)) {
    void readRenderedImage(message.url)
      .then((dataUrl) => sendResponse({ dataUrl }))
      .catch((reason: unknown) => sendResponse({ error: errorMessage(reason) }))
    return true
  }
})

function isRenderedPageRequest(
  message: unknown,
): message is { type: 'fetch-rendered-page', url: string, readySelector: string } {
  if (!message || typeof message !== 'object') return false
  const value = message as Record<string, unknown>
  if (
    value.type !== 'fetch-rendered-page'
    || typeof value.url !== 'string'
    || typeof value.readySelector !== 'string'
  ) return false

  try {
    const url = new URL(value.url)
    return url.protocol === 'https:' && UUKANSHU_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

function isRenderedImageRequest(message: unknown): message is { type: 'fetch-rendered-image', url: string } {
  if (!message || typeof message !== 'object') return false
  const value = message as Record<string, unknown>
  if (value.type !== 'fetch-rendered-image' || typeof value.url !== 'string') return false

  try {
    const url = new URL(value.url)
    return url.protocol === 'https:' && url.hostname === 'image.uukanshu.cc'
  } catch {
    return false
  }
}

async function readRenderedPage(url: string, readySelector: string) {
  const tab = await chrome.tabs.create({ url, active: false })
  if (tab.id === undefined) throw new Error('Không thể tạo tab nền để tải UU看書.')

  try {
    const deadline = Date.now() + RENDER_TIMEOUT_MS
    while (Date.now() < deadline) {
      const result = await inspectTab(tab.id, readySelector).catch(() => undefined)
      if (result?.ready && result.html) return result.html
      await wait(RENDER_POLL_MS)
    }
    throw new Error(
      'UU看書 chưa vượt qua được Cloudflare sau 45 giây. Hãy mở URL trong tab thường, hoàn tất kiểm tra rồi thử lại.',
    )
  } finally {
    await chrome.tabs.remove(tab.id).catch(() => undefined)
  }
}

async function readRenderedImage(url: string) {
  const tab = await chrome.tabs.create({ url, active: false })
  if (tab.id === undefined) throw new Error('Không thể tạo tab nền để tải ảnh bìa UU看書.')

  try {
    const deadline = Date.now() + RENDER_TIMEOUT_MS
    while (Date.now() < deadline) {
      const result = await inspectImageTab(tab.id).catch(() => undefined)
      if (result?.dataUrl) return result.dataUrl
      await wait(RENDER_POLL_MS)
    }
    throw new Error('Không tải được ảnh bìa UU看書 sau 45 giây.')
  } finally {
    await chrome.tabs.remove(tab.id).catch(() => undefined)
  }
}

async function inspectTab(tabId: number, readySelector: string) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: (selector: string) => ({
      ready: Boolean(document.querySelector(selector)),
      html: document.documentElement?.outerHTML ?? '',
    }),
    args: [readySelector],
  })
  return results[0]?.result
}

async function inspectImageTab(tabId: number) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const image = document.querySelector<HTMLImageElement>('img')
      if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return {}

      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) return {}
      context.drawImage(image, 0, 0)
      return { dataUrl: canvas.toDataURL('image/jpeg', 0.92) }
    },
  })
  return results[0]?.result
}

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Không thể tải tài nguyên qua tab nền.'
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds))
}
