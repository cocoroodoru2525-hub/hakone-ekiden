import { SupabaseClient } from '@supabase/supabase-js'

interface ResultRow {
  rank: number | null
  athlete_name: string
  team_name: string
  time_display: string
}

const EVENT_LABELS: Record<string, string> = {
  '5000m': '5000m',
  '10000m': '10000m',
  'half': 'ハーフマラソン',
}

/**
 * 大会結果から自動でニュース記事を生成・保存する
 */
export async function generatePostFromResults(
  supabase: SupabaseClient,
  competitionName: string,
  eventType: string,
  competedAt: string | null,
  results: ResultRow[],
  options?: { inserted: number; pbUpdated: number }
): Promise<{ slug: string } | null> {
  if (results.length === 0) return null

  const top10 = results.slice(0, 10)
  const eventLabel = EVENT_LABELS[eventType] || eventType
  const dateStr = competedAt || new Date().toISOString().split('T')[0]
  const dateDisplay = dateStr.replace(/-/g, '/')

  const title = `${competitionName} ${eventLabel} 結果速報`
  const slug = `${dateStr}-${eventType}-${competitionName}`
    .replace(/[^a-zA-Z0-9\u3000-\u9FFF-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()

  // 本文を生成
  const lines: string[] = []
  lines.push(`${dateDisplay}に開催された${competitionName}の${eventLabel}の結果をお届けします。`)
  lines.push('')

  if (options) {
    lines.push(`今回の取込: ${options.inserted}件の新規記録、${options.pbUpdated}件のPB更新`)
    lines.push('')
  }

  // 上位10名テーブル
  lines.push('## 上位10名')
  lines.push('')
  lines.push('| 順位 | 選手 | 大学 | 記録 |')
  lines.push('| --- | --- | --- | --- |')

  for (let i = 0; i < top10.length; i++) {
    const r = top10[i]
    const rank = r.rank || (i + 1)
    lines.push(`| ${rank} | ${r.athlete_name} | ${r.team_name} | ${r.time_display} |`)
  }

  lines.push('')
  lines.push(`全${results.length}名が出場しました。`)

  const body = lines.join('\n')

  // 重複チェック（同じslugがあれば上書き）
  const { data: existing } = await supabase
    .from('hk_posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('hk_posts')
      .update({ title, body, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase.from('hk_posts').insert({
      title,
      slug,
      body,
      category: 'result',
    })
  }

  return { slug }
}
