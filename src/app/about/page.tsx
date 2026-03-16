import Link from 'next/link';
import { ChevronLeft, Info, UploadCloud, Scissors, Edit3, Trash2 } from 'lucide-react';

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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">アプリの使い方</h1>
                </div>

                <div className="space-y-8">
                    {/* はじめに（注意事項） */}
                    <section className="bg-amber-50 p-6 sm:p-8 rounded-2xl shadow-sm border border-amber-200">
                        <div className="flex items-center gap-3 mb-4">
                            <Info className="text-amber-600" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">はじめに（注意事項）</h2>
                        </div>
                        <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                            <p>本アプリをご利用になる前に、以下の点をあらかじめご確認ください。</p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>撮影時の明るさ・ピント・用紙のしわなどの状態によっては、読み取り結果に誤りや欠落が生じる場合があります。</li>
                                <li>読み込んだレシートのデータは、農業経費であることを前提として処理・判定されます。農業以外の用途での使用には適しません。</li>
                                <li>AIによる科目の自動判定は、一般的な知識や傾向をもとに行います。実際の申告内容や用途によっては、最適な科目と一致しない場合があります。</li>
                                <li><strong>読み取り後の金額・科目は、必ずご自身で内容を確認し、必要に応じて修正してからご利用ください。</strong></li>
                            </ul>
                        </div>
                    </section>

                    {/* 1. レシートの読み取り */}
                    <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <UploadCloud size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">1. レシートの読み取り（アップロード）</h2>
                        </div>
                        <div className="space-y-4 text-slate-600">
                            <p>トップ画面の読み取りエリアから、レシートや領収書の画像を選択するか、カメラで撮影します。画像を選択すると自動で最適化され、読み取りの準備が完了します。用途に応じて、以下のいずれかの取込方法を選択してください。</p>
                            
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold text-slate-700 w-1/3">取込方法</th>
                                            <th className="px-4 py-2 text-left font-semibold text-slate-700">内容</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="px-4 py-3 font-medium text-slate-800 bg-slate-50/30 text-xs sm:text-sm">合計額で取込</td>
                                            <td className="px-4 py-3 text-xs sm:text-sm">レシート1枚を1件として登録。品目名は、明細が1件の場合はその品目名、複数ある場合は「1件目の品目名＋など」となります</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-medium text-slate-800 bg-slate-50/30 text-xs sm:text-sm">明細で取込</td>
                                            <td className="px-4 py-3 text-xs sm:text-sm">レシートに記載された品目ごとに、複数件のデータとして登録します</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p>読み取った品目は1件ずつ内容を確認し、必要に応じて修正した上で「取込」または「破棄」を選択してください。「取込」を選択すると、該当データがGoogle スプレッドシートとGoogle ドライブへ自動保存されます。</p>
                        </div>
                    </section>

                    {/* 2. 科目の判断 */}
                    <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                                <Scissors size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">2. 科目の判断</h2>
                        </div>
                        <div className="space-y-4 text-slate-600">
                            <p>読み取った内容をもとに、農業用青色申告決算書に準拠した勘定科目をAIが自動で判定します。判定科目とあわせて、判定理由と農業経費計上時のワンポイントアドバイスも確認できます。</p>
                            <p>地域の慣習やご自身の申告条件など、特有の科目・条件がある場合は、<strong>「カスタマイズ」</strong>画面からその内容を指定してください。AIは登録されたカスタマイズ内容を最優先として科目を判断します。</p>
                        </div>
                    </section>

                    {/* 3. データの編集 */}
                    <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                <Edit3 size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">3. データの編集</h2>
                        </div>
                        <div className="space-y-4 text-slate-600">
                            <p>トップ画面下部の「読取履歴・AI検索」リストから、過去のデータを直接編集できます。</p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>各行の右端にある<strong>編集アイコン（鉛筆マーク）</strong>をクリックすると、その行が入力フォームに切り替わります。</li>
                                <li>内容を修正後、緑色のチェックマークボタンを押すとスプレッドシートのデータが更新されます。</li>
                                <li>スプレッドシート上でデータを直接編集することも可能です。編集内容はアプリの履歴画面にも反映されます。</li>
                            </ul>
                        </div>
                    </section>

                    {/* 4. データの削除 */}
                    <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                                <Trash2 size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">4. データの削除</h2>
                        </div>
                        <div className="space-y-4 text-slate-600">
                            <p>履歴リストの各行の右端にある<strong>削除アイコン（ゴミ箱マーク）</strong>からデータを削除できます。</p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>確認ダイアログで「OK」を押すと、スプレッドシート上の該当行が削除されます。</li>
                                <li>同時に、Google ドライブに保存されている関連のレシート画像もゴミ箱へ自動移動します。ストレージ容量を不必要に消費しません。</li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
