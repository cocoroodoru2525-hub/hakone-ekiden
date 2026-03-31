import { parse } from 'node-html-parser'
import { parseTime } from '../time-utils'

export interface ScrapedCompetitionResult {
  rank: number | null
  athlete_name: string
  team_name: string
  time_display: string
  time_seconds: number
}

/**
 * 文字エンコーディングを検出してデコード
 */
async function fetchWithEncoding(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'HakoneEkidenFanSite/1.0 (educational purpose)',
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }

  const contentType = res.headers.get('content-type') || ''

  // Content-Typeからcharsetを検出
  const charsetMatch = contentType.match(/charset=([^\s;]+)/i)
  const charset = charsetMatch ? charsetMatch[1].toLowerCase() : null

  if (charset && charset !== 'utf-8' && charset !== 'utf8') {
    const buffer = await res.arrayBuffer()
    const decoder = new TextDecoder(charset)
    return decoder.decode(buffer)
  }

  const html = await res.text()

  // HTMLのmeta charsetから検出（Content-Typeにない場合）
  const metaMatch = html.match(/<meta[^>]+charset=["']?([^"'\s>]+)/i)
  if (metaMatch) {
    const metaCharset = metaMatch[1].toLowerCase()
    if (metaCharset !== 'utf-8' && metaCharset !== 'utf8') {
      // 再取得して正しいエンコーディングでデコード
      const res2 = await fetch(url, {
        headers: { 'User-Agent': 'HakoneEkidenFanSite/1.0 (educational purpose)' },
      })
      const buffer = await res2.arrayBuffer()
      const decoder = new TextDecoder(metaCharset)
      return decoder.decode(buffer)
    }
  }

  return html
}

function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\u3000/g, ' ')
    .trim()
}

/**
 * 大会結果ページをスクレイピング
 *
 * テーブルのカラム構成を自動検出して解析する。
 * 一般的なカラム: 順位, 選手名, 所属, 記録 など
 */
export async function scrapeCompetitionResults(
  url: string
): Promise<ScrapedCompetitionResult[]> {
  const html = await fetchWithEncoding(url)
  const root = parse(html)
  const results: ScrapedCompetitionResult[] = []

  const tables = root.querySelectorAll('table')

  for (const table of tables) {
    const rows = table.querySelectorAll('tr')
    if (rows.length < 2) continue

    // ヘッダー行からカラムを推測
    const headerRow = rows[0]
    const headers = headerRow.querySelectorAll('th, td').map(cell => cleanText(cell.innerHTML))

    // カラムインデックスを検出
    let rankIdx = -1, nameIdx = -1, teamIdx = -1, timeIdx = -1

    for (let i = 0; i < headers.length; i++) {
      const h = headers[i]
      if (/順位|着順|順/.test(h) && rankIdx === -1) rankIdx = i
      else if (/氏名|選手|名前/.test(h) && nameIdx === -1) nameIdx = i
      else if (/所属|チーム|大学|学校/.test(h) && teamIdx === -1) teamIdx = i
      else if (/記録|タイム|時間|結果/.test(h) && timeIdx === -1) timeIdx = i
    }

    // 最低限、選手名と記録のカラムが見つからなければスキップ
    if (nameIdx === -1 || timeIdx === -1) continue

    // データ行を解析
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td')
      if (cells.length <= Math.max(nameIdx, timeIdx)) continue

      const athleteName = cleanText(cells[nameIdx].innerHTML)
      const timeStr = cleanText(cells[timeIdx].innerHTML)
      const teamName = teamIdx >= 0 && cells.length > teamIdx
        ? cleanText(cells[teamIdx].innerHTML)
        : ''
      const rankStr = rankIdx >= 0 && cells.length > rankIdx
        ? cleanText(cells[rankIdx].innerHTML)
        : ''

      if (!athleteName || !timeStr) continue

      const parsed = parseTime(timeStr)
      if (!parsed) continue

      const rank = rankStr ? Number(rankStr.replace(/[^0-9]/g, '')) || null : null

      results.push({
        rank,
        athlete_name: athleteName,
        team_name: teamName,
        time_display: parsed.display,
        time_seconds: parsed.seconds,
      })
    }
  }

  return results
}
