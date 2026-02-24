import Link from 'next/link';
import { ChevronLeft, Info, UploadCloud, Edit3, Trash2 } from 'lucide-react';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-slate-50 pb-12">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center">
                    <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                        <ChevronLeft size={20} />
                        トップへ戻る
                    </Link>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12">
                <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
                    <Info className="text-blue-600" size={28} />
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">アプリの説明と使い方</h1>
                </div>

                <div className="space-y-8">
                    {/* 読取 */}
                    <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <UploadCloud size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">1. レシートの読取（アップロード）</h2>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 ml-2">
                            <li>トップ画面のエリアから、レシートや領収書の画像を選択するか、カメラで撮影します。</li>
                            <li>画像を選択すると自動で最適化（圧縮）され、AIが内容を読み取ります。</li>
                            <li>**【農業特化仕様】** レシートの内容から、農業用の青色申告決算書に準拠した勘定科目（種苗費、肥料費、農薬衛生費など）をAIが自動で判定します。</li>
                            <li>農薬や肥料の銘柄・成分名なども正確に抽出するため、後から栽培履歴等の管理に活用しやすくなっています。</li>
                            <li>読み取りが完了すると該当データが画面に表示され、同時にGoogle Driveとスプレッドシートへ自動保存されます。</li>
                            <li>過去と全く同じ内容の支払いが見つかった場合は、重複アラートが表示されて二重登録を防止します。</li>
                        </ul>
                    </section>

                    {/* 編集 */}
                    <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                <Edit3 size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">2. データの編集</h2>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 ml-2">
                            <li>トップ画面下部の「読取履歴・AI検索」リストから、過去のデータを直接編集することができます。</li>
                            <li>各行の右端にある「編集アイコン（鉛筆マーク）」をクリックすると、その行の項目が入力フォームに切り替わります。</li>
                            <li>内容を自由に修正した後、緑色のチェックマークボタンを押すとスプレッドシートのデータが更新されます。</li>
                        </ul>
                    </section>

                    {/* 削除 */}
                    <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                                <Trash2 size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">3. データの削除</h2>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 ml-2">
                            <li>履歴リストの各行の右端にある「削除アイコン（ゴミ箱マーク）」からデータを削除できます。</li>
                            <li>確認ダイアログで「OK」を押すと、スプレッドシート上の該当行のデータが削除されます。</li>
                            <li>さらに、Google Driveに保存されている関連のレシート画像本体も自動的にゴミ箱へ移動し削除されるため、ストレージの容量を圧迫しません。</li>
                        </ul>
                    </section>
                </div>
            </div>
        </main>
    );
}
