import { SupabaseClient } from '@supabase/supabase-js'

/**
 * チーム名でマッチングを試み、見つからなければ自動作成する。
 * teams: 既にフェッチ済みのチーム一覧（キャッシュとして利用）
 * teamName: スクレイピングで取得したチーム名
 *
 * 戻り値: { id, name, short_name } またはnull
 * 自動作成した場合はteams配列にも追加される（後続の処理でヒットさせるため）
 */
export async function findOrCreateTeam(
  supabase: SupabaseClient,
  teams: { id: number; name: string; short_name: string | null }[],
  teamName: string,
): Promise<{ id: number; name: string; short_name: string | null } | null> {
  if (!teamName || !teamName.trim()) return null

  // 既存チームからマッチング
  const existing = teams.find(t =>
    teamName.includes(t.short_name || t.name) ||
    (t.short_name || t.name).includes(teamName) ||
    teamName.includes(t.name) ||
    t.name.includes(teamName)
  )
  if (existing) return existing

  // 見つからない場合、自動作成
  // 大学名を正規化（「大学」が含まれていなければそのまま）
  const name = teamName.includes('大学') ? teamName : teamName
  const shortName = name
    .replace(/大学$/, '')
    .replace(/大学校$/, '')

  // sort_orderは100以上（登録済みチームの後）
  const maxSortOrder = teams.length > 0
    ? Math.max(...teams.map(t => (t as any).sort_order ?? 0))
    : 0
  const sortOrder = Math.max(maxSortOrder + 1, 100)

  const { data, error } = await supabase
    .from('hk_teams')
    .insert({
      name,
      short_name: shortName,
      color_code: '#6B7280', // gray default
      sort_order: sortOrder,
      category: 'other',
    })
    .select('id, name, short_name')
    .single()

  if (error || !data) return null

  // キャッシュに追加（後続レコードで同じチームがヒットするように）
  teams.push(data)

  return data
}
