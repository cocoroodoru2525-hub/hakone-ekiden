import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { scrapeRoster } from '@/lib/scrapers/roster-scraper'
import { insertRecordWithPB } from '@/lib/pb-detector'

export async function POST(request: NextRequest) {
  // 認証チェック
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 全チーム名を取得
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('hk_teams')
      .select('id, name, short_name')
      .order('sort_order')

    if (teamsError || !teams) {
      return Response.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    const teamNames = teams.map(t => t.short_name || t.name)

    // 名簿スクレイピング
    const athletes = await scrapeRoster(teamNames)

    let inserted = 0
    let updated = 0
    let skipped = 0
    let recordsInserted = 0
    const errors: string[] = []

    for (const athlete of athletes) {
      // チーム名でマッチング
      const team = teams.find(t =>
        athlete.team_name.includes(t.short_name || t.name) ||
        (t.short_name || t.name).includes(athlete.team_name) ||
        athlete.team_name.includes(t.name) ||
        t.name.includes(athlete.team_name)
      )
      if (!team) {
        errors.push(`チーム不明: ${athlete.name} (${athlete.team_name})`)
        skipped++
        continue
      }

      // 既存選手を検索
      const { data: existing } = await supabaseAdmin
        .from('hk_athletes')
        .select('id')
        .eq('name', athlete.name)
        .eq('team_id', team.id)
        .maybeSingle()

      let athleteId: number

      if (existing) {
        athleteId = existing.id
        // 学年を更新
        if (athlete.grade) {
          await supabaseAdmin
            .from('hk_athletes')
            .update({ grade: athlete.grade })
            .eq('id', athleteId)
        }
        updated++
      } else {
        // 新規登録
        const { data: newAthlete, error: insertError } = await supabaseAdmin
          .from('hk_athletes')
          .insert({
            name: athlete.name,
            team_id: team.id,
            grade: athlete.grade,
          })
          .select('id')
          .single()

        if (insertError || !newAthlete) {
          errors.push(`登録失敗: ${athlete.name} - ${insertError?.message}`)
          skipped++
          continue
        }
        athleteId = newAthlete.id
        inserted++
      }

      // PB記録も登録
      for (const rec of athlete.records) {
        const result = await insertRecordWithPB(supabaseAdmin, {
          athlete_id: athleteId,
          event_type: rec.event_type,
          time_seconds: rec.time_seconds,
          time_display: rec.time_display,
          competition_name: rec.competition_name,
          competed_at: rec.competed_at,
          year: new Date().getFullYear(),
        })
        if (result.inserted) recordsInserted++
      }
    }

    // ログ記録
    await supabaseAdmin.from('hk_scrape_logs').insert({
      scrape_type: 'roster',
      source_url: 'ekidenreki.com',
      status: errors.length > 0 ? 'partial' : 'success',
      inserted_count: inserted,
      updated_count: updated,
      error_message: errors.length > 0 ? errors.slice(0, 10).join('\n') : null,
      raw_log: { total_athletes: athletes.length, skipped, recordsInserted },
    })

    return Response.json({
      success: true,
      inserted,
      updated,
      skipped,
      recordsInserted,
      totalScraped: athletes.length,
      errors: errors.slice(0, 20),
    })
  } catch (e: any) {
    // エラーログ
    try {
      await supabaseAdmin.from('hk_scrape_logs').insert({
        scrape_type: 'roster',
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
