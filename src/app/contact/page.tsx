export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-lg font-medium tracking-wide">箱根駅伝DATA</a>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="hover:text-white">出場校</a>
          <a href="/athletes" className="hover:text-white">選手一覧</a>
        </nav>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-medium mb-8">お問い合わせ</h1>

        <div className="text-sm text-gray-300 leading-relaxed flex flex-col gap-6">
          <p>箱根駅伝DATAに関するお問い合わせは、以下の方法でご連絡ください。</p>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 w-20">メール</span>
              <a href="mailto:hakone-fan@outlook.jp" className="text-red-400 hover:underline">hakone-fan@outlook.jp</a>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 w-20">X (Twitter)</span>
              <a href="https://x.com/hakone_fan" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">@hakone_fan</a>
            </div>
          </div>

          <section>
            <h2 className="text-base font-medium text-white mb-2">お問い合わせ内容について</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>記録データの誤りに関するご指摘</li>
              <li>サイトに関するご意見・ご要望</li>
              <li>掲載内容の削除依頼</li>
              <li>その他のお問い合わせ</li>
            </ul>
          </section>

          <p className="text-gray-500">※ 返信までにお時間をいただく場合がございます。ご了承ください。</p>
        </div>
      </div>
    </main>
  )
}
