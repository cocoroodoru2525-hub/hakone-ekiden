export interface StudentRecord {
  event_type: string
  rank: number
  athlete_name: string
  school: string
  time_display: string
  time_seconds: number
  competition_date: string
}

/** 「MM分SS秒cs」形式を秒に変換 */
function parseTime(min: string, sec: string, cs: string): number {
  return Math.round(parseInt(min) * 60 + parseInt(sec) + (cs ? parseInt(cs) / 100 : 0))
}

/** 「MM分SS秒cs」形式を表示用文字列に変換 */
function formatTime(min: string, sec: string, cs: string): string {
  const m = min.padStart(2, '0')
  const s = sec.padStart(2, '0')
  return cs ? `${m}:${s}.${cs}` : `${m}:${s}`
}

/** HTML タグを除去 */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

// 種目ごとの有効時間範囲（秒）
const TIME_RANGE: Record<string, [number, number]> = {
  '5000':  [12 * 60, 16 * 60],
  '10000': [26 * 60, 32 * 60],
  'half':  [58 * 60, 70 * 60],
}

export async function scrapeStudentsTop10(): Promise<StudentRecord[]> {
  // Shift_JIS ページを正しくデコード
  const res = await fetch('https://rokuroman.sakura.ne.jp/gakuseirekidai.html', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HakoneFanBot/1.0)' },
    cache: 'no-store',
  })
  const buf = await res.arrayBuffer()
  const decoder = new TextDecoder('shift_jis')
  const html = decoder.decode(buf)

  const results: StudentRecord[] = []

  // 各種目のセクション定義
  const sections = [
    { key: '5000',  marker: '5000ｍ</b>' },
    { key: '10000', marker: '10000ｍ</b>' },
    { key: 'half',  marker: 'ハーフマラソン</b>' },
  ]

  // データ行のパターン: 「順位　MM分SS秒[cs]　選手名　YYYY年M月D日　学校名」
  const linePattern = /(\d+)[\u3000\s]+(\d+)分(\d+)秒(\d*)[\u3000\s]+([^\u3000\n\r<]+?)[\u3000\s]+(\d{4}年\d+月\d+日)[\u3000\s]+([^\u3000\n\r<]+)/g

  for (const section of sections) {
    const startIdx = html.indexOf(section.marker)
    if (startIdx < 0) continue

    // 次のセクションまでを抽出
    let endIdx = html.length
    for (const other of sections) {
      if (other.key === section.key) continue
      const otherIdx = html.indexOf(other.marker)
      if (otherIdx > startIdx && otherIdx < endIdx) endIdx = otherIdx
    }

    // セクションのHTMLを取得し、タグを除去
    const sectionHtml = html.substring(startIdx, endIdx)
    const sectionText = stripTags(sectionHtml)

    linePattern.lastIndex = 0
    let match: RegExpExecArray | null
    const seen = new Set<number>()

    while ((match = linePattern.exec(sectionText)) !== null) {
      const [, rankStr, min, sec, cs, name, date, school] = match
      const rank = parseInt(rankStr)
      if (rank < 1 || rank > 10 || seen.has(rank)) continue
      seen.add(rank)

      const time_seconds = parseTime(min, sec, cs)
      const [minSec, maxSec] = TIME_RANGE[section.key]
      if (time_seconds < minSec || time_seconds > maxSec) continue

      const time_display = formatTime(min, sec, cs)

      results.push({
        event_type: section.key,
        rank,
        athlete_name: name.trim(),
        school: school.trim(),
        time_display,
        time_seconds,
        competition_date: date,
      })
    }
  }

  // 種目・順位でソート
  results.sort((a, b) => {
    const order = ['half', '10000', '5000']
    const eOrd = order.indexOf(a.event_type) - order.indexOf(b.event_type)
    return eOrd !== 0 ? eOrd : a.rank - b.rank
  })

  return results
}
