import { isSupportedBookUrl, normalizeSupportedBookUrl } from '~/sites'

export const DEFAULT_CRAWL_DELAY_MS = 2500

export { isSupportedBookUrl }
export const cleanBookUrl = normalizeSupportedBookUrl
