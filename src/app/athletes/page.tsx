'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Athlete = {
  id: number
  name: string
  name_kana: string
  grade: number
  school: string
  prefecture: string
  team_id: number
  hk_teams: { name: string; short_name: string; color_code: string }
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('hk_athletes')
        .select('*, hk_teams(name, short_name, color_code)')
        .eq('is_active', true)
        .order('team_id')
      setAthletes(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const teams = Array.from(new Set(athletes.map(a => a.hk_teams?.name))).filter(Boolean)

  const filtered = athletes.filter(a => {
    const matchName = a.name.includes(search) || a.name_kana?.includes(search)
    const matchTeam = selectedTeam === '' || a.hk_teams?.name === selectedTeam
    return matchName && matchTeam
  })

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-medium tracking-wide">箱根駅伝DATA</span>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="hover:text-white">出場校</a>
          <a href="/results" className="hover:text-white">リザルト</a>
          <a href="/athletes" className="text-white">選手一覧</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      <div className="bg-black px-6 py-8 border-b border-gray-800">
        <p className="text-red-500 text-xs tracking-widest mb-2 font-medium">ATHLETES</p>
        <h1 className="text-2xl font-medium mb-4">選手一覧</h1>
        <div className="flex gap-3 max-w-2xl">
          <input
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            placeholder="選手名で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
          >
            <option value="">全チーム</option>
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-gray-400 text-sm text-center py-20">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-20">選手が見つかりませんでした</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(a => (
              <Link key={a.id} href={`/athletes/${a.id}`}>
                <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg p-4 cursor-pointer transition">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base font-medium text-white mb-3"
                    style={{ background: a.hk_teams?.color_code ?? '#333' }}
                  >
                    {a.name.charAt(0)}
                  </div>
                  <div className="text-sm font-medium mb-1">{a.name}</div>
                  <div className="text-xs text-gray-400">{a.hk_teams?.short_name ?? a.hk_teams?.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{a.grade}年</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
