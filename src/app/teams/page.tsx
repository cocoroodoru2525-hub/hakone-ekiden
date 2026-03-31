import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function TeamsPage() {
  const { data: teams } = await supabase
    .from('hk_teams')
    .select('*')
    .order('sort_order')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-medium tracking-wide">箱根駅伝DATA</span>
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
        <h1 className="text-2xl font-medium mb-6">出場校一覧</h1>

        {(() => {
          const mainTeams = teams?.filter((t: any) => t.category === 'main' || !t.category) ?? []
          const qualifierTeams = teams?.filter((t: any) => t.category === 'qualifier') ?? []
          const otherTeams = teams?.filter((t: any) => t.category === 'other') ?? []

          const TeamCard = ({ team }: { team: any }) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 flex items-center gap-3 hover:border-gray-600 cursor-pointer transition">
                <span className="w-3 h-10 rounded-full flex-shrink-0"
                  style={{ background: team.color_code }} />
                <div>
                  <div className="font-medium text-sm">{team.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{team.short_name}</div>
                </div>
              </div>
            </Link>
          )

          return (
            <div className="space-y-8">
              {mainTeams.length > 0 && (
                <div>
                  <h2 className="text-xs font-medium text-red-500 tracking-widest mb-3 pb-2 border-b border-gray-800">
                    本選出場校（{mainTeams.length}校）
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {mainTeams.map((team: any) => <TeamCard key={team.id} team={team} />)}
                  </div>
                </div>
              )}
              {qualifierTeams.length > 0 && (
                <div>
                  <h2 className="text-xs font-medium text-yellow-500 tracking-widest mb-3 pb-2 border-b border-gray-800">
                    予選会出場校（{qualifierTeams.length}校）
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {qualifierTeams.map((team: any) => <TeamCard key={team.id} team={team} />)}
                  </div>
                </div>
              )}
              {otherTeams.length > 0 && (
                <div>
                  <h2 className="text-xs font-medium text-gray-500 tracking-widest mb-3 pb-2 border-b border-gray-800">
                    その他（{otherTeams.length}校）
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {otherTeams.map((team: any) => <TeamCard key={team.id} team={team} />)}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </main>
  )
}
