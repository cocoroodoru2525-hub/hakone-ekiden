import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 最新の大会年度を取得
    const { data: latest } = await supabaseAdmin
      .from('hk_ekiden_results')
      .select('race_year')
      .order('race_year', { ascending: false })
      .limit(1)
      .single()

    if (!latest) {
      return Response.json({ error: '駅伝結果データがありません' }, { status: 400 })
    }

    const raceYear = latest.race_year

    // その年度の全結果を取得（team_idとtotal_rankのユニークな組み合わせ）
    const { data: results } = await supabaseAdmin
      .from('hk_ekiden_results')
      .select('team_id, total_rank')
      .eq('race_year', raceYear)
      .order('total_rank')

    if (!results || results.length === 0) {
      return Response.json({ error: `${raceYear}年の結果データがありません` }, { status: 400 })
    }

    // team_idごとにユニーク化（最初に出現した順位を使用）
    const teamRanks = new Map<number, number>()
    for (const r of results) {
      if (!teamRanks.has(r.team_id)) {
        teamRanks.set(r.team_id, r.total_rank)
      }
    }

    // sort_orderを更新
    let updated = 0
    for (const [teamId, rank] of teamRanks) {
      const { error } = await supabaseAdmin
        .from('hk_teams')
        .update({ sort_order: rank })
        .eq('id', teamId)

      if (!error) updated++
    }

    return Response.json({
      success: true,
      raceYear,
      updated,
      rankings: Array.from(teamRanks.entries()).map(([id, rank]) => ({ team_id: id, sort_order: rank })),
    })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
