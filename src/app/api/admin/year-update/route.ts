import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 4年生を卒業（非アクティブ）にする
    const { data: graduated, error: gradError } = await supabaseAdmin
      .from('hk_athletes')
      .update({ is_active: false })
      .eq('grade', 4)
      .eq('is_active', true)
      .select('id, name')

    if (gradError) {
      return Response.json({ error: '卒業処理に失敗: ' + gradError.message }, { status: 500 })
    }

    // 3年生 → 4年生
    const { count: up3 } = await supabaseAdmin
      .from('hk_athletes')
      .update({ grade: 4 })
      .eq('grade', 3)
      .eq('is_active', true)

    // 2年生 → 3年生
    const { count: up2 } = await supabaseAdmin
      .from('hk_athletes')
      .update({ grade: 3 })
      .eq('grade', 2)
      .eq('is_active', true)

    // 1年生 → 2年生
    const { count: up1 } = await supabaseAdmin
      .from('hk_athletes')
      .update({ grade: 2 })
      .eq('grade', 1)
      .eq('is_active', true)

    await supabaseAdmin.from('hk_scrape_logs').insert({
      scrape_type: 'year_update',
      source_url: '-',
      status: 'success',
      inserted_count: 0,
      updated_count: (graduated?.length ?? 0) + (up3 ?? 0) + (up2 ?? 0) + (up1 ?? 0),
      raw_log: {
        graduated: graduated?.length ?? 0,
        graduatedNames: graduated?.map(a => a.name) ?? [],
        promotedFrom3: up3 ?? 0,
        promotedFrom2: up2 ?? 0,
        promotedFrom1: up1 ?? 0,
      },
    })

    return Response.json({
      success: true,
      graduated: graduated?.length ?? 0,
      graduatedNames: graduated?.map(a => a.name).slice(0, 30) ?? [],
      promotedFrom3: up3 ?? 0,
      promotedFrom2: up2 ?? 0,
      promotedFrom1: up1 ?? 0,
    })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
