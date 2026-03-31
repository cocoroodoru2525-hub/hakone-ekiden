import { supabase } from '@/lib/supabase'

function renderMarkdown(body: string) {
  const lines = body.split('\n')
  const elements: any[] = []
  let inTable = false
  let tableRows: string[][] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // テーブル区切り行はスキップ
    if (/^\| *---/.test(line)) continue

    // テーブル行
    if (line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
      if (!inTable) {
        inTable = true
        tableRows = []
      }
      tableRows.push(cells)
      // 次の行がテーブルでなければテーブルを出力
      if (i + 1 >= lines.length || !lines[i + 1].startsWith('|')) {
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  {tableRows[0]?.map((cell, ci) => (
                    <th key={ci} className="text-left py-2 px-3 text-gray-400 text-xs">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-800 hover:bg-gray-900">
                    {row.map((cell, ci) => (
                      <td key={ci} className={`py-2 px-3 ${ci === 3 ? 'font-mono text-red-400' : ''}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        inTable = false
        tableRows = []
      }
      continue
    }

    // 見出し
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-medium mt-6 mb-3 text-white">{line.replace('## ', '')}</h2>
      )
      continue
    }

    // 空行
    if (!line.trim()) {
      continue
    }

    // 通常テキスト
    elements.push(
      <p key={i} className="text-sm text-gray-300 leading-relaxed mb-2">{line}</p>
    )
  }

  return elements
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: post } = await supabase
    .from('hk_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl mb-4">記事が見つかりません</h1>
          <a href="/news" className="text-red-400 hover:underline text-sm">ニュース一覧に戻る</a>
        </div>
      </main>
    )
  }

  const categoryLabel: Record<string, string> = {
    result: '大会結果',
    news: 'ニュース',
    column: 'コラム',
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-lg font-medium tracking-wide">箱根駅伝DATA</a>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="hover:text-white">出場校</a>
          <a href="/athletes" className="hover:text-white">選手一覧</a>
          <a href="/news" className="text-white">ニュース</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">
            {categoryLabel[post.category] || post.category}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(post.created_at).toLocaleDateString('ja-JP')}
          </span>
        </div>

        <h1 className="text-2xl font-medium mb-6">{post.title}</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {renderMarkdown(post.body)}
        </div>

        <div className="mt-6">
          <a href="/news" className="text-gray-500 text-sm hover:text-white">&larr; ニュース一覧に戻る</a>
        </div>
      </div>
    </main>
  )
}
