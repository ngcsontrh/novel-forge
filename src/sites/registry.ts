import { hakoSite } from '~/sites/hako'
import { novel543Site } from '~/sites/novel543'
import { shuba69Site } from '~/sites/shuba69'
import type { SiteAdapter } from '~/sites/types'
import { uukanshuSite } from '~/sites/uukanshu'

const sites: readonly SiteAdapter[] = [hakoSite, uukanshuSite, novel543Site, shuba69Site]

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
