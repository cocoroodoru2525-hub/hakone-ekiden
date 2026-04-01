import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function NewsPage() {
  const { data: posts } = await supabase
    .from('hk_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(50)

  const categoryLabel: Record<string, string> = {
    result: '大会結果',
    news: 'ニュース',
    column: 'コラム',
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-lg font-medium tracking-wide">箱根駅伝家族！</a>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="hover:text-white">出場校</a>
          <a href="/athletes" className="hover:text-white">選手一覧</a>
          <a href="/news" className="text-white">ニュース</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-red-500 text-xs tracking-widest mb-2 font-medium">NEWS</p>
        <h1 className="text-2xl font-medium mb-6">ニュース・大会結果</h1>

        {!posts || posts.length === 0 ? (
          <p className="text-gray-500 text-sm">まだ記事がありません。</p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post: any) => (
              <Link key={post.id} href={`/news/${post.slug}`}>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-600 transition cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                      {categoryLabel[post.category] || post.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <h2 className="text-sm font-medium">{post.title}</h2>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
