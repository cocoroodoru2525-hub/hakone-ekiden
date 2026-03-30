'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AthletesPage() {
  const [query, setQuery] = useState('')
  const [athlete, setAthlete] = useState<any>(null)
  const [cheers, setCheers] = useState<any[]>([])
  const [prediction, setPrediction] = useState('')
  const [predLoading, setPredLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [cheerForm, setCheerForm] = useState({ from_name: '', message: '' })
  const [cheerSent, setCheerSent] = useState(false)
  const [msg, setMsg] = useState('')

  async function search() {
    if (!query.trim()) return
    setSearchLoading(true)
    setPrediction('')
    setAthlete(null)
    setCheers([])
    setCheerSent(false)

    const { data: ekiData } = await supabase
      .from('hk_ekiden_results')
      .select('*, hk_teams(name, short_name, color_code)')
      .ilike('athlete_name', `%${query.trim()}%`)
      .eq('race_name', '第102回箱根駅伝')
      .order('section_number')

    const { data: cheerData } = await supabase
      .from('hk_cheers')
      .select('*')
      .ilike('athlete_name', `%${query.trim()}%`)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    setSearchLoading(false)

    if (ekiData && ekiData.length > 0) {
      const first = ekiData[0]
      setAthlete({ name: query.trim(), team: first.hk_teams, sections: ekiData })
      setCheers(cheerData ?? [])
      await predict(query.trim(), ekiData)
    } else {
      setMsg('選手が見つかりませんでした。別の名前で試してください。')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  async function predict(name: string, sections: any[]) {
    setPredLoading(true)
    const sectionList = sections.map(s => `${s.section_number}区 ${s.time_display} (${s.hk_teams?.name})`).join('\n')

    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sectionList }),
    })
    const data = await res.json()
    setPrediction(data.prediction ?? '')
    setPredLoading(false)
  }

  async function sendCheer() {
    if (!cheerForm.from_name || !cheerForm.message) {
      setMsg('名前とメッセージを入力してください')
      return
    }
    const { error } = await supabase.from('hk_cheers').insert({
      athlete_name: athlete.name,
      team_name: athlete.team?.name,
      from_name: cheerForm.from_name,
      message: cheerForm.message,
    })
    if (error) { setMsg('送信に失敗しました'); return }
    setCheerSent(true)
    setCheers(prev => [{ from_name: cheerForm.from_name, message: cheerForm.message, created_at: new Date() }, ...prev])
    setCheerForm({ from_name: '', message: '' })
  }

  const inputClass = "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-medium tracking-wide">箱根駅伝DATA</span>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="hover:text-white">出場校</a>
          <a href="/results" className="hover:text-white">リザルト</a>
          <a href="/athletes" className="text-white">選手を応援</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      {/* Hero */}
      <div className="bg-black px-6 py-10 text-center border-b border-gray-800">
        <p className="text-red-500 text-xs tracking-widest mb-2 font-medium">HAKONE EKIDEN 2027 FAN SUPPORTER</p>
        <h1 className="text-3xl font-medium mb-2">うちの子、何区を走る？</h1>
        <p className="text-gray-400 text-sm mb-6">選手名を入れるとAIが区間を予測。家族・友人と一緒に応援できます。</p>
        <div className="flex gap-3 max-w-lg mx-auto">
          <input
            className={inputClass + ' flex-1'}
            placeholder="選手名を入力（例：黒田 朝日）"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <button
            onClick={search}
            disabled={searchLoading}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded text-sm font-medium disabled:opacity-50"
          >
            {searchLoading ? '検索中...' : '予測する'}
          </button>
        </div>
        {msg && <p className="text-yellow-400 text-sm mt-3">{msg}</p>}
      </div>

      {athlete && (
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 gap-6">

          {/* Left: AI prediction */}
          <div>
            {/* Athlete info */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium text-white"
                  style={{ background: athlete.team?.color_code ?? '#333' }}>
                  {athlete.name.charAt(0)}
                </div>
                <div>
                  <div className="text-lg font-medium">{athlete.name}</div>
                  <div className="text-sm text-gray-400">{athlete.team?.name}</div>
                </div>
              </div>

              {/* Section history */}
              <div className="text-xs text-gray-500 mb-2 font-medium tracking-wider">第102回 出走記録</div>
              <div className="flex flex-col gap-1">
                {athlete.sections.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">第{s.section_number}区</span>
                    <span className="font-medium tabular-nums">{s.time_display}</span>
                    <span className="text-gray-500 text-xs">{s.is_section_award ? '区間賞' : `${s.rank}位`}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI prediction */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">AIによる2027年区間予測</span>
                <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">AI</span>
              </div>
              {predLoading ? (
                <div className="text-gray-400 text-sm animate-pulse">Claude AIが分析中...</div>
              ) : prediction ? (
                <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{prediction}</div>
              ) : null}
            </div>
          </div>

          {/* Right: Cheers */}
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">{athlete.name} 選手への応援</span>
                <span className="text-xs text-gray-500">{cheers.length}件</span>
              </div>

              {/* Cheer list */}
              <div className="flex flex-col gap-3 mb-4 max-h-48 overflow-y-auto">
                {cheers.length > 0 ? cheers.map((c, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">{c.from_name} より</div>
                    <div className="text-sm text-gray-200 leading-relaxed">{c.message}</div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm">まだ応援メッセージがありません。最初の応援者になりましょう！</p>
                )}
              </div>

              {/* Cheer form */}
              {!cheerSent ? (
                <div className="border-t border-gray-700 pt-4 flex flex-col gap-3">
                  <input
                    className={inputClass}
                    placeholder="あなたのお名前（例：お母さん・高校の同期）"
                    value={cheerForm.from_name}
                    onChange={e => setCheerForm({ ...cheerForm, from_name: e.target.value })}
                  />
                  <textarea
                    className={inputClass + ' h-20 resize-none'}
                    placeholder="応援メッセージを書いてください..."
                    value={cheerForm.message}
                    onChange={e => setCheerForm({ ...cheerForm, message: e.target.value })}
                  />
                  <button
                    onClick={sendCheer}
                    className="bg-red-600 hover:bg-red-500 text-white py-2 rounded text-sm font-medium"
                  >
                    応援メッセージを送る
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-700 pt-4 text-center">
                  <div className="text-green-400 text-sm font-medium mb-1">応援メッセージを送りました！</div>
                  <div className="text-gray-500 text-xs">{athlete.name} 選手に届きますように</div>
                </div>
              )}
            </div>

            {/* Share */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500 mb-2">SNSでシェアして一緒に応援しよう</div>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${athlete.name}選手（${athlete.team?.name}）を応援しています！箱根駅伝2027 #箱根駅伝 #${athlete.team?.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gray-800 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded"
              >
                X（Twitter）でシェア
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Default state */}
      {!athlete && !searchLoading && (
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <div className="text-gray-600 text-sm mb-8">応援したい選手の名前を入力してください</div>
          <div className="grid grid-cols-3 gap-3">
            {['黒田 朝日', '高山 豪起', '吉岡 大翔', '山口 智規', '佐藤 圭汰', '青木 瑠郁'].map(name => (
              <button key={name} onClick={() => { setQuery(name); }}
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg py-3 text-sm text-gray-300">
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
