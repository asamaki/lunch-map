import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ランチマップ - 東京のランチスポット検索" },
    { name: "description", content: "東京都内のランチスポットを地図で簡単検索。料理ジャンル、価格帯、営業時間で絞り込み可能。" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            🍽️ ランチマップ
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            東京都内のランチスポットを地図で探そう
          </p>
          <Link
            to="/map"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            地図を見る
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">地図で探す</h3>
            <p className="text-gray-600">
              直感的な地図操作で周辺のランチスポットを発見
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">詳細検索</h3>
            <p className="text-gray-600">
              料理ジャンル、価格帯、営業時間で絞り込み
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">⏰</div>
            <h3 className="text-xl font-semibold mb-2">リアルタイム情報</h3>
            <p className="text-gray-600">
              営業状況と混雑状況を確認してスムーズなランチを
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            対応エリア
          </h2>
          <div className="flex justify-center items-center space-x-8">
            <div className="text-center">
              <div className="text-green-600 font-semibold">✅ 東京都</div>
              <div className="text-sm text-gray-600">全エリア対応</div>
            </div>
            <div className="text-center">
              <Link 
                to="/coming-soon"
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                🔜 その他地域
              </Link>
              <div className="text-sm text-gray-600">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
