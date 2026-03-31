import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { scrapeCompetitionResults } from '@/lib/scrapers/competition-scraper'
import { insertRecordWithPB } from '@/lib/pb-detector'

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { url, eventType, competitionName, competedAt } = body as {
      url: string
      eventType: string
      competitionName: string
      competedAt: string
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
    const errors: string[] = []

    for (const res of results) {
      // チームマッチング
      const team = res.team_name
        ? teams.find(t =>
            res.team_name.includes(t.short_name || t.name) ||
            (t.short_name || t.name).includes(res.team_name) ||
            res.team_name.includes(t.name) ||
            t.name.includes(res.team_name)
          )
        : null

      // 選手を検索（チームがわかれば絞り込み、わからなければ名前だけ）
      let athleteQuery = supabaseAdmin
        .from('hk_athletes')
        .select('id')
        .eq('name', res.athlete_name)

      if (team) {
        athleteQuery = athleteQuery.eq('team_id', team.id)
      }

      const { data: athlete } = await athleteQuery.maybeSingle()

      if (!athlete) {
        skipped++
        continue
      }

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
      raw_log: { totalScraped: results.length, skipped, competitionName, eventType },
    })

    return Response.json({
      success: true,
      totalScraped: results.length,
      inserted,
      pbUpdated,
      skipped,
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
