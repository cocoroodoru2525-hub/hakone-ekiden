import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { scrapeCompetitionResults } from '@/lib/scrapers/competition-scraper'
import { insertRecordWithPB } from '@/lib/pb-detector'
import { findOrCreateAthlete } from '@/lib/find-or-create-athlete'
import { findOrCreateTeam } from '@/lib/find-or-create-team'

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { url, eventType, competitionName, competedAt, autoCreate } = body as {
      url: string
      eventType: string
      competitionName: string
      competedAt: string
      autoCreate?: boolean
    }

    if (!url || !eventType || !competitionName) {
      return Response.json({ error: 'url, eventType, competitionName are required' }, { status: 400 })
    }

    // 全チームを取得
    const { data: teams } = await supabaseAdmin
      .from('hk_teams')
      .select('id, name, short_name')

    if (!teams) {
      return Response.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    // 大会結果をスクレイピング
    const results = await scrapeCompetitionResults(url)

    let inserted = 0
    let skipped = 0
    let pbUpdated = 0
    let athletesCreated = 0
    let teamsCreated = 0
    const errors: string[] = []
    const originalTeamIds = new Set(teams.map(t => t.id))

    for (const res of results) {
      // チームマッチング（見つからなければ自動作成）
      const team = res.team_name
        ? await findOrCreateTeam(supabaseAdmin, teams, res.team_name)
        : null

      if (!team) {
        skipped++
        continue
      }
      if (!originalTeamIds.has(team.id)) {
        originalTeamIds.add(team.id)
        teamsCreated++
      }

      // 選手を検索（autoCreate時は自動作成）
      const athlete = await findOrCreateAthlete(
        supabaseAdmin, res.athlete_name, team.id,
        { autoCreate: autoCreate ?? false }
      )

      if (!athlete) {
        skipped++
        continue
      }
      if (athlete.created) athletesCreated++

      const result = await insertRecordWithPB(supabaseAdmin, {
        athlete_id: athlete.id,
        event_type: eventType,
        time_seconds: res.time_seconds,
        time_display: res.time_display,
        competition_name: competitionName,
        competed_at: competedAt || null,
        year: new Date().getFullYear(),
      })

      if (result.inserted) {
        inserted++
        if (result.isPB) pbUpdated++
      } else if (result.error) {
        errors.push(`${res.athlete_name}: ${result.error}`)
      } else {
        skipped++
      }
    }

    await supabaseAdmin.from('hk_scrape_logs').insert({
      scrape_type: 'competition',
      source_url: url,
      status: errors.length > 0 ? 'partial' : 'success',
      inserted_count: inserted,
      updated_count: pbUpdated,
      error_message: errors.length > 0 ? errors.slice(0, 10).join('\n') : null,
      raw_log: { totalScraped: results.length, skipped, athletesCreated, teamsCreated, competitionName, eventType },
    })

    return Response.json({
      success: true,
      totalScraped: results.length,
      inserted,
      pbUpdated,
      skipped,
      athletesCreated,
      teamsCreated,
      errors: errors.slice(0, 20),
    })
  } catch (e: any) {
    try {
      await supabaseAdmin.from('hk_scrape_logs').insert({
        scrape_type: 'competition',
        source_url: 'unknown',
        status: 'error',
        inserted_count: 0,
        updated_count: 0,
        error_message: e.message,
      })
    } catch { /* ignore logging error */ }

    return Response.json({ error: e.message }, { status: 500 })
  }
}
