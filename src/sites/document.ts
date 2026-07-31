export function text(document: Document, selectors: string[]) {
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.textContent?.trim()
    if (value) return value.replace(/\s+/g, ' ')
  }
  return ''
}

export function firstElement(document: Document, selectors: string[]) {
  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (element) return element
  }
  return null
}

export function absoluteUrl(value: string | null | undefined, base: string) {
  if (!value) return undefined
  try {
    return new URL(value, base).href
  } catch {
    return undefined
  }
}

export function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, 'text/html')
}
