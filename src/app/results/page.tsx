import { supabase } from '@/lib/supabase'

export default async function ResultsPage() {
  const { data: results } = await supabase
    .from('hk_ekiden_results')
    .select(`*, hk_teams(name, short_name, color_code)`)
    .eq('race_year', 2026)
    .eq('race_name', '第102回箱根駅伝総合')
    .order('rank')

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

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-red-500 text-xs tracking-widest mb-1 font-medium">2026年1月2〜3日</p>
          <h1 className="text-2xl font-medium mb-1">第102回箱根駅伝　総合成績</h1>
          <p className="text-gray-400 text-sm">全10区間 217.1km</p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-800">
              <th className="text-left pb-3 w-10">順位</th>
              <th className="text-left pb-3">大学</th>
              <th className="text-right pb-3">総合タイム</th>
            </tr>
          </thead>
          <tbody>
            {results?.map((r: any) => (
              <tr key={r.id} className={`border-b border-gray-900 hover:bg-gray-900 ${r.rank === 1 ? 'bg-yellow-950' : ''}`}>
                <td className="py-3">
                  <span className={`text-sm font-medium ${
                    r.rank === 1 ? 'text-yellow-400' :
                    r.rank === 2 ? 'text-gray-300' :
                    r.rank === 3 ? 'text-amber-600' :
                    'text-gray-500'
                  }`}>{r.rank}</span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: r.hk_teams?.color_code ?? '#888' }} />
                    <span className="font-medium">{r.hk_teams?.name}</span>
                  </div>
                </td>
                <td className="py-3 text-right font-medium tabular-nums">
                  {r.time_display}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-500">
          出典：関東学生陸上競技連盟公式サイト。区間成績は順次追加予定。
        </div>
      </div>
    </main>
  )
}
```

保存できたらターミナルで：
```
git add .
git commit -m "第102回総合成績ページ（公式データ）"
git push