'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Athlete = {
  id: number
  name: string
  grade: number
  school: string
  prefecture: string
  hk_teams: { name: string; color_code: string }
}

type Record = {
  id: number
  event_type: string
  time_display: string
  competition_name: string
  competed_at: string
  is_pb: boolean
}

type Cheer = {
  id: number
  from_name: string
  message: string
  created_at: string
}

export default function AthleteDetailPage() {
  const { id } = useParams()
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [cheers, setCheers] = useState<Cheer[]>([])
  const [loading, setLoading] = useState(true)
  const [fromName, setFromName] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase
        .from('hk_athletes')
        .select('*, hk_teams(name, color_code)')
        .eq('id', id)
        .single()
      setAthlete(a)

      const { data: r } = await supabase
        .from('hk_records')
        .select('*')
        .eq('athlete_id', id)
        .order('competed_at', { ascending: false })
      setRecords(r ?? [])

      const { data: c } = await supabase
        .from('hk_cheers')
        .select('*')
        .eq('athlete_name', a?.name)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      setCheers(c ?? [])

      setLoading(false)
    }
    load()
  }, [id])

  async function sendCheer() {
    if (!fromName || !message) { setMsg('名前とメッセージを入力してください'); return }
    const { error } = await supabase.from('hk_cheers').insert({
      athlete_name: athlete?.name,
      team_name: athlete?.hk_teams?.name,
      from_name: fromName,
      message,
    })
    if (error) { setMsg('送信に失敗しました'); return }
    setSent(true)
    setCheers(prev => [{ id: 0, from_name: fromName, message, created_at: new Date().toISOString() }, ...prev])
  }

  const eventLabel: { [key: string]: string } = {
    '5000m': '5000m', '10000m': '10000m', 'half': 'ハーフ'
  }

  const inputClass = "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">読み込み中...</div>
  if (!athlete) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">選手が見つかりません</div>

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-medium tracking-wide">箱根駅伝家族！</span>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="hover:text-white">出場校</a>
          <a href="/results" className="hover:text-white">リザルト</a>
          <a href="/athletes" className="text-white">選手一覧</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* プロフィール */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6 flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-medium text-white flex-shrink-0"
            style={{ background: athlete.hk_teams?.color_code ?? '#333' }}
          >
            {athlete.name.charAt(0)}
          </div>
          <div>
            <div className="text-2xl font-medium mb-1">{athlete.name}</div>
            <div className="text-gray-400 text-sm mb-2">{athlete.hk_teams?.name}　{athlete.grade}年</div>
            <div className="text-gray-500 text-xs">出身：{athlete.prefecture}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 記録 */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <div className="text-sm font-medium mb-4">個人記録</div>
            {records.length === 0 ? (
              <p className="text-gray-500 text-sm">記録がまだ登録されていません</p>
            ) : (
              <div className="flex flex-col gap-3">
                {records.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded">
                        {eventLabel[r.event_type] ?? r.event_type}
                      </span>
                      {r.is_pb && <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">PB</span>}
                    </div>
                    <span className="font-medium tabular-nums">{r.time_display}</span>
                    <span className="text-gray-500 text-xs">{r.competition_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 応援 */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <div className="text-sm font-medium mb-4">{athlete.name} 選手への応援 {cheers.length}件</div>
            <div className="flex flex-col gap-3 mb-4 max-h-48 overflow-y-auto">
              {cheers.length === 0 ? (
                <p className="text-gray-500 text-sm">まだ応援メッセージがありません。最初の応援者になりましょう！</p>
              ) : cheers.map((c, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{c.from_name} より</div>
                  <div className="text-sm text-gray-200">{c.message}</div>
                </div>
              ))}
            </div>
            {!sent ? (
              <div className="border-t border-gray-700 pt-4 flex flex-col gap-3">
                {msg && <p className="text-yellow-400 text-xs">{msg}</p>}
                <input className={inputClass} placeholder="あなたのお名前" value={fromName} onChange={e => setFromName(e.target.value)} />
                <textarea className={inputClass + ' h-20 resize-none'} placeholder="応援メッセージ..." value={message} onChange={e => setMessage(e.target.value)} />
                <button onClick={sendCheer} className="bg-red-600 hover:bg-red-500 text-white py-2 rounded text-sm font-medium">
                  応援メッセージを送る
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-700 pt-4 text-center">
                <div className="text-green-400 text-sm font-medium">応援メッセージを送りました！</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <a href="/athletes" className="text-gray-500 text-sm hover:text-white">← 選手一覧に戻る</a>
        </div>
      </div>
    </main>
  )
}
