export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-lg font-medium tracking-wide">箱根駅伝家族！</a>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="hover:text-white">出場校</a>
          <a href="/athletes" className="hover:text-white">選手一覧</a>
        </nav>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-medium mb-8">免責事項</h1>

        <div className="text-sm text-gray-300 leading-relaxed flex flex-col gap-6">
          <section>
            <h2 className="text-base font-medium text-white mb-2">当サイトの情報について</h2>
            <p>箱根駅伝家族！（以下「当サイト」）は、箱根駅伝をはじめとする大学長距離競技の非公式ファンサイトです。当サイトに掲載されている選手記録・成績データは、公開されている情報を基に集計したものであり、公式記録とは異なる場合があります。正確な公式記録については、関東学生陸上競技連盟等の公式サイトをご確認ください。</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">損害等の責任について</h2>
            <p>当サイトに掲載された情報を利用することで生じた損害に対して、当サイトは一切の責任を負いません。また、当サイトからリンクやバナーなどによって他のサイトに移動された場合、移動先サイトで提供される情報やサービスについても責任を負いません。</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">著作権について</h2>
            <p>当サイトで掲載している文章や画像などのコンテンツの著作権は、当サイト運営者に帰属します。無断転載は禁止いたします。ただし、選手の記録データについては公知の情報を基にしたものであり、各大会主催者および関連団体の権利を侵害する意図はありません。</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">リンクについて</h2>
            <p>当サイトは基本的にリンクフリーです。リンクを貼る際の連絡は不要です。ただし、インラインフレームの使用やサイトの内容を誤解させるような形でのリンクはお断りいたします。</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">当サイトの運営について</h2>
            <div className="mt-2 text-gray-400">
              <p>サイト名: 箱根駅伝家族！</p>
              <p>URL: <a href="https://hakone-fan.com" className="text-red-400">https://hakone-fan.com</a></p>
              <p>お問い合わせ: <a href="mailto:hakone-fan@outlook.jp" className="text-red-400">hakone-fan@outlook.jp</a></p>
              <p>X (Twitter): <a href="https://x.com/hakone_fan" target="_blank" rel="noopener noreferrer" className="text-red-400">@hakone_fan</a></p>
            </div>
          </section>

          <p className="text-gray-500 mt-4">制定日: 2026年3月31日</p>
        </div>
      </div>
    </main>
  )
}
