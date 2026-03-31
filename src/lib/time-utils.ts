/**
 * 全角数字をASCIIに変換し、空白を除去
 */
function normalize(raw: string): string {
  return raw
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[\s\u3000]/g, '')
    .replace(/：/g, ':')
    .replace(/．/g, '.')
}

/**
 * 様々な形式の記録文字列を秒数とdisplay文字列に変換
 *
 * 対応形式:
 *   H:MM:SS     (1:01:47)  → ハーフマラソン
 *   HH:MM:SS    (01:01:47)
 *   MM:SS.ms    (27:54.31) → 5000m/10000m
 *   MM:SS       (27:54)
 *   M:SS.ms     (3:45.12)  → 1500mなど
 */
export function parseTime(raw: string): { seconds: number; display: string } | null {
  const s = normalize(raw)
  if (!s) return null

  // H:MM:SS or HH:MM:SS (hours present)
  const hms = s.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))?$/)
  if (hms) {
    const h = Number(hms[1])
    const m = Number(hms[2])
    const sec = Number(hms[3])
    const ms = hms[4] ? Number(hms[4]) / Math.pow(10, hms[4].length) : 0
    const total = h * 3600 + m * 60 + sec + ms
    const display = `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return { seconds: total, display }
  }

  // MM:SS.ms or MM:SS (no hours)
  const ms_match = s.match(/^(\d{1,2}):(\d{2})(?:\.(\d+))?$/)
  if (ms_match) {
    const m = Number(ms_match[1])
    const sec = Number(ms_match[2])
    const frac = ms_match[3] ? Number(ms_match[3]) / Math.pow(10, ms_match[3].length) : 0
    const total = m * 60 + sec + frac
    if (ms_match[3]) {
      return { seconds: total, display: `${m}:${String(sec).padStart(2, '0')}.${ms_match[3]}` }
    }
    return { seconds: total, display: `${m}:${String(sec).padStart(2, '0')}` }
  }

  return null
}

/**
 * 秒数をdisplay文字列に変換
 */
export function formatTimeDisplay(seconds: number, eventType: string): string {
  if (eventType === 'half') {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  // 5000m, 10000m
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const sec = Math.floor(s)
  const frac = Math.round((s - sec) * 100)
  if (frac > 0) {
    return `${m}:${String(sec).padStart(2, '0')}.${String(frac).padStart(2, '0')}`
  }
  return `${m}:${String(sec).padStart(2, '0')}`
}
