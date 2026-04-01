'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Team = {
  id: number
  name: string
  short_name: string
  color_code: string
}

type Athlete = {
  id: number
  name: string
  grade: number
  prefecture: string
}

export default function TeamDetailPage() {
  const { id } = useParams()
  const [team, setTeam] = useState<Team | null>(null)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('hk_teams')
        .select('*')
        .eq('id', id)
        .single()
      setTeam(t)

      const { data: a } = await supabase
        .from('hk_athletes')
        .select('*')
        .eq('team_id', id)
        .eq('is_active', true)
        .order('grade')
      setAthletes(a ?? [])

      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">読み込み中...</div>
  if (!team) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">チームが見つかりません</div>

  const gradeGroups = [3, 2, 1].map(g => ({
    grade: g,
    athletes: athletes.filter(a => a.grade === g)
  })).filter(g => g.athletes.length > 0)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-medium tracking-wide">箱根駅伝家族！</span>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="text-white">出場校</a>
          <a href="/athletes" className="hover:text-white">選手一覧</a>
          <a href="/results" className="hover:text-white">リザルト</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* チームヘッダー */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6 flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex-shrink-0"
            style={{ background: team.color_code }}
          />
          <div>
            <p className="text-red-500 text-xs tracking-widest mb-1 font-medium">TEAM</p>
            <h1 className="text-2xl font-medium">{team.name}</h1>
            <p className="text-gray-400 text-sm mt-1">登録選手 {athletes.length}名</p>
          </div>
        </div>

        {/* 学年別選手一覧 */}
        {gradeGroups.map(({ grade, athletes: list }) => (
          <div key={grade} className="mb-6">
            <h2 className="text-sm font-medium text-gray-400 mb-3">{grade}年生</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {list.map(a => (
                <Link key={a.id} href={`/athletes/${a.id}`}>
                  <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg p-4 cursor-pointer transition">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white mb-2"
                      style={{ background: team.color_code }}
                    >
                      {a.name.charAt(0)}
                    </div>
                    <div className="text-sm font-medium">{a.name}</div>
                    {a.prefecture && <div className="text-xs text-gray-500 mt-1">{a.prefecture}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-4">
          <a href="/teams" className="text-gray-500 text-sm hover:text-white">← 出場校一覧に戻る</a>
        </div>
      </div>
    </main>
  )
}
