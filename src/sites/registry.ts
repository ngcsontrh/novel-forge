import { hakoSite } from '~/hako'
import type { SiteAdapter } from '~/sites/types'

const sites: readonly SiteAdapter[] = [hakoSite]

export function findSiteForBookUrl(value: string): SiteAdapter | undefined {
  return sites.find((site) => site.supportsBookUrl(value))
}

export function requireSiteForBookUrl(value: string): SiteAdapter {
  const site = findSiteForBookUrl(value)
  if (!site) throw new Error('URL này chưa được hỗ trợ.')
  return site
}

export function isSupportedBookUrl(value: string) {
  return Boolean(findSiteForBookUrl(value))
}

export function normalizeSupportedBookUrl(value: string) {
  return requireSiteForBookUrl(value).normalizeBookUrl(value)
}
