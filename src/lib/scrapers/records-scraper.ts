import { parse } from 'node-html-parser'
import { parseTime } from '../time-utils'

export interface ScrapedRecord {
  athlete_name: string
  team_name: string
  event_type: string
  time_display: string
  time_seconds: number
  grade: number | null
  competition_name: string
  competed_at: string | null
}

const EVENT_URLS: Record<string, string> = {
  '5000m': 'https://ekidenreki.com/daigaku/best1/',
  '10000m': 'https://ekidenreki.com/daigaku/best2/',
  'half': 'https://ekidenreki.com/daigaku/best3/',
}

/**
 * 学年文字列から数値を取得 ("3年生" → 3)
 */
function parseGrade(text: string): number | null {
  const m = text.match(/(\d)年/)
  return m ? Number(m[1]) : null
}

/**
 * 大会名と日付を分離 ("日体大記録会10000m（2024-04-22）" → { name, date })
 */
function parseCompetition(text: string): { name: string; date: string | null } {
  const m = text.match(/^(.+?)(?:[（(](\d{4}-\d{2}-\d{2})[）)])?$/)
  if (m) {
    return { name: m[1].trim(), date: m[2] || null }
  }
  return { name: text.trim(), date: null }
}

/**
 * HTMLからテキストを取得しつつ全角スペースやHTML実体参照を処理
 */
function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\u3000/g, ' ')
    .trim()
}

/**
 * ekidenreki.com から指定種目のPBランキングをスクレイピング
 */
export async function scrapeEventRecords(eventType: string): Promise<ScrapedRecord[]> {
  const url = EVENT_URLS[eventType]
  if (!url) throw new Error(`Unknown event type: ${eventType}`)

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'HakoneEkidenFanSite/1.0 (educational purpose)',
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }

  const html = await res.text()
  const root = parse(html)
  const records: ScrapedRecord[] = []

  // テーブル内の全行を走査
  const rows = root.querySelectorAll('table tr')

  for (const row of rows) {
    const cells = row.querySelectorAll('td')
    if (cells.length < 5) continue

    // カラム: 順位, タイム, 選手名, 学年, 所属, 大会
    const timeStr = cleanText(cells[1].innerHTML)
    const athleteName = cleanText(cells[2].innerHTML)
    const gradeStr = cleanText(cells[3].innerHTML)
    const teamName = cleanText(cells[4].innerHTML)
    const compStr = cells.length > 5 ? cleanText(cells[5].innerHTML) : ''

    if (!athleteName || !timeStr) continue

    const parsed = parseTime(timeStr)
    if (!parsed) continue

    const grade = parseGrade(gradeStr)
    const comp = parseCompetition(compStr)

    records.push({
      athlete_name: athleteName,
      team_name: teamName,
      event_type: eventType,
      time_display: parsed.display,
      time_seconds: parsed.seconds,
      grade,
      competition_name: comp.name,
      competed_at: comp.date,
    })
  }

  return records
}

/**
 * 全種目（5000m, 10000m, half）のPBランキングを一括取得
 * 1秒間隔でリクエスト
 */
export async function scrapeAllEventRecords(): Promise<ScrapedRecord[]> {
  const all: ScrapedRecord[] = []
  const events = ['5000m', '10000m', 'half']

  for (const event of events) {
    try {
      const records = await scrapeEventRecords(event)
      all.push(...records)
    } catch (e) {
      console.error(`Failed to scrape ${event}:`, e)
    }
    // 1秒待機
    await new Promise(r => setTimeout(r, 1000))
  }

  return all
}

/**
 * 指定チームの選手だけをフィルタ
 */
export function filterByTeam(records: ScrapedRecord[], teamName: string): ScrapedRecord[] {
  return records.filter(r =>
    r.team_name.includes(teamName) || teamName.includes(r.team_name)
  )
}

/**
 * 3年生以下のみをフィルタ（4年生を除外 - 来年卒業のため）
 */
export function filterEligible(records: ScrapedRecord[]): ScrapedRecord[] {
  return records.filter(r => r.grade !== null && r.grade <= 3)
}
