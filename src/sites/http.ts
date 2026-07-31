export async function fetchHtml(url: string) {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error(`Không tải được ${url} (HTTP ${response.status})`)
  return response.text()
}
