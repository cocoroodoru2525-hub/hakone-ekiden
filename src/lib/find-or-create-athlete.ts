import { SupabaseClient } from '@supabase/supabase-js'

/**
 * 選手を検索し、見つからなければ自動作成する
 * autoCreate=false の場合は検索のみ（既存の挙動）
 */
export async function findOrCreateAthlete(
  supabase: SupabaseClient,
  name: string,
  teamId: number,
  options?: { autoCreate?: boolean; grade?: number | null }
): Promise<{ id: number; created: boolean } | null> {
  // 既存選手を検索
  const { data: existing } = await supabase
    .from('hk_athletes')
    .select('id')
    .eq('name', name)
    .eq('team_id', teamId)
    .maybeSingle()

  if (existing) {
    return { id: existing.id, created: false }
  }

  // 自動作成が無効ならnull
  if (!options?.autoCreate) {
    return null
  }

  // 新規作成
  const { data: newAthlete, error } = await supabase
    .from('hk_athletes')
    .insert({
      name,
      team_id: teamId,
      grade: options.grade ?? null,
    })
    .select('id')
    .single()

  if (error || !newAthlete) {
    return null
  }

  return { id: newAthlete.id, created: true }
}
