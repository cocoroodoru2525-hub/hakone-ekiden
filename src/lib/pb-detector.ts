import { SupabaseClient } from '@supabase/supabase-js'

interface RecordInput {
  athlete_id: number
  event_type: string
  time_seconds: number
  time_display: string
  competition_name: string
  competed_at: string | null
  year: number
}

interface InsertResult {
  inserted: boolean
  isPB: boolean
  error?: string
}

// 種目ごとの最低タイム（秒）- これ未満は明らかに誤登録
const MIN_TIME_SECONDS: Record<string, number> = {
  half: 58 * 60,       // ハーフ: 58分未満は無効
  '10000': 26 * 60,    // 10000m: 26分未満は無効
  '5000': 12 * 60,     // 5000m: 12分未満は無効
}

/**
 * 記録を挿入し、PB（自己ベスト）を自動管理する
 * - 既存PBより速ければ、旧PBのis_pbをfalseにし、新記録をPBとして挿入
 * - 同じ選手・種目・大会・記録が既に存在する場合はスキップ
 * - 種目ごとの最低タイム未満は無効データとして除外
 */
export async function insertRecordWithPB(
  supabase: SupabaseClient,
  record: RecordInput
): Promise<InsertResult> {
  // 明らかにおかしい記録を除外（駅伝区間タイムの誤混入など）
  const minTime = MIN_TIME_SECONDS[record.event_type]
  if (minTime && record.time_seconds < minTime) {
    return { inserted: false, isPB: false }
  }

  // 重複チェック
  const { data: dup } = await supabase
    .from('hk_records')
    .select('id')
    .eq('athlete_id', record.athlete_id)
    .eq('event_type', record.event_type)
    .eq('time_seconds', record.time_seconds)
    .eq('competition_name', record.competition_name)
    .maybeSingle()

  if (dup) {
    return { inserted: false, isPB: false }
  }

  // 既存PBを確認
  const { data: existing } = await supabase
    .from('hk_records')
    .select('id, time_seconds')
    .eq('athlete_id', record.athlete_id)
    .eq('event_type', record.event_type)
    .eq('is_pb', true)
    .maybeSingle()

  const isPB = !existing || record.time_seconds < existing.time_seconds

  // 旧PBをリセット
  if (isPB && existing) {
    await supabase.from('hk_records').update({ is_pb: false }).eq('id', existing.id)
  }

  const { error } = await supabase.from('hk_records').insert({
    ...record,
    is_pb: isPB,
  })

  if (error) {
    return { inserted: false, isPB: false, error: error.message }
  }

  return { inserted: true, isPB }
}
