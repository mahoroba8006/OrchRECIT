import Uploader from '@/components/Uploader';
import { Receipt, Search, History, LogOut, LogIn } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import SignInButton from '@/components/SignInButton';
import HistoryViewer from '@/components/HistoryViewer';
import WorkspaceLinks from '@/components/WorkspaceLinks';

import Image from 'next/image';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="AgriRecit Logo" width={32} height={32} className="rounded-lg shadow-sm" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
              AgriRecit
            </h1>
          </div>

          <nav className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/about" className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors">
                  アプリの説明
                </Link>
                <SignInButton className="text-sm px-4 py-2" isSignIn={false} />
              </>
            ) : (
              <SignInButton isSignIn={true} />
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 text-center">
        {/* Upload Component OR Login Banner */}
        {session ? (
          <>
            <Uploader />
            <WorkspaceLinks />
            <HistoryViewer />
          </>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">機能を利用するにはログインが必要です</h3>
            <p className="text-slate-600 mb-6">
              Google Driveへの画像の保存や、スプレッドシートへの記録を行うため、Googleアカウントでのログインをお願いします。（※フルアクセス権限をリクエストします）
            </p>
            <SignInButton isSignIn={true} className="mx-auto" />
          </div>
        )}
      </section>
    </main>
  );
}
