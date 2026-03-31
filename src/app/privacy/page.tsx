export default function PrivacyPage() {
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
        <h1 className="text-2xl font-medium mb-8">プライバシーポリシー</h1>

        <div className="text-sm text-gray-300 leading-relaxed flex flex-col gap-6">
          <p>箱根駅伝DATA（以下「当サイト」）は、ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。</p>

          <section>
            <h2 className="text-base font-medium text-white mb-2">1. 個人情報の収集について</h2>
            <p>当サイトでは、応援メッセージの投稿時にニックネームをご入力いただく場合があります。メールアドレス等の個人を特定できる情報の入力は求めておりません。</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">2. 個人情報の利用目的</h2>
            <p>収集した情報は、以下の目的で利用いたします。</p>
            <ul className="list-disc list-inside mt-2 text-gray-400 space-y-1">
              <li>応援メッセージの表示</li>
              <li>サイトの改善・運営</li>
              <li>お問い合わせへの対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">3. 広告について</h2>
            <p>当サイトでは、第三者配信の広告サービス（Google AdSense）を利用する場合があります。広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie（クッキー）を使用することがあります。Cookieを無効にする設定およびGoogleアドセンスに関する詳細は、<a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">広告 - ポリシーと規約 - Google</a> をご確認ください。</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">4. アクセス解析ツールについて</h2>
            <p>当サイトでは、Googleによるアクセス解析ツール「Google アナリティクス」を利用する場合があります。Google アナリティクスはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。この機能はCookieを無効にすることで収集を拒否できます。</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">5. 個人情報の第三者提供</h2>
            <p>当サイトは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。</p>
            <ul className="list-disc list-inside mt-2 text-gray-400 space-y-1">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">6. Cookie（クッキー）について</h2>
            <p>当サイトでは、一部のコンテンツにおいてCookieを利用しています。Cookieとは、Webサイトがユーザーのコンピュータに保存する小さなファイルです。ブラウザの設定によりCookieを無効にすることが可能です。</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">7. 免責事項</h2>
            <p>当サイトに掲載された情報の正確性には万全を期しておりますが、その内容を保証するものではありません。当サイトの利用により生じた損害について、一切の責任を負いかねます。</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">8. プライバシーポリシーの変更</h2>
            <p>当サイトは、個人情報に関して適用される日本の法令を遵守するとともに、本ポリシーの内容を適宜見直し改善に努めます。修正された最新のプライバシーポリシーは常に本ページにて公開されます。</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-white mb-2">9. お問い合わせ</h2>
            <p>当サイトのプライバシーポリシーに関するお問い合わせは、下記までご連絡ください。</p>
            <div className="mt-2 text-gray-400">
              <p>サイト名: 箱根駅伝DATA</p>
              <p>URL: <a href="https://hakone-fan.com" className="text-red-400">https://hakone-fan.com</a></p>
              <p>メール: <a href="mailto:hakone-fan@outlook.jp" className="text-red-400">hakone-fan@outlook.jp</a></p>
            </div>
          </section>

          <p className="text-gray-500 mt-4">制定日: 2026年3月31日</p>
        </div>
      </div>
    </main>
  )
}
