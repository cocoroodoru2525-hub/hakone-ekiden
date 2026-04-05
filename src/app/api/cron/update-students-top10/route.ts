import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { scrapeStudentsTop10 } from '@/lib/scrapers/students-top10-scraper'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const adminKey = request.headers.get('x-admin-key')

  // CronまたはAdmin両方から呼べるように
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin = adminKey === process.env.ADMIN_SECRET
  if (!isCron && !isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const records = await scrapeStudentsTop10()

    if (records.length === 0) {
      return Response.json({ error: 'スクレイピング結果が0件でした' }, { status: 500 })
    }

    // 既存データを全削除して入れ直し
    await supabaseAdmin.from('hk_students_top10').delete().neq('id', 0)

    const { error } = await supabaseAdmin.from('hk_students_top10').insert(
      records.map(r => ({ ...r, updated_at: new Date().toISOString() }))
    )

    if (error) throw new Error(error.message)

    return Response.json({ success: true, count: records.length, records })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
