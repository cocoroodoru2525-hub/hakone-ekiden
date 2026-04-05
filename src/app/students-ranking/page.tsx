import { supabaseAdmin } from '@/lib/supabase-server'
import Link from 'next/link'

export const revalidate = 86400 // 24時間キャッシュ

const EVENT_LABELS: Record<string, string> = {
  half: 'ハーフマラソン',
  '10000': '10000m',
  '5000': '5000m',
}

export default async function StudentsRankingPage() {
  const { data: records } = await supabaseAdmin
    .from('hk_students_top10')
    .select('*')
    .order('event_type')
    .order('rank')

  const grouped: Record<string, typeof records> = { half: [], '10000': [], '5000': [] }
  for (const r of records ?? []) {
    if (grouped[r.event_type]) grouped[r.event_type]!.push(r)
  }

  const isEmpty = (records ?? []).length === 0

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* ヘッダー */}
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-lg font-medium tracking-wide">箱根駅伝家族！</span>
          <span className="ml-3 text-xs text-gray-500 tracking-widest">応援特化型・箱根駅伝サイト</span>
        </div>
        <nav className="flex gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">トップ</Link>
          <Link href="/teams" className="hover:text-white">出場校</Link>
          <Link href="/records" className="hover:text-white">選手記録</Link>
          <Link href="/students-ranking" className="text-white">学生歴代</Link>
          <Link href="/news" className="hover:text-white">ニュース</Link>
          <Link href="/admin" className="hover:text-white">管理</Link>
          <a href="https://x.com/hakone_fan" target="_blank" rel="noopener noreferrer" className="hover:text-white" title="X (Twitter)">𝕏</a>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-red-500 text-xs tracking-widest mb-1 font-medium">ALL TIME BEST</p>
          <h1 className="text-2xl font-medium">日本学生歴代10傑</h1>
          <p className="text-gray-500 text-xs mt-1">出典: <a href="https://rokuroman.sakura.ne.jp/gakuseirekidai.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">六郎丸陸上競技記録</a></p>
        </div>

        {isEmpty ? (
          <div className="text-center py-20 text-gray-500">
            <p>データを読み込み中です。</p>
            <p className="text-xs mt-2">管理画面から「学生歴代10傑を更新」を実行してください。</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {(['half', '10000', '5000'] as const).map(eventType => {
              const eventRecords = grouped[eventType] ?? []
              if (eventRecords.length === 0) return null
              return (
                <section key={eventType}>
                  <h2 className="text-xs font-medium text-gray-400 tracking-widest mb-4 pb-2 border-b border-gray-800">
                    {EVENT_LABELS[eventType]}
                  </h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs border-b border-gray-800">
                        <th className="text-left py-2 w-8">#</th>
                        <th className="text-left py-2">選手</th>
                        <th className="text-left py-2">所属</th>
                        <th className="text-right py-2">記録</th>
                        <th className="text-right py-2 hidden sm:table-cell">日付</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventRecords.map((r: any) => (
                        <tr key={r.id} className="border-b border-gray-900 hover:bg-gray-900">
                          <td className="py-2.5 text-gray-500 text-xs">{r.rank}</td>
                          <td className="py-2.5 font-medium">{r.athlete_name}</td>
                          <td className="py-2.5 text-gray-400 text-xs">{r.school}</td>
                          <td className="py-2.5 text-right font-mono text-red-400">{r.time_display}</td>
                          <td className="py-2.5 text-right text-gray-500 text-xs hidden sm:table-cell">{r.competition_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
