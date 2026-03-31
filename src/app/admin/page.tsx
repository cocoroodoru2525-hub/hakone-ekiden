'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Tab = 'athlete' | 'record' | 'csv' | 'roster' | 'auto'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('athlete')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // --- 選手登録 ---
  const [athleteForm, setAthlete] = useState({
    team_id: '', name: '', name_kana: '', grade: '', bib_number: '', school: '', prefecture: ''
  })

  async function saveAthlete() {
    if (!athleteForm.team_id || !athleteForm.name) {
      setMsg('大学IDと選手名は必須です')
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
    if (error) { setMsg('エラー: ' + error.message); return }
    setMsg('選手を登録しました: ' + athleteForm.name)
    setAthlete({ team_id: athleteForm.team_id, name: '', name_kana: '', grade: '', bib_number: '', school: '', prefecture: '' })
  }

  // --- 記録登録 ---
  const [recForm, setRec] = useState({
    athlete_id: '', event_type: 'half', time_display: '', competition_name: '', competed_at: ''
  })

  function timeToSeconds(t: string): number {
    const clean = t.replace(',', '.').trim()
    const parts = clean.split(':')
    if (parts.length === 3) return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2])
    if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1])
    return 0
  }

  async function saveRecord() {
    if (!recForm.athlete_id || !recForm.time_display) {
      setMsg('選手IDと記録は必須です')
      return
    }
    setLoading(true)
    const secs = timeToSeconds(recForm.time_display)

    const { data: existing } = await supabase
      .from('hk_records')
      .select('id, time_seconds')
      .eq('athlete_id', Number(recForm.athlete_id))
      .eq('event_type', recForm.event_type)
      .eq('is_pb', true)
      .single()

    const isPB = !existing || secs < existing.time_seconds

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
    if (error) { setMsg('エラー: ' + error.message); return }
    setMsg(`記録を登録しました ${isPB ? '(PB更新!)' : ''}`)
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
    setMsg(`${rows.length}件をプレビュー中。確認して「登録」を押してください。`)
  }

  async function importCSV() {
    setLoading(true)
    let ok = 0, ng = 0
    for (const row of preview) {
      const { data: team } = await supabase
        .from('hk_teams').select('id').ilike('name', `%${row.team_name}%`).single()
      if (!team) { ng++; continue }

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
    setMsg(`登録完了: ${ok}件成功 / ${ng}件失敗`)
    setPreview([])
    setCsvText('')
  }

  // --- 名簿取込 ---
  const [rosterResult, setRosterResult] = useState<any>(null)

  async function scrapeRoster() {
    setLoading(true)
    setMsg('名簿をスクレイピング中... (数十秒かかります)')
    try {
      const res = await fetch('/api/admin/scrape-roster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_SECRET || 'hakone-admin-2026',
        },
      })
      const data = await res.json()
      if (data.error) {
        setMsg('エラー: ' + data.error)
      } else {
        setRosterResult(data)
        setMsg(`名簿取込完了: ${data.inserted}名新規登録 / ${data.updated}名更新 / ${data.recordsInserted}件の記録登録`)
      }
    } catch (e: any) {
      setMsg('エラー: ' + e.message)
    }
    setLoading(false)
  }

  // --- 記録自動取得 ---
  const [autoResult, setAutoResult] = useState<any>(null)
  const [compForm, setCompForm] = useState({
    url: '', eventType: 'half', competitionName: '', competedAt: ''
  })
  const [scrapeLogs, setScrapeLogs] = useState<any[]>([])

  useEffect(() => {
    if (tab === 'auto') {
      loadScrapeLogs()
    }
  }, [tab])

  async function loadScrapeLogs() {
    const { data } = await supabase
      .from('hk_scrape_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setScrapeLogs(data)
  }

  async function scrapeRecordsNow() {
    setLoading(true)
    setMsg('記録をスクレイピング中... (数十秒かかります)')
    try {
      const res = await fetch('/api/admin/scrape-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_SECRET || 'hakone-admin-2026',
        },
      })
      const data = await res.json()
      if (data.error) {
        setMsg('エラー: ' + data.error)
      } else {
        setAutoResult(data)
        setMsg(`記録取得完了: ${data.totalScraped}件取得 / ${data.inserted}件新規 / ${data.pbUpdated}件PB更新`)
        loadScrapeLogs()
      }
    } catch (e: any) {
      setMsg('エラー: ' + e.message)
    }
    setLoading(false)
  }

  async function scrapeCompetition() {
    if (!compForm.url || !compForm.competitionName) {
      setMsg('URLと大会名は必須です')
      return
    }
    setLoading(true)
    setMsg('大会結果を取込中...')
    try {
      const res = await fetch('/api/admin/scrape-competition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_SECRET || 'hakone-admin-2026',
        },
        body: JSON.stringify({
          url: compForm.url,
          eventType: compForm.eventType,
          competitionName: compForm.competitionName,
          competedAt: compForm.competedAt,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setMsg('エラー: ' + data.error)
      } else {
        setMsg(`大会結果取込完了: ${data.totalScraped}件取得 / ${data.inserted}件新規 / ${data.pbUpdated}件PB更新`)
        loadScrapeLogs()
      }
    } catch (e: any) {
      setMsg('エラー: ' + e.message)
    }
    setLoading(false)
  }

  const inputClass = "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
  const labelClass = "block text-xs text-gray-400 mb-1"
  const btnClass = "bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
  const btnSecondary = "border border-gray-600 text-gray-300 hover:text-white px-4 py-2 rounded text-sm"

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-lg font-medium tracking-wide">箱根駅伝DATA</span>
          <span className="ml-3 text-xs text-gray-500">管理画面</span>
        </div>
        <a href="/" className="text-xs text-gray-400 hover:text-white">&larr; サイトに戻る</a>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-medium mb-6">データ管理</h1>

        {/* タブ */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'athlete' as Tab, label: '選手登録' },
            { key: 'record' as Tab, label: '記録登録' },
            { key: 'csv' as Tab, label: 'CSV取込' },
            { key: 'roster' as Tab, label: '名簿取込' },
            { key: 'auto' as Tab, label: '記録自動取得' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setMsg('') }}
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
                <label className={labelClass}>記録 * (例: 1:01:47 または 27:54.31)</label>
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
                形式: <code className="text-red-400">選手名, 大学名, 種目, 記録, 大会名, 日付</code>
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
              <button className={btnSecondary} onClick={parseCSV}>プレビュー確認</button>
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

        {/* 名簿取込 */}
        {tab === 'roster' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-medium mb-2">選手名簿一括取込</h2>
              <p className="text-xs text-gray-500 mb-4">
                ekidenreki.com の PBランキングから、3年生以下の選手を自動取得します。
                取得した選手は hk_athletes に登録され、PB記録も同時に hk_records に登録されます。
              </p>
            </div>

            <button
              className={btnClass}
              onClick={scrapeRoster}
              disabled={loading}
            >
              {loading ? 'スクレイピング中...' : '全校の名簿を一括取込する'}
            </button>

            <p className="text-xs text-gray-500">
              ※ 全3種目(5000m, 10000m, ハーフ)のランキングを巡回するため、数十秒かかります。
            </p>

            {rosterResult && (
              <div className="border border-gray-700 rounded p-4 text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400">取得選手数</div>
                    <div className="text-xl font-mono text-white">{rosterResult.totalScraped}</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400">新規登録</div>
                    <div className="text-xl font-mono text-green-400">{rosterResult.inserted}</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400">更新</div>
                    <div className="text-xl font-mono text-blue-400">{rosterResult.updated}</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400">記録登録</div>
                    <div className="text-xl font-mono text-red-400">{rosterResult.recordsInserted}</div>
                  </div>
                </div>

                {rosterResult.errors && rosterResult.errors.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-400 mb-1">エラー ({rosterResult.errors.length}件):</div>
                    <div className="bg-gray-800 rounded p-2 text-xs text-yellow-400 max-h-32 overflow-y-auto">
                      {rosterResult.errors.map((e: string, i: number) => (
                        <div key={i}>{e}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 記録自動取得 */}
        {tab === 'auto' && (
          <div className="space-y-6">
            {/* PB一括更新 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-medium mb-2">PB記録一括更新</h2>
                <p className="text-xs text-gray-500 mb-2">
                  ekidenreki.com から最新のPBランキングを取得し、登録済み選手の記録を更新します。
                  毎日15:00 JST にVercel Cronで自動実行されますが、手動でも実行できます。
                </p>
              </div>

              <button
                className={btnClass}
                onClick={scrapeRecordsNow}
                disabled={loading}
              >
                {loading ? '取得中...' : '今すぐPB記録を更新する'}
              </button>

              {autoResult && (
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400">取得件数</div>
                    <div className="text-lg font-mono">{autoResult.totalScraped}</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400">新規登録</div>
                    <div className="text-lg font-mono text-green-400">{autoResult.inserted}</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400">PB更新</div>
                    <div className="text-lg font-mono text-red-400">{autoResult.pbUpdated}</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400">スキップ</div>
                    <div className="text-lg font-mono text-gray-500">{autoResult.skipped}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 大会結果取込 */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-medium mb-2">大会結果取込</h2>
                <p className="text-xs text-gray-500 mb-2">
                  大会結果ページのURLを指定して、記録を取り込みます。HTML内のテーブルを自動検出します。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>結果ページURL *</label>
                  <input className={inputClass} placeholder="https://www.kgrr.org/event/..." value={compForm.url}
                    onChange={e => setCompForm({...compForm, url: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>種目 *</label>
                  <select className={inputClass} value={compForm.eventType}
                    onChange={e => setCompForm({...compForm, eventType: e.target.value})}>
                    <option value="half">ハーフマラソン</option>
                    <option value="10000m">10000m</option>
                    <option value="5000m">5000m</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>大会名 *</label>
                  <input className={inputClass} placeholder="例: 日体大記録会" value={compForm.competitionName}
                    onChange={e => setCompForm({...compForm, competitionName: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>開催日</label>
                  <input className={inputClass} type="date" value={compForm.competedAt}
                    onChange={e => setCompForm({...compForm, competedAt: e.target.value})} />
                </div>
              </div>

              <button
                className={btnClass}
                onClick={scrapeCompetition}
                disabled={loading}
              >
                {loading ? '取込中...' : '大会結果を取込する'}
              </button>
            </div>

            {/* スクレイピングログ */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-sm font-medium mb-4">実行ログ</h2>
              {scrapeLogs.length === 0 ? (
                <p className="text-xs text-gray-500">まだログがありません</p>
              ) : (
                <div className="space-y-2">
                  {scrapeLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs border-b border-gray-800 pb-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        log.status === 'success' ? 'bg-green-900 text-green-400' :
                        log.status === 'partial' ? 'bg-yellow-900 text-yellow-400' :
                        'bg-red-900 text-red-400'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-gray-400">{log.scrape_type}</span>
                      <span className="text-gray-500">{log.source_url}</span>
                      <span className="text-gray-500 ml-auto">
                        +{log.inserted_count} / PB:{log.updated_count}
                      </span>
                      <span className="text-gray-600">
                        {new Date(log.created_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
