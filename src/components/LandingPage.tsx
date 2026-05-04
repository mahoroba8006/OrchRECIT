"use client";

import Link from 'next/link';
import { useEffect, useRef, ReactNode } from 'react';
import {
  Camera, Sparkles, HardDrive, FileSpreadsheet,
  BookOpen, SlidersHorizontal, ShieldCheck,
  ArrowRight, CheckCheck, AlertCircle, Clock, Leaf,
} from 'lucide-react';

/* ── Intersection Observer で scroll-triggered fade-in ── */
function FadeIn({ children, delay = 0, style }: {
  children: ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      setTimeout(() => {
        if (!el) return;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay * 1000);
      obs.unobserve(el);
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} style={{
      opacity: 0,
      transform: 'translateY(28px)',
      transition: 'opacity 0.65s cubic-bezier(.22,1,.36,1), transform 0.65s cubic-bezier(.22,1,.36,1)',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── データ定義 ── */
const pains = [
  { icon: <Clock size={24} strokeWidth={1.5} />, text: '確定申告の時期に、領収書を探し回ることがある' },
  { icon: <AlertCircle size={24} strokeWidth={1.5} />, text: '勘定科目が正しいか、毎回不安になる' },
  { icon: <Leaf size={24} strokeWidth={1.5} />, text: '記帳が面倒で後回しにしてしまう' },
];

const features = [
  {
    icon: <Camera size={22} />, color: '#72D07C', bg: '#e3f4e5',
    title: 'カメラ撮影 → 自動読取',
    desc: 'スマホで撮るだけ。OCR が購入日・支払先・金額を自動で入力します。',
  },
  {
    icon: <Sparkles size={22} />, color: '#1794D7', bg: '#d9edf8',
    title: '農業専用 AI 科目判定',
    desc: '農業の青色申告決算書に準拠した勘定科目を Gemini AI が自動で判定します。',
  },
  {
    icon: <BookOpen size={22} />, color: '#2faa55', bg: '#dff2e4',
    title: 'ワンポイントアドバイス',
    desc: '「なぜその科目か」判定理由と注意点を毎回解説。使うほど知識が身につきます。',
  },
  {
    icon: <SlidersHorizontal size={22} />, color: '#d98e2b', bg: '#fbecd2',
    title: 'カスタムルール登録',
    desc: '税務署管内の特有処理やご自身の判断基準を AI に直接指示して精度を高めます。',
  },
  {
    icon: <HardDrive size={22} />, color: '#72D07C', bg: '#e3f4e5',
    title: 'データは Google Drive のみ',
    desc: '原本画像も台帳データも、すべてあなたの Google アカウント内に保存されます。',
  },
  {
    icon: <FileSpreadsheet size={22} />, color: '#1794D7', bg: '#d9edf8',
    title: 'スプレッドシート連携',
    desc: '取込データは Google スプレッドシートに自動記録。いつでも確認・編集可能です。',
  },
  {
    icon: <CheckCheck size={22} />, color: '#2faa55', bg: '#dff2e4',
    title: '重複チェック・確認タグ',
    desc: '二重取込を自動検知。固定資産候補・按分確認が必要なレシートには自動でタグ付与。',
  },
];

const steps = [
  {
    icon: <Camera size={28} />,
    title: 'レシートを撮る',
    desc: 'スマホカメラで撮影するか、端末から画像を選択。自動で読取が始まります。',
  },
  {
    icon: <Sparkles size={28} />,
    title: 'AI の判定を確認する',
    desc: 'OCR と科目判定の結果を確認・修正します。アドバイスや判定理由もここで表示。',
  },
  {
    icon: <CheckCheck size={28} />,
    title: '「取込」ボタンで完了',
    desc: '1 タップで Drive と Sheets に自動保存。確定申告時は台帳を開くだけです。',
  },
];

/* ── ロゴ SVG（再利用） ── */
function SproutLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="var(--primary-soft)" />
      <path d="M28 10c-8 0-14 5-14 12 0 3 2 5 5 5 7 0 10-8 9-17z" fill="var(--primary)" />
      <circle cx="14" cy="26" r="4" fill="var(--secondary)" />
    </svg>
  );
}

const ctaStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '15px 36px',
  background: 'var(--primary)',
  color: 'var(--primary-fg)',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 700,
  fontSize: 15,
  textDecoration: 'none',
  boxShadow: '0 2px 0 rgba(0,0,0,.06), 0 12px 28px -8px #72D07C88',
  transition: 'transform .18s, box-shadow .18s',
  cursor: 'pointer',
  border: 'none',
};

export default function LandingPage() {
  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════
          NAV
      ══════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        height: 60,
        background: 'rgba(244,251,244,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SproutLogo size={24} />
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', letterSpacing: '-0.01em' }}>Orch.RECIT</span>
        </div>
        <Link href="/app" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 18px',
          background: 'var(--primary)',
          color: 'var(--primary-fg)',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 700, fontSize: 13,
          textDecoration: 'none',
        }}>
          無料で始める <ArrowRight size={13} />
        </Link>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '120px 24px 80px',
        textAlign: 'center',
      }}>
        {/* 背景装飾 */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: '-15%', left: '-8%',
            width: 600, height: 600,
            background: 'radial-gradient(circle, var(--primary-soft) 0%, transparent 70%)',
            filter: 'blur(40px)', opacity: 0.9,
            animation: 'sproutFloat 18s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', top: '35%', right: '-12%',
            width: 500, height: 500,
            background: 'radial-gradient(circle, var(--secondary-soft) 0%, transparent 70%)',
            filter: 'blur(50px)', opacity: 0.7,
            animation: 'sproutFloat 22s ease-in-out infinite reverse',
          }} />
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
            <defs>
              <pattern id="lp-leaf" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M40 30c-6 0-10 4-10 10s4 10 10 10c0-6-4-10-10-10 6 0 10-4 10-10z" fill="var(--primary)" opacity="0.08" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lp-leaf)" />
          </svg>
        </div>

        {/* コンテンツ */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780 }}>
          {/* バッジ */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 32,
            boxShadow: 'var(--shadow-card)',
            animation: 'slideUp .5s ease both',
          }}>
            <SproutLogo size={16} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>農業経費 AI 領収書アプリ</span>
          </div>

          {/* ヘッドライン */}
          <h1 style={{
            fontSize: 'clamp(38px, 6.5vw, 76px)',
            fontWeight: 900,
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            marginBottom: 28,
            animation: 'slideUp .6s .1s ease both',
          }}>
            農業経費を、<br />
            <span style={{ color: 'var(--primary)', WebkitTextStroke: '0.5px var(--primary)' }}>撮って終わり。</span>
          </h1>

          {/* サブコピー */}
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'var(--ink-soft)',
            lineHeight: 1.85,
            maxWidth: 560,
            margin: '0 auto 44px',
            animation: 'slideUp .6s .2s ease both',
          }}>
            AI がレシートを読んで、農業専用の勘定科目まで判定。<br />
            データはすべてあなたの Google Drive に。外部サーバーは使いません。
          </p>

          {/* CTA */}
          <div style={{ animation: 'slideUp .6s .3s ease both', display: 'inline-block' }}>
            <Link href="/app" style={ctaStyle}>
              Google アカウントで無料で始める
              <ArrowRight size={17} />
            </Link>
          </div>

          <p style={{
            marginTop: 16, fontSize: 13, color: 'var(--ink-mute)',
            animation: 'slideUp .6s .4s ease both',
          }}>
            Google アカウントがあればすぐに使えます・料金は一切かかりません
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PAIN
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>For Farmers</p>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 44, letterSpacing: '-0.01em' }}>
              こんなお悩みありませんか？
            </h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            {pains.map((p, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <div style={{
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  padding: '28px 24px',
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                }}>
                  <div style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }}>{p.icon}</div>
                  <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>{p.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--secondary)', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>Features</p>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 44, letterSpacing: '-0.01em' }}>
              Orch.RECIT でできること
            </h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))', gap: 18 }}>
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  padding: '28px 24px',
                  boxShadow: 'var(--shadow-card)',
                  height: '100%',
                  boxSizing: 'border-box',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: f.bg, color: f.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16, flexShrink: 0,
                  }}>{f.icon}</div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          KNOWLEDGE SPOTLIGHT
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'var(--primary-fg)',
        padding: '88px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: '-20%', right: '-8%',
          width: 480, height: 480,
          background: 'radial-gradient(circle, #72D07C22 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div aria-hidden style={{
          position: 'absolute', bottom: '-15%', left: '-6%',
          width: 380, height: 380,
          background: 'radial-gradient(circle, #1794D722 0%, transparent 65%)',
          filter: 'blur(50px)',
        }} />

        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <FadeIn>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(114,208,124,.12)', border: '1px solid rgba(114,208,124,.22)',
              borderRadius: 100, padding: '6px 18px', marginBottom: 28,
            }}>
              <BookOpen size={13} color="#72D07C" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#72D07C', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Knowledge</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(26px, 4.5vw, 46px)',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: 24,
              letterSpacing: '-0.02em',
            }}>
              使うほど、<br />農業会計の知識が身につく
            </h2>

            <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,.65)', lineHeight: 1.85, marginBottom: 44 }}>
              「なぜ種苗費なのか」「按分が必要な理由」——AI は判定結果だけでなく、<br />
              毎回ワンポイントアドバイスを添えます。確定申告の不安が、少しずつ減ります。
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              {[
                '科目の判定根拠を毎回解説',
                '農業法規・税務ルールに基づく助言',
                '積み重なるほど申告に自信がつく',
              ].map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.13)',
                  borderRadius: 100, padding: '8px 20px',
                  fontSize: 13, color: 'rgba(255,255,255,.8)', fontWeight: 500,
                }}>
                  <span style={{ color: 'var(--primary)', fontSize: 14 }}>✦</span>
                  {t}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRIVACY
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 52, alignItems: 'center' }}>
            <FadeIn>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.14em', marginBottom: 12, textTransform: 'uppercase' }}>Data Privacy</p>
              <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 20, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                データの行き先は、<br />あなたの Google Drive だけ
              </h2>
              <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.8, marginBottom: 28 }}>
                Orch.RECIT は外部データベースや独自サーバーを持ちません。すべてのデータはあなた自身の Google アカウント内に保存されます。
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'レシート画像 → Google Drive の専用フォルダへ',
                  '経費記録 → Google スプレッドシートへ',
                  '開発者はあなたのデータにアクセスしません',
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <ShieldCheck size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                padding: '44px 36px',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 72, height: 72, margin: '0 auto 22px',
                  borderRadius: '50%',
                  background: 'var(--primary-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShieldCheck size={34} color="var(--primary)" />
                </div>
                <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', marginBottom: 10, letterSpacing: '-0.01em' }}>
                  Google Drive に<br />完全保存
                </p>
                <p style={{ fontSize: 13, color: 'var(--ink-mute)', lineHeight: 1.65, margin: 0 }}>
                  独自サーバーへのデータ蓄積なし。<br />Google のセキュリティがそのまま適用されます。
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CUSTOM RULES
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <FadeIn>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--warn)', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>Custom AI</p>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 18, letterSpacing: '-0.01em' }}>
              あなたの農業経営に合わせた AI
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.8, marginBottom: 44, maxWidth: 600, margin: '0 auto 44px' }}>
              税務署管内特有の科目処理や、ご自身の判断基準を AI に直接指示できます。「A 農協への支払いは運賃として処理」といった個別ルールも登録可能です。
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { emoji: '🏛', title: '税務署管内ルール', desc: '地域特有の科目処理を AI に設定' },
                { emoji: '✏️', title: 'ユーザー独自条件', desc: 'あなた専用の仕訳ルールを登録' },
              ].map((c, i) => (
                <div key={i} style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  padding: '26px 20px',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ fontSize: 30, marginBottom: 14 }}>{c.emoji}</div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{c.title}</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--secondary)', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>How it works</p>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 56, letterSpacing: '-0.01em' }}>
              3 ステップで完了
            </h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 36 }}>
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 68, height: 68, margin: '0 auto 22px',
                    borderRadius: '50%',
                    background: 'var(--primary-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <span style={{ color: 'var(--primary)' }}>{s.icon}</span>
                    <span style={{
                      position: 'absolute', top: -8, right: -8,
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'var(--primary)', color: 'var(--primary-fg)',
                      fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-mono)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i + 1}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
          <FadeIn>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>Pricing</p>
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              padding: '52px 44px',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{
                display: 'inline-block',
                background: 'var(--primary-soft)',
                color: 'var(--ok)',
                fontSize: 12, fontWeight: 700,
                padding: '4px 14px', borderRadius: 100, marginBottom: 22,
              }}>
                現在 無料
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', marginBottom: 14, letterSpacing: '-0.01em' }}>
                今すぐ無料で始められます
              </h2>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.75, marginBottom: 36 }}>
                Google アカウントがあれば、追加の登録・料金は一切不要です。すべての機能を無料でご利用いただけます。
              </p>
              <Link href="/app" style={ctaStyle}>
                無料で始める <ArrowRight size={16} />
              </Link>
              <p style={{ marginTop: 22, fontSize: 12, color: 'var(--ink-mute)' }}>
                ※ 将来的に有料プランを追加予定です
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(145deg, var(--primary-fg) 0%, #1a3d22 100%)',
        padding: '88px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: '-20%', left: '50%',
          transform: 'translateX(-50%)',
          width: 600, height: 400,
          background: 'radial-gradient(circle, #72D07C18 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <FadeIn style={{ position: 'relative' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4.5vw, 44px)',
            fontWeight: 900, color: '#fff',
            marginBottom: 18, letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            農業経費の記録を、<br />今日から変えよう
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', marginBottom: 44, lineHeight: 1.75 }}>
            Google アカウントでログインするだけ。設定不要、すぐに使えます。
          </p>
          <Link href="/app" style={{ ...ctaStyle, padding: '17px 44px', fontSize: 16 }}>
            Google アカウントで無料で始める <ArrowRight size={18} />
          </Link>
        </FadeIn>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '36px 24px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <SproutLogo size={20} />
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>Orch.RECIT</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-mute)', margin: '0 0 10px' }}>
          農業経費 AI 領収書アプリ
        </p>
        <Link href="/app" style={{ fontSize: 12.5, color: 'var(--secondary)', textDecoration: 'none', fontWeight: 500 }}>
          アプリを開く →
        </Link>
      </footer>

    </div>
  );
}
