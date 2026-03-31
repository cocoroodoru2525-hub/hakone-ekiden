import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { scrapeAllEventRecords } from '@/lib/scrapers/records-scraper'
import { insertRecordWithPB } from '@/lib/pb-detector'

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 全チームを取得
    const { data: teams } = await supabaseAdmin
      .from('hk_teams')
      .select('id, name, short_name')

    if (!teams) {
      return Response.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    // 全種目のPBランキングをスクレイピング
    const allRecords = await scrapeAllEventRecords()

    let inserted = 0
    let skipped = 0
    let pbUpdated = 0
    const errors: string[] = []

    for (const rec of allRecords) {
      // チームマッチング
      const team = teams.find(t =>
        rec.team_name.includes(t.short_name || t.name) ||
        (t.short_name || t.name).includes(rec.team_name) ||
        rec.team_name.includes(t.name) ||
        t.name.includes(rec.team_name)
      )
      if (!team) {
        skipped++
        continue
      }

      // 選手を検索
      const { data: athlete } = await supabaseAdmin
        .from('hk_athletes')
        .select('id')
        .eq('name', rec.athlete_name)
        .eq('team_id', team.id)
        .maybeSingle()

      if (!athlete) {
        skipped++
        continue
      }

      const result = await insertRecordWithPB(supabaseAdmin, {
        athlete_id: athlete.id,
        event_type: rec.event_type,
        time_seconds: rec.time_seconds,
        time_display: rec.time_display,
        competition_name: rec.competition_name,
        competed_at: rec.competed_at,
        year: new Date().getFullYear(),
      })

      if (result.inserted) {
        inserted++
        if (result.isPB) pbUpdated++
      } else if (result.error) {
        errors.push(`${rec.athlete_name}: ${result.error}`)
      } else {
        skipped++
      }
    }

    await supabaseAdmin.from('hk_scrape_logs').insert({
      scrape_type: 'records',
      source_url: 'ekidenreki.com',
      status: errors.length > 0 ? 'partial' : 'success',
      inserted_count: inserted,
      updated_count: pbUpdated,
      error_message: errors.length > 0 ? errors.slice(0, 10).join('\n') : null,
      raw_log: { totalScraped: allRecords.length, skipped },
    })

    return Response.json({
      success: true,
      totalScraped: allRecords.length,
      inserted,
      pbUpdated,
      skipped,
      errors: errors.slice(0, 20),
    })
  } catch (e: any) {
    try {
      await supabaseAdmin.from('hk_scrape_logs').insert({
        scrape_type: 'records',
        source_url: 'ekidenreki.com',
        status: 'error',
        inserted_count: 0,
        updated_count: 0,
        error_message: e.message,
      })
    } catch { /* ignore logging error */ }

    return Response.json({ error: e.message }, { status: 500 })
  }
}
