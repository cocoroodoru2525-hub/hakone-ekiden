import { ScrapedRecord, scrapeAllEventRecords, filterEligible } from './records-scraper'

export interface ScrapedAthlete {
  name: string
  team_name: string
  grade: number | null
  records: {
    event_type: string
    time_display: string
    time_seconds: number
    competition_name: string
    competed_at: string | null
  }[]
}

/**
 * ekidenreki.comのPBランキングから選手名簿を構築する
 *
 * 各種目のPBランキングから3年生以下の選手を抽出し、
 * 選手ごとにグルーピングして名簿として返す
 */
export async function scrapeRoster(teamNames: string[]): Promise<ScrapedAthlete[]> {
  // 全種目のPBランキングを取得
  const allRecords = await scrapeAllEventRecords()

  // 3年生以下のみ
  const eligible = filterEligible(allRecords)

  // 指定チームのみ
  const teamRecords = eligible.filter(r =>
    teamNames.some(tn => r.team_name.includes(tn) || tn.includes(r.team_name))
  )

  // 選手名+大学名でグルーピング
  const athleteMap = new Map<string, ScrapedAthlete>()

  for (const rec of teamRecords) {
    const key = `${rec.athlete_name}__${rec.team_name}`

    if (!athleteMap.has(key)) {
      athleteMap.set(key, {
        name: rec.athlete_name,
        team_name: rec.team_name,
        grade: rec.grade,
        records: [],
      })
    }

    const athlete = athleteMap.get(key)!
    // 同じ種目の重複を避ける
    if (!athlete.records.some(r => r.event_type === rec.event_type)) {
      athlete.records.push({
        event_type: rec.event_type,
        time_display: rec.time_display,
        time_seconds: rec.time_seconds,
        competition_name: rec.competition_name,
        competed_at: rec.competed_at,
      })
    }
  }

  return Array.from(athleteMap.values())
}
