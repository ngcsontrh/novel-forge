export function safeFilename(title: string) {
  return `${title.replace(/[<>:"/\\|?*\p{Cc}]/gu, '').trim() || 'truyen'}.epub`
}
