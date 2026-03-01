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
                    {/* 注意事項 */}
                    <section className="bg-amber-50 p-6 sm:p-8 rounded-2xl shadow-sm border border-amber-200">
                        <div className="flex items-center gap-3 mb-4">
                            <Info className="text-amber-600" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">はじめに（注意事項）</h2>
                        </div>
                        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-4">
                            本アプリのご利用にあたり、以下の点につきましてあらかじめご了承ください。
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2 text-sm sm:text-base">
                            <li>レシートの読み込み結果は、撮影時の明るさやピント、しわなどの状態によって誤りや欠落が生じる場合があります。</li>
                            <li>読み込んだレシートのデータは、最初から「農業の経費」であることを前提として処理・判定されます。</li>
                            <li>AIによる科目の自動判定は、一般的な知識や傾向をもとに行っております。お客様の実際の申告内容や用途によっては、最適な科目と異なる場合があります。</li>
                            <li><strong>読み取り後の金額や科目につきましては、必ずご自身で内容をご確認いただき、必要に応じて修正してからご利用ください。</strong></li>
                        </ul>
                    </section>
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
                            <li>画像を選択すると自動で最適化され、読み取りの準備が完了します。用途に応じて<strong>「合計額で取込」</strong>か<strong>「明細で取込」</strong>を選択してください。</li>
                            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm text-slate-500">
                                <li><strong>合計額で取込:</strong> レシート1枚につき、合計金額を1件の品目として取り込みます（品目名は「〜など」となります）。</li>
                                <li><strong>明細で取込:</strong> レシートに記載されている品目ごとに、複数件のデータとして取り込みます。</li>
                            </ul>
                            <li className="mt-2">
                                このアプリは農業経営に特化した仕様です。レシートの内容から、農業用の青色申告決算書に準拠した勘定科目をAIが自動で推論・判定します。<br />
                                単に科目を提示するだけでなく、「なぜその科目と判定したのか」という理由や、「農業経費とする際の注意点・ワンポイントアドバイス」も合わせて確認することができます。
                            </li>
                            <li>読み取った品目は1件ずつ内容を確認できます。AIからのアドバイスを参考に必要に応じて内容を修正し、「取込」または「破棄」を選択してください。</li>
                            <li>「取込」を選択すると、該当データがGoogle Driveとスプレッドシートへ自動保存されます。</li>
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
                            <li>また、スプレッドシートのデータを直接更新することも可能です。更新した内容はアプリの履歴画面にも反映されます。</li>
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
