import { cleanBookUrl, isSupportedBookUrl } from '~/config'

const OBJECT_URL_LIFETIME_MS = 60_000

export async function findInitialBookUrl() {
  const querySource = new URLSearchParams(window.location.search).get('source')
  const [tabs, { lastUrl }] = await Promise.all([
    chrome.tabs.query({ active: true, currentWindow: true }),
    chrome.storage.local.get('lastUrl'),
  ])
  const activeUrl = tabs[0]?.url

  if (querySource && isSupportedBookUrl(querySource)) return cleanBookUrl(querySource)
  if (activeUrl && isSupportedBookUrl(activeUrl)) return cleanBookUrl(activeUrl)
  return typeof lastUrl === 'string' ? lastUrl : ''
}

export async function rememberBookUrl(sourceUrl: string) {
  await chrome.storage.local.set({ lastUrl: sourceUrl })
}

export async function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  try {
    await chrome.downloads.download({ url, filename, saveAs: true })
  } catch (reason) {
    URL.revokeObjectURL(url)
    throw reason
  }
  window.setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_LIFETIME_MS)
}
