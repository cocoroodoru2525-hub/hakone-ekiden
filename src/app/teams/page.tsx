import { supabase } from '@/lib/supabase'

export default async function TeamsPage() {
  const { data: teams } = await supabase
    .from('hk_teams')
    .select('*')
    .order('name')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-lg font-medium tracking-wide">箱根駅伝DATA</span>
        </div>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="text-white">出場校</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-xl font-medium mb-6">出場校一覧</h1>
        <div className="grid grid-cols-2 gap-3">
          {teams?.map((team: any) => (
            <div key={team.id}
              className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 flex items-center gap-3 hover:border-gray-600">
              <span className="w-3 h-10 rounded-full flex-shrink-0"
                style={{ background: team.color_code }} />
              <div>
                <div className="font-medium">{team.name}</div>
                <div className="text-xs text-gray-500 mt-1">ID: {team.id}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}