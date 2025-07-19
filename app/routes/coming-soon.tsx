import type { Route } from "./+types/coming-soon";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Coming Soon - ランチマップ" },
    { name: "description", content: "東京以外の地域も順次対応予定です。お楽しみに！" },
  ];
}

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-6xl mb-8">🚧</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Coming Soon
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            東京以外の地域も順次対応予定です
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              展開予定エリア
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🌆</span>
                <div>
                  <div className="font-semibold">大阪府</div>
                  <div className="text-sm text-gray-600">2024年春予定</div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">🏯</span>
                <div>
                  <div className="font-semibold">愛知県（名古屋）</div>
                  <div className="text-sm text-gray-600">2024年夏予定</div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">🍜</span>
                <div>
                  <div className="font-semibold">福岡県</div>
                  <div className="text-sm text-gray-600">2024年秋予定</div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">⛩️</span>
                <div>
                  <div className="font-semibold">京都府</div>
                  <div className="text-sm text-gray-600">2024年冬予定</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-x-4">
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              ホームに戻る
            </Link>
            <Link
              to="/map"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              東京の地図を見る
            </Link>
          </div>

          <div className="mt-12 text-sm text-gray-500">
            <p>
              サービス展開の最新情報は随時更新いたします。<br />
              まずは東京でのサービスをお楽しみください！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}