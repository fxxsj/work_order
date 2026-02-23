export function getFilenameFromContentDisposition(
  value: string | undefined | null
): string | null {
  if (!value) return null

  // RFC 5987: filename*=UTF-8''%E4%B8%AD%E6%96%87.xlsx
  const filenameStar = value.match(/filename\*\s*=\s*([^;]+)/i)?.[1]?.trim()
  if (filenameStar) {
    const parts = filenameStar.split("''")
    const encoded = parts.length === 2 ? parts[1] : filenameStar
    const cleaned = encoded.replace(/^"+|"+$/g, '')
    try {
      return decodeURIComponent(cleaned)
    } catch {
      return cleaned
    }
  }

  const filename = value.match(/filename\s*=\s*([^;]+)/i)?.[1]?.trim()
  if (!filename) return null
  return filename.replace(/^"+|"+$/g, '')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    URL.revokeObjectURL(url)
  }
}

