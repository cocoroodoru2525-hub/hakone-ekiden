'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [tab, setTab] = useState<'athlete' | 'record' | 'csv'>('athlete')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // --- 選手登録 ---
  const [athleteForm, setAthlete] = useState({
    team_id: '', name: '', name_kana: '', grade: '', bib_number: '', school: '', prefecture: ''
  })

  async function saveAthlete() {
    if (!athleteForm.team_id || !athleteForm.name) {
      setMsg('❌ 大学IDと選手名は必須です')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('hk_athletes').insert({
      team_id: Number(athleteForm.team_id),
      name: athleteForm.name,
      name_kana: athleteForm.name_kana,
      grade: athleteForm.grade ? Number(athleteForm.grade) : null,
      bib_number: athleteForm.bib_number ? Number(athleteForm.bib_number) : null,
      school: athleteForm.school,
      prefecture: athleteForm.prefecture,
    })
    setLoading(false)
    if (error) { setMsg('❌ エラー: ' + error.message); return }
    setMsg('✅ 選手を登録しました: ' + athleteForm.name)
    setAthlete({ team_id: athleteForm.team_id, name: '', name_kana: '', grade: '', bib_number: '', school: '', prefecture: '' })
  }

  // --- 記録登録 ---
  const [recForm, setRec] = useState({
    athlete_id: '', event_type: 'half', time_display: '', competition_name: '', competed_at: ''
  })

  function timeToSeconds(t: string): number {
    const parts = t.split(':').map(Number)
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    return 0
  }

  async function saveRecord() {
    if (!recForm.athlete_id || !recForm.time_display) {
      setMsg('❌ 選手IDと記録は必須です')
      return
    }
    setLoading(true)
    const secs = timeToSeconds(recForm.time_display)

    // 既存PBを確認
    const { data: existing } = await supabase
      .from('hk_records')
      .select('id, time_seconds')
      .eq('athlete_id', Number(recForm.athlete_id))
      .eq('event_type', recForm.event_type)
      .eq('is_pb', true)
      .single()

    const isPB = !existing || secs < existing.time_seconds

    // 既存PBをリセット
    if (isPB && existing) {
      await supabase.from('hk_records').update({ is_pb: false }).eq('id', existing.id)
    }

    const { error } = await supabase.from('hk_records').insert({
      athlete_id: Number(recForm.athlete_id),
      event_type: recForm.event_type,
      time_seconds: secs,
      time_display: recForm.time_display,
      competition_name: recForm.competition_name,
      competed_at: recForm.competed_at || null,
      is_pb: isPB,
      year: new Date().getFullYear(),
    })
    setLoading(false)
    if (error) { setMsg('❌ エラー: ' + error.message); return }
    setMsg(`✅ 記録を登録しました ${isPB ? '（PB更新！）' : ''}`)
    setRec({ ...recForm, time_display: '', competition_name: '', competed_at: '' })
  }

  // --- CSV一括取込 ---
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<any[]>([])

  function parseCSV() {
    const lines = csvText.trim().split('\n').filter(l => l.trim())
    const rows = lines.map(line => {
      const cols = line.split(',').map(c => c.trim())
      return {
        name: cols[0] ?? '',
        team_name: cols[1] ?? '',
        event_type: cols[2] ?? 'half',
        time_display: cols[3] ?? '',
        competition_name: cols[4] ?? '',
        competed_at: cols[5] ?? '',
      }
    })
    setPreview(rows)
    setMsg(`📋 ${rows.length}件をプレビュー中。確認して「登録」を押してください。`)
  }

  async function importCSV() {
    setLoading(true)
    let ok = 0, ng = 0
    for (const row of preview) {
      // チーム検索
      const { data: team } = await supabase
        .from('hk_teams').select('id').ilike('name', `%${row.team_name}%`).single()
      if (!team) { ng++; continue }

      // 選手検索（なければ作成）
      let { data: athlete } = await supabase
        .from('hk_athletes').select('id').eq('name', row.name).eq('team_id', team.id).single()

      if (!athlete) {
        const { data: newA } = await supabase
          .from('hk_athletes').insert({ name: row.name, team_id: team.id }).select('id').single()
        athlete = newA
      }
      if (!athlete) { ng++; continue }

      const secs = timeToSeconds(row.time_display)
      if (!secs) { ng++; continue }

      // PB判定
      const { data: existing } = await supabase
        .from('hk_records').select('id, time_seconds')
        .eq('athlete_id', athlete.id).eq('event_type', row.event_type).eq('is_pb', true).single()

      const isPB = !existing || secs < existing.time_seconds
      if (isPB && existing) {
        await supabase.from('hk_records').update({ is_pb: false }).eq('id', existing.id)
      }

      const { error } = await supabase.from('hk_records').insert({
        athlete_id: athlete.id,
        event_type: row.event_type,
        time_seconds: secs,
        time_display: row.time_display,
        competition_name: row.competition_name,
        competed_at: row.competed_at || null,
        is_pb: isPB,
        year: new Date().getFullYear(),
      })
      if (error) { ng++ } else { ok++ }
    }
    setLoading(false)
    setMsg(`✅ 登録完了：${ok}件成功 / ${ng}件失敗`)
    setPreview([])
    setCsvText('')
  }

  const inputClass = "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
  const labelClass = "block text-xs text-gray-400 mb-1"
  const btnClass = "bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-lg font-medium tracking-wide">箱根駅伝DATA</span>
          <span className="ml-3 text-xs text-gray-500">管理画面</span>
        </div>
        <a href="/" className="text-xs text-gray-400 hover:text-white">← サイトに戻る</a>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-medium mb-6">データ管理</h1>

        {/* タブ */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'athlete', label: '選手登録' },
            { key: 'record',  label: '記録登録' },
            { key: 'csv',     label: 'CSV一括取込' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); setMsg('') }}
              className={`px-4 py-2 rounded text-sm font-medium border ${
                tab === t.key
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-gray-700 text-gray-400 hover:text-white'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {/* メッセージ */}
        {msg && (
          <div className="mb-4 px-4 py-3 rounded bg-gray-800 border border-gray-700 text-sm">{msg}</div>
        )}

        {/* 選手登録 */}
        {tab === 'athlete' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col gap-4">
            <p className="text-xs text-gray-500">※ 大学IDはSupabaseの hk_teams テーブルで確認できます（青学=1, 駒澤=2 など）</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>大学ID *</label>
                <input className={inputClass} placeholder="例: 1" value={athleteForm.team_id}
                  onChange={e => setAthlete({...athleteForm, team_id: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>選手名 *</label>
                <input className={inputClass} placeholder="例: 太田 蒼生" value={athleteForm.name}
                  onChange={e => setAthlete({...athleteForm, name: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>よみがな</label>
                <input className={inputClass} placeholder="例: おおた あおみ" value={athleteForm.name_kana}
                  onChange={e => setAthlete({...athleteForm, name_kana: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>学年</label>
                <input className={inputClass} placeholder="例: 4" value={athleteForm.grade}
                  onChange={e => setAthlete({...athleteForm, grade: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>出身高校</label>
                <input className={inputClass} placeholder="例: 倉敷高校" value={athleteForm.school}
                  onChange={e => setAthlete({...athleteForm, school: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>出身都道府県</label>
                <input className={inputClass} placeholder="例: 岡山県" value={athleteForm.prefecture}
                  onChange={e => setAthlete({...athleteForm, prefecture: e.target.value})} />
              </div>
            </div>
            <button className={btnClass} onClick={saveAthlete} disabled={loading}>
              {loading ? '登録中...' : '選手を登録する'}
            </button>
          </div>
        )}

        {/* 記録登録 */}
        {tab === 'record' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>選手ID *</label>
                <input className={inputClass} placeholder="例: 1" value={recForm.athlete_id}
                  onChange={e => setRec({...recForm, athlete_id: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>種目 *</label>
                <select className={inputClass} value={recForm.event_type}
                  onChange={e => setRec({...recForm, event_type: e.target.value})}>
                  <option value="half">ハーフマラソン</option>
                  <option value="10000m">10000m</option>
                  <option value="5000m">5000m</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>記録 * （例: 1:01:47 または 27:54.31）</label>
                <input className={inputClass} placeholder="1:01:47" value={recForm.time_display}
                  onChange={e => setRec({...recForm, time_display: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>大会名</label>
                <input className={inputClass} placeholder="例: 丸亀国際ハーフマラソン" value={recForm.competition_name}
                  onChange={e => setRec({...recForm, competition_name: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>開催日</label>
                <input className={inputClass} type="date" value={recForm.competed_at}
                  onChange={e => setRec({...recForm, competed_at: e.target.value})} />
              </div>
            </div>
            <button className={btnClass} onClick={saveRecord} disabled={loading}>
              {loading ? '登録中...' : '記録を登録する'}
            </button>
          </div>
        )}

        {/* CSV一括取込 */}
        {tab === 'csv' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">
                形式：<code className="text-red-400">選手名, 大学名, 種目, 記録, 大会名, 日付</code>
              </p>
              <p className="text-xs text-gray-500 mb-3">
                種目は half / 10000m / 5000m のいずれか。1行1件で入力してください。
              </p>
              <textarea
                className={inputClass + ' h-48 font-mono'}
                placeholder={`太田蒼生, 青山学院大学, half, 1:01:47, 丸亀ハーフ, 2026-02-08\n鈴木芽吹, 創価大学, 10000m, 27:54.31, 日体大記録会, 2026-03-28`}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button className="border border-gray-600 text-gray-300 hover:text-white px-4 py-2 rounded text-sm"
                onClick={parseCSV}>プレビュー確認</button>
              {preview.length > 0 && (
                <button className={btnClass} onClick={importCSV} disabled={loading}>
                  {loading ? '登録中...' : `${preview.length}件を一括登録する`}
                </button>
              )}
            </div>
            {preview.length > 0 && (
              <div className="border border-gray-700 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-800">
                    <tr>
                      {['選手名','大学','種目','記録','大会','日付'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} className="border-t border-gray-800">
                        <td className="px-3 py-2">{r.name}</td>
                        <td className="px-3 py-2 text-gray-400">{r.team_name}</td>
                        <td className="px-3 py-2 text-gray-400">{r.event_type}</td>
                        <td className="px-3 py-2 font-mono text-red-400">{r.time_display}</td>
                        <td className="px-3 py-2 text-gray-400">{r.competition_name}</td>
                        <td className="px-3 py-2 text-gray-400">{r.competed_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
