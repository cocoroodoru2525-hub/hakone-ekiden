import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { postToX } from '@/lib/x-poster'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: { event: string; success: boolean; tweetId?: string; error?: string }[] = []

  try {
    const eventTypes = [
      { key: 'half', label: 'ハーフマラソン' },
      { key: '10000', label: '10000m' },
      { key: '5000', label: '5000m' },
    ]

    for (const event of eventTypes) {
      // 各種目上位5名のPBを取得
      const { data: records } = await supabaseAdmin
        .from('hk_records')
        .select(`
          time_display,
          competition_name,
          hk_athletes (
            name,
            hk_teams ( short_name )
          )
        `)
        .eq('event_type', event.key)
        .eq('is_pb', true)
        .order('time_seconds')
        .limit(5)

      if (!records || records.length === 0) {
        results.push({ event: event.key, success: false, error: 'No records found' })
        continue
      }

      const now = new Date()
      const month = now.getMonth() + 1
      const lines = records.map((r: any, i: number) => {
        const name = r.hk_athletes?.name ?? '―'
        const team = r.hk_athletes?.hk_teams?.short_name ?? ''
        return `${i + 1}. ${name}（${team}） ${r.time_display}`
      }).join('\n')

      const tweetText =
        `【月間ランキング ${month}月】${event.label} TOP5\n\n` +
        `${lines}\n\n` +
        `詳細: https://hakone-fan.com/records\n` +
        `#箱根駅伝 #大学駅伝 #${event.label}`

      const xResult = await postToX(tweetText)
      results.push({ event: event.key, ...xResult })

      // レート制限対策: 種目間に少し待機
      await new Promise(r => setTimeout(r, 3000))
    }

    await supabaseAdmin.from('hk_scrape_logs').insert({
      scrape_type: 'monthly_ranking_x',
      source_url: 'internal',
      status: results.every(r => r.success) ? 'success' : 'partial',
      inserted_count: results.filter(r => r.success).length,
      updated_count: 0,
      raw_log: { results },
    })

    return Response.json({ success: true, results })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
