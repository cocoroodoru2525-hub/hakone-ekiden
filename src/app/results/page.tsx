import { supabase } from '@/lib/supabase'

export default async function ResultsPage() {
  const { data: overall } = await supabase
    .from('hk_ekiden_results')
    .select(`*, hk_teams(name, short_name, color_code)`)
    .eq('race_year', 2026)
    .eq('race_name', '第102回箱根駅伝総合')
    .order('rank')

  const { data: sections } = await supabase
    .from('hk_ekiden_results')
    .select(`*, hk_teams(name, short_name, color_code)`)
    .eq('race_year', 2026)
    .eq('race_name', '第102回箱根駅伝')
    .order('section_number')
    .order('rank')

  const sectionInfo = [
    '', '1区 21.3km 大手町→鶴見', '2区 23.1km 鶴見→戸塚',
    '3区 21.4km 戸塚→平塚', '4区 20.9km 平塚→小田原',
    '5区 20.8km 小田原→箱根', '6区 20.8km 箱根→小田原',
    '7区 21.3km 小田原→平塚', '8区 21.4km 平塚→戸塚',
    '9区 23.1km 戸塚→鶴見', '10区 23.0km 鶴見→大手町'
  ]

  const sectionNums = Array.from(new Set(sections?.map(r => r.section_number) ?? [])).sort((a, b) => a - b)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-medium tracking-wide">箱根駅伝家族！</span>
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
          <h1 className="text-2xl font-medium mb-1">第102回箱根駅伝</h1>
          <p className="text-gray-400 text-sm">全10区間 217.1km ／ 出典：関東学生陸上競技連盟公式サイト</p>
        </div>

        {/* 総合成績 */}
        <div className="mb-10">
          <h2 className="text-sm font-medium text-gray-300 mb-3 pb-2 border-b border-gray-800">
            総合成績
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left pb-2 w-10">順位</th>
                <th className="text-left pb-2">大学</th>
                <th className="text-right pb-2">総合タイム</th>
              </tr>
            </thead>
            <tbody>
              {overall?.map((r: any) => (
                <tr key={r.id} className={`border-b border-gray-900 hover:bg-gray-900 ${r.rank === 1 ? 'bg-yellow-950' : ''}`}>
                  <td className="py-2">
                    <span className={`text-sm font-medium ${
                      r.rank === 1 ? 'text-yellow-400' :
                      r.rank === 2 ? 'text-gray-300' :
                      r.rank === 3 ? 'text-amber-600' : 'text-gray-500'
                    }`}>{r.rank}</span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: r.hk_teams?.color_code ?? '#888' }} />
                      <span className="font-medium">{r.hk_teams?.name}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums">{r.time_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 区間成績 */}
        <h2 className="text-sm font-medium text-gray-300 mb-4 pb-2 border-b border-gray-800">
          区間成績
        </h2>
        {sectionNums.map(sec => {
          const secData = sections?.filter(r => r.section_number === sec) ?? []
          return (
            <div key={sec} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-red-600 text-white text-xs font-medium px-3 py-1 rounded">
                  第{sec}区
                </span>
                <span className="text-gray-400 text-xs">{sectionInfo[sec]}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left pb-2 w-8">順</th>
                    <th className="text-left pb-2">選手名</th>
                    <th className="text-left pb-2">大学</th>
                    <th className="text-right pb-2">タイム</th>
                    <th className="text-right pb-2">総合</th>
                  </tr>
                </thead>
                <tbody>
                  {secData.map((r: any) => (
                    <tr key={r.id} className={`border-b border-gray-900 hover:bg-gray-900 ${r.is_section_award ? 'bg-red-950' : ''}`}>
                      <td className="py-2 text-gray-500 text-xs">{r.rank}</td>
                      <td className="py-2 flex items-center gap-1">
                        {r.is_section_award && (
                          <span className="text-xs bg-red-600 text-white px-1 rounded mr-1">賞</span>
                        )}
                        {r.athlete_name}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: r.hk_teams?.color_code ?? '#888' }} />
                          <span className="text-gray-300 text-xs">{r.hk_teams?.short_name}</span>
                        </div>
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums text-sm">{r.time_display}</td>
                      <td className="py-2 text-right text-xs text-gray-500">{r.total_rank}位</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-500">
          ※7区のデータは準備中です。出典：関東学生陸上競技連盟公式サイト
        </div>
      </div>
    </main>
  )
}
