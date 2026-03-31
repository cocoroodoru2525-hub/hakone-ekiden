import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: teams } = await supabase
    .from('hk_teams')
    .select('*')
    .order('sort_order')

  const { data: records } = await supabase
    .from('hk_records')
    .select(`
      *,
      hk_athletes (
        name,
        hk_teams ( name, short_name, color_code )
      )
    `)
    .eq('is_pb', true)
    .eq('event_type', 'half')
    .order('time_seconds')
    .limit(10)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* ヘッダー */}
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-lg font-medium tracking-wide">箱根駅伝DATA</span>
          <span className="ml-3 text-xs text-gray-500 tracking-widest">HAKONE EKIDEN FAN SITE</span>
        </div>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="text-white">トップ</a>
          <a href="/teams" className="hover:text-white">出場校</a>
          <a href="/records" className="hover:text-white">選手記録</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      {/* ヒーロー */}
      <section className="bg-black px-6 py-8 border-b border-gray-800">
        <p className="text-red-500 text-xs tracking-widest mb-2 font-medium">2027年1月 第103回大会に向けて</p>
        <h1 className="text-3xl font-medium mb-2">選手の年間記録をリアルタイムで追う</h1>
        <p className="text-gray-400 text-sm">出場30校・選手の5000m・10000m・ハーフのベスト記録を集約。大会ごとの結果も随時更新。</p>
        <div className="flex gap-4 mt-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-center">
            <div className="text-2xl font-medium">{teams?.length ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">出場校</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-center">
            <div className="text-2xl font-medium">{records?.length ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">記録件数</div>
          </div>
        </div>
      </section>

      {/* メインコンテンツ */}
      <section className="px-6 py-6 grid grid-cols-3 gap-6">
        {/* 記録ランキング */}
        <div className="col-span-2">
          <h2 className="text-xs font-medium text-gray-400 tracking-widest mb-4 pb-2 border-b border-gray-800">
            ハーフマラソン記録ランキング（PB）
          </h2>
          {records && records.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  <th className="text-left pb-2">#</th>
                  <th className="text-left pb-2">選手</th>
                  <th className="text-right pb-2">記録</th>
                  <th className="text-left pb-2 pl-4">大会</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r: any, i: number) => (
                  <tr key={r.id} className="border-b border-gray-900 hover:bg-gray-900">
                    <td className="py-2 text-gray-500 text-xs">{i + 1}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: r.hk_athletes?.hk_teams?.color_code ?? '#888' }}
                        />
                        <span className="font-medium">{r.hk_athletes?.name}</span>
                        <span className="text-xs text-gray-500">{r.hk_athletes?.hk_teams?.short_name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums text-red-400">{r.time_display}</td>
                    <td className="py-2 pl-4 text-xs text-gray-500">{r.competition_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm">まだ記録が登録されていません。</p>
          )}
        </div>

        {/* 出場校リスト */}
        <div>
          <h2 className="text-xs font-medium text-gray-400 tracking-widest mb-4 pb-2 border-b border-gray-800">
            出場校一覧
          </h2>
          <div className="flex flex-col gap-0">
            {teams?.map((team: any) => (
              <div key={team.id} className="flex items-center gap-2 py-2 border-b border-gray-900 hover:bg-gray-900 px-1">
                <span className="w-1 h-5 rounded-full" style={{ background: team.color_code }} />
                <span className="text-sm font-medium">{team.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}