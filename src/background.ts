import { cleanBookUrl, isSupportedBookUrl } from '~/config'

const RENDER_TIMEOUT_MS = 45_000
const RENDER_POLL_MS = 500
const RENDERABLE_PAGE_HOSTS = new Set([
  'ln.hako.vn',
  'docln.sbs',
  'uukanshu.cc',
  'www.uukanshu.cc',
])
const RENDERABLE_IMAGE_HOSTS = new Set([
  'i.hako.vip',
  'i2.hako.vip',
  'cdn.phototourl.com',
  'image.uukanshu.cc',
])
let loaderTabId: number | undefined

chrome.action.onClicked.addListener(async (tab) => {
  const sourceUrl = tab.url && isSupportedBookUrl(tab.url)
    ? cleanBookUrl(tab.url)
    : ''
  const pageUrl = new URL(chrome.runtime.getURL('index.html'))
  if (sourceUrl) pageUrl.searchParams.set('source', sourceUrl)
  await chrome.tabs.create({ url: pageUrl.href })
})

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (isRenderedHtmlRequest(message)) {
    void loadRenderedHtml(message.url, message.readySelector)
      .then((html) => sendResponse({ html }))
      .catch((reason: unknown) => sendResponse({ error: errorMessage(reason) }))
    return true
  }

  if (isRenderedImageRequest(message)) {
    void loadRenderedImage(message.url)
      .then((dataUrl) => sendResponse({ dataUrl }))
      .catch((reason: unknown) => sendResponse({ error: errorMessage(reason) }))
    return true
  }

  if (isReleaseResourceLoaderRequest(message)) {
    void releaseLoaderTab().then(() => sendResponse({}))
    return true
  }
})

function isRenderedHtmlRequest(
  message: unknown,
): message is { type: 'load-rendered-html', url: string, readySelector: string } {
  if (!message || typeof message !== 'object') return false
  const value = message as Record<string, unknown>
  if (
    value.type !== 'load-rendered-html'
    || typeof value.url !== 'string'
    || typeof value.readySelector !== 'string'
  ) return false

  try {
    const url = new URL(value.url)
    return url.protocol === 'https:' && RENDERABLE_PAGE_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

function isRenderedImageRequest(message: unknown): message is { type: 'load-rendered-image', url: string } {
  if (!message || typeof message !== 'object') return false
  const value = message as Record<string, unknown>
  if (value.type !== 'load-rendered-image' || typeof value.url !== 'string') return false

  try {
    const url = new URL(value.url)
    return url.protocol === 'https:' && RENDERABLE_IMAGE_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

function isReleaseResourceLoaderRequest(message: unknown) {
  return Boolean(
    message
    && typeof message === 'object'
    && (message as Record<string, unknown>).type === 'release-resource-loader',
  )
}

async function loadRenderedHtml(url: string, readySelector: string) {
  const tabId = await navigateLoaderTab(url)
  const deadline = Date.now() + RENDER_TIMEOUT_MS
  while (Date.now() < deadline) {
    const result = await inspectTab(tabId, readySelector).catch(() => undefined)
    if (result?.ready && result.html) return result.html
    await wait(RENDER_POLL_MS)
  }
  throw new Error(
    'Trang nguồn chưa tải xong sau 45 giây. Hãy mở URL trong tab thường, hoàn tất bước xác minh nếu có rồi thử lại.',
  )
}

async function loadRenderedImage(url: string) {
  const tabId = await navigateLoaderTab(url)
  const deadline = Date.now() + RENDER_TIMEOUT_MS
  while (Date.now() < deadline) {
    const result = await inspectImageTab(tabId).catch(() => undefined)
    if (result?.dataUrl) return result.dataUrl
    await wait(RENDER_POLL_MS)
  }
  throw new Error('Không tải được ảnh nguồn sau 45 giây.')
}

async function navigateLoaderTab(url: string) {
  if (loaderTabId !== undefined) {
    try {
      await chrome.tabs.update(loaderTabId, { url, active: false })
      return loaderTabId
    } catch {
      loaderTabId = undefined
    }
  }

  const tab = await chrome.tabs.create({ url, active: false })
  if (tab.id === undefined) throw new Error('Không thể tạo tab nền để tải tài nguyên.')
  loaderTabId = tab.id
  return tab.id
}

async function releaseLoaderTab() {
  const tabId = loaderTabId
  loaderTabId = undefined
  if (tabId !== undefined) {
    await chrome.tabs.remove(tabId).catch(() => undefined)
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
