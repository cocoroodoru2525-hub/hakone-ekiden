import { supabase } from '@/lib/supabase'

export default async function ResultsPage() {
  const { data: results } = await supabase
    .from('hk_ekiden_results')
    .select(`*, hk_teams(name, short_name, color_code)`)
    .eq('race_year', 2026)
    .eq('race_name', '第102回箱根駅伝')
    .order('section_number')
    .order('rank')

  const sections = Array.from({ length: 10 }, (_, i) => i + 1)
  const sectionNames = ['', '21.3km', '23.1km', '21.4km', '20.9km', '20.8km', '20.8km', '21.3km', '21.4km', '23.1km', '23.0km']

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-medium tracking-wide">箱根駅伝DATA</span>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="hover:text-white">出場校</a>
          <a href="/results" className="text-white">リザルト</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-red-500 text-xs tracking-widest mb-1 font-medium">2026年1月2〜3日</p>
          <h1 className="text-2xl font-medium">第102回箱根駅伝　区間成績</h1>
          <p className="text-gray-400 text-sm mt-1">優勝：青山学院大学　10:37:34（大会新記録）</p>
        </div>

        {sections.map(sec => {
          const secResults = results?.filter(r => r.section_number === sec) ?? []
          if (secResults.length === 0) return null
          return (
            <div key={sec} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-red-600 text-white text-xs font-medium px-3 py-1 rounded">
                  第{sec}区
                </div>
                <span className="text-gray-400 text-sm">{sectionNames[sec]}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left pb-2 w-8">順</th>
                    <th className="text-left pb-2">選手名</th>
                    <th className="text-left pb-2">大学</th>
                    <th className="text-right pb-2">タイム</th>
                  </tr>
                </thead>
                <tbody>
                  {secResults.map((r: any) => (
                    <tr key={r.id} className={`border-b border-gray-900 hover:bg-gray-900 ${r.is_section_award ? 'bg-red-950' : ''}`}>
                      <td className="py-2 text-gray-500 text-xs">{r.rank}</td>
                      <td className="py-2 flex items-center gap-2">
                        {r.is_section_award && <span className="text-xs bg-red-600 text-white px-1 rounded">賞</span>}
                        {r.athlete_name}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: r.hk_teams?.color_code ?? '#888' }} />
                          <span className="text-gray-300 text-xs">{r.hk_teams?.short_name}</span>
                        </div>
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums">{r.time_display}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </main>
  )
}