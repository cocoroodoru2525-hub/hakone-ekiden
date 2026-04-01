import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function TeamsPage() {
  const { data: teams } = await supabase
    .from('hk_teams')
    .select('*')
    .order('sort_order')

  const mainTeams = teams?.filter((t: any) => t.category === 'main' || !t.category) ?? []
  const qualifierTeams = teams?.filter((t: any) => t.category === 'qualifier') ?? []
  const otherTeams = teams?.filter((t: any) => t.category === 'other') ?? []

  // シード校（前回大会上位10校）と予選会通過校（11-20位）
  const seedTeams = mainTeams.filter((_: any, i: number) => i < 10)
  const qualifiedFromRace = mainTeams.filter((_: any, i: number) => i >= 10)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-lg font-medium tracking-wide">箱根駅伝家族！</a>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="text-white">出場校</a>
          <a href="/athletes" className="hover:text-white">選手一覧</a>
          <a href="/results" className="hover:text-white">リザルト</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-red-500 text-xs tracking-widest mb-2 font-medium">TEAMS</p>
        <h1 className="text-2xl font-medium mb-4">出場校一覧</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 text-sm text-gray-400">
          <p>箱根駅伝（東京箱根間往復大学駅伝競走）は<span className="text-white">関東学生陸上競技連盟</span>に加盟する大学のみ出場できる関東の大会です。</p>
          <p className="mt-1">前回大会上位10校が<span className="text-red-400">シード校</span>として出場権を獲得し、残り10枠は<span className="text-yellow-400">予選会</span>（10月開催）の上位校に与えられます。</p>
        </div>

        <div className="space-y-8">
          {/* 第103回シード校 */}
          {seedTeams.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-red-500 tracking-widest mb-3 pb-2 border-b border-gray-800">
                第103回 シード校（第102回上位10校）
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {seedTeams.map((team: any) => (
                  <Link key={team.id} href={`/teams/${team.id}`}>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 flex items-center gap-3 hover:border-gray-600 cursor-pointer transition">
                      <span className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: team.color_code }} />
                      <div>
                        <div className="font-medium text-sm">{team.name}</div>
                        <div className="text-xs text-gray-500 mt-1">第102回 総合{team.sort_order}位</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 第103回予選会通過校 */}
          <div>
            <h2 className="text-xs font-medium text-yellow-500 tracking-widest mb-3 pb-2 border-b border-gray-800">
              第103回 予選会通過校
            </h2>
            <p className="text-sm text-gray-500">2026年10月の予選会結果発表後に更新されます</p>
          </div>

          {/* 第102回予選会通過校（前回本選出場） */}
          {qualifiedFromRace.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-gray-400 tracking-widest mb-3 pb-2 border-b border-gray-800">
                第102回 予選会通過校（前回本選出場）
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {qualifiedFromRace.map((team: any) => (
                  <Link key={team.id} href={`/teams/${team.id}`}>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 flex items-center gap-3 hover:border-gray-600 cursor-pointer transition">
                      <span className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: team.color_code }} />
                      <div>
                        <div className="font-medium text-sm">{team.name}</div>
                        <div className="text-xs text-gray-500 mt-1">第102回 総合{team.sort_order}位</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 前回予選会出場校 */}
          {qualifierTeams.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-gray-500 tracking-widest mb-3 pb-2 border-b border-gray-800">
                前回予選会出場校（{qualifierTeams.length}校）
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {qualifierTeams.map((team: any) => (
                  <Link key={team.id} href={`/teams/${team.id}`}>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 flex items-center gap-3 hover:border-gray-600 cursor-pointer transition">
                      <span className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: team.color_code }} />
                      <div>
                        <div className="font-medium text-sm">{team.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{team.short_name}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* その他の関東大学 */}
          {otherTeams.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-gray-500 tracking-widest mb-3 pb-2 border-b border-gray-800">
                その他の関東大学（{otherTeams.length}校）
              </h2>
              <p className="text-xs text-gray-600 mb-3">記録会等で記録のある関東学連加盟校</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {otherTeams.map((team: any) => (
                  <Link key={team.id} href={`/teams/${team.id}`}>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 flex items-center gap-3 hover:border-gray-600 cursor-pointer transition">
                      <span className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: team.color_code }} />
                      <div>
                        <div className="font-medium text-sm">{team.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{team.short_name}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
