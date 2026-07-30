import { cleanBookUrl, isSupportedBookUrl } from '~/config'

chrome.action.onClicked.addListener(async (tab) => {
  const sourceUrl = tab.url && isSupportedBookUrl(tab.url)
    ? cleanBookUrl(tab.url)
    : ''
  const pageUrl = new URL(chrome.runtime.getURL('index.html'))
  if (sourceUrl) pageUrl.searchParams.set('source', sourceUrl)
  await chrome.tabs.create({ url: pageUrl.href })
})
