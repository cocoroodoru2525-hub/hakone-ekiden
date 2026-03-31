'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Athlete = {
  id: number
  name: string
  name_kana: string | null
  grade: number | null
  school: string | null
  prefecture: string | null
  team_id: number
  hk_teams: { name: string; short_name: string; color_code: string; sort_order: number }
}

const KANA_GROUPS = [
  { label: 'あ行', pattern: /^[あ-おア-オa-oA-O]/ },
  { label: 'か行', pattern: /^[か-こが-ごカ-コガ-ゴk-kK-K]/ },
  { label: 'さ行', pattern: /^[さ-そざ-ぞサ-ソザ-ゾs-sS-S]/ },
  { label: 'た行', pattern: /^[た-とだ-どタ-トダ-ドt-tT-T]/ },
  { label: 'な行', pattern: /^[な-のナ-ノn-nN-N]/ },
  { label: 'は行', pattern: /^[は-ほば-ぼぱ-ぽハ-ホバ-ボパ-ポh-hH-H]/ },
  { label: 'ま行', pattern: /^[ま-もマ-モm-mM-M]/ },
  { label: 'や行', pattern: /^[や-よヤ-ヨy-yY-Y]/ },
  { label: 'ら行', pattern: /^[ら-ろラ-ロr-rR-R]/ },
  { label: 'わ行', pattern: /^[わ-んワ-ンw-wW-W]/ },
]

function getKanaGroup(name_kana: string | null, name: string): string {
  const target = name_kana || name
  for (const g of KANA_GROUPS) {
    if (g.pattern.test(target)) return g.label
  }
  return 'その他'
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openTeams, setOpenTeams] = useState<Set<number>>(new Set())

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('hk_athletes')
        .select('*, hk_teams(name, short_name, color_code, sort_order)')
        .neq('is_active', false)
        .order('team_id')
      setAthletes(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // 検索フィルタ
  const filtered = search
    ? athletes.filter(a =>
        a.name.includes(search) || a.name_kana?.includes(search)
      )
    : athletes

  // 大学ごとにグルーピング（sort_order順）
  const teamMap = new Map<number, { name: string; short_name: string; color_code: string; sort_order: number; athletes: Athlete[] }>()
  for (const a of filtered) {
    if (!a.hk_teams) continue
    if (!teamMap.has(a.team_id)) {
      teamMap.set(a.team_id, {
        name: a.hk_teams.name,
        short_name: a.hk_teams.short_name,
        color_code: a.hk_teams.color_code,
        sort_order: a.hk_teams.sort_order,
        athletes: [],
      })
    }
    teamMap.get(a.team_id)!.athletes.push(a)
  }
  const teams = Array.from(teamMap.entries()).sort((a, b) => a[1].sort_order - b[1].sort_order)

  // チーム内をあ行でグルーピング
  function groupByKana(list: Athlete[]) {
    const groups = new Map<string, Athlete[]>()
    for (const a of list) {
      const g = getKanaGroup(a.name_kana, a.name)
      if (!groups.has(g)) groups.set(g, [])
      groups.get(g)!.push(a)
    }
    // あ行順に並べる
    const order = [...KANA_GROUPS.map(g => g.label), 'その他']
    return Array.from(groups.entries()).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
  }

  function toggleTeam(teamId: number) {
    setOpenTeams(prev => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  // 検索時は全チーム展開
  const isOpen = (teamId: number) => search ? true : openTeams.has(teamId)

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
        <input
          className="w-full max-w-md bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
          placeholder="選手名で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-2">{filtered.length}名の選手が登録されています</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-gray-400 text-sm text-center py-20">読み込み中...</div>
        ) : teams.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-20">選手が見つかりませんでした</div>
        ) : (
          <div className="flex flex-col gap-2">
            {teams.map(([teamId, team]) => (
              <div key={teamId} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                {/* 大学名ヘッダー */}
                <button
                  onClick={() => toggleTeam(teamId)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-800 transition text-left"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: team.color_code }} />
                  <span className="font-medium flex-1">{team.name}</span>
                  <span className="text-xs text-gray-500">{team.athletes.length}名</span>
                  <span className="text-gray-500 text-sm">{isOpen(teamId) ? '▲' : '▼'}</span>
                </button>

                {/* 選手リスト（あ行グループ） */}
                {isOpen(teamId) && (
                  <div className="border-t border-gray-800 px-5 pb-4">
                    {groupByKana(team.athletes).map(([kana, list]) => (
                      <div key={kana} className="mt-3">
                        <div className="text-xs text-red-400 font-medium mb-2 tracking-widest">{kana}</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                          {list.map(a => (
                            <Link key={a.id} href={`/athletes/${a.id}`}>
                              <div className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 transition cursor-pointer">
                                <span className="text-sm">{a.name}</span>
                                {a.grade && <span className="text-xs text-gray-600">{a.grade}年</span>}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
