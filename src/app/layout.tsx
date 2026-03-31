import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "家族で楽しむ！箱根駅伝DATA | 選手記録・PBランキング・応援サイト",
  description: "家族で箱根駅伝をもっと楽しもう！出場校の選手記録をリアルタイムで追跡。5000m・10000m・ハーフマラソンのPBランキング、大会結果、選手応援メッセージ機能を搭載。",
  keywords: "箱根駅伝, 駅伝, 大学駅伝, 選手記録, PB, ランキング, 応援, 陸上競技, 長距離",
  openGraph: {
    title: "家族で楽しむ！箱根駅伝DATA",
    description: "家族で箱根駅伝をもっと楽しもう！選手記録をリアルタイムで追跡するファンサイト",
    url: "https://hakone-fan.com",
    siteName: "箱根駅伝DATA",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@hakone_fan",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >

      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1145859481451122"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="bg-black border-t border-gray-800 px-6 py-8 mt-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <div className="text-sm font-medium text-white mb-2">箱根駅伝DATA</div>
                <p className="text-xs text-gray-500 max-w-sm">
                  家族みんなで箱根駅伝をもっと楽しもう！選手の年間記録をリアルタイムで追跡する非公式ファンサイトです。
                </p>
              </div>
              <div className="flex gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-500 font-medium">コンテンツ</span>
                  <a href="/" className="text-xs text-gray-400 hover:text-white">トップ</a>
                  <a href="/teams" className="text-xs text-gray-400 hover:text-white">出場校</a>
                  <a href="/athletes" className="text-xs text-gray-400 hover:text-white">選手一覧</a>
                  <a href="/results" className="text-xs text-gray-400 hover:text-white">リザルト</a>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-500 font-medium">サイト情報</span>
                  <a href="/privacy" className="text-xs text-gray-400 hover:text-white">プライバシーポリシー</a>
                  <a href="/disclaimer" className="text-xs text-gray-400 hover:text-white">免責事項</a>
                  <a href="/contact" className="text-xs text-gray-400 hover:text-white">お問い合わせ</a>
                  <a href="https://x.com/hakone_fan" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-white">X (Twitter)</a>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-6 pt-4 text-center">
              <p className="text-xs text-gray-600">&copy; 2026 箱根駅伝DATA. All rights reserved. 非公式ファンサイト</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
