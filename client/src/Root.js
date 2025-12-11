import { useNavigate } from "react-router-dom";
import './stripe-theme.css';

export default function App() {
  const navigate = useNavigate();

  const goToCustomers = () => {
    navigate("/customers")
  }

  const goToLinks = () => {
    navigate("/links")
  }

  const goToCheckout = () => {
    navigate("/custom-checkout")
  }

  const goToTerminal = () => {
    navigate("/terminal")
  }

  return (
    <div className="stripe-page">
      {/* Header */}
      <header className="stripe-header" style={{ top: 0 }}>
        <div className="stripe-container">
          <div className="stripe-header-content">
            <div className="stripe-logo">
              Stripe Terminal Demo
            </div>
            <nav className="stripe-nav">
              <div className="stripe-nav-link" onClick={goToTerminal}>
                リーダー
              </div>
              <div className="stripe-nav-link" onClick={goToCustomers}>
                POSレジ
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="stripe-main">
        <div className="stripe-container">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h1 className="stripe-h1" style={{ fontSize: '48px', marginBottom: '16px' }}>
                Stripe Terminal Demo
              </h1>
              <p className="stripe-text" style={{ fontSize: '18px', color: 'var(--stripe-gray-600)' }}>
                店頭決済とカスタマー管理のための統合デモアプリケーション
              </p>
            </div>

            {/* Project Overview */}
            <div className="stripe-card" style={{ marginBottom: '32px' }}>
              <div className="stripe-card-header">
                <h2 className="stripe-card-title">プロジェクト概要</h2>
                <p className="stripe-card-subtitle">Project Overview</p>
              </div>
              <div className="stripe-text" style={{ lineHeight: '1.6' }}>
                <p style={{ marginBottom: '12px' }}>
                  このアプリケーションは、Stripe Terminal SDKを使用した店頭決済システムの実装例です。
                  実際の小売店やサービス業での導入を想定し、以下の機能を統合しています：
                </p>
                <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                  <li>物理的な決済端末との連携</li>
                  <li>カスタマーデータベースの管理</li>
                  <li>カード情報の保存と再利用</li>
                  <li>サブスクリプション管理</li>
                  <li>メールアドレスの収集</li>
                  <li>決済履歴の追跡と返金処理</li>
                </ul>
              </div>
            </div>

            {/* Features */}
            <div className="stripe-card" style={{ marginBottom: '32px' }}>
              <div className="stripe-card-header">
                <h2 className="stripe-card-title">主な機能</h2>
                <p className="stripe-card-subtitle">Key Features</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Terminal Management */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>🖥️</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>ターミナル管理</h3>
                  </div>
                  <p className="stripe-text" style={{ marginBottom: '8px' }}>
                    Stripe Terminalデバイスの選択、登録、ステータス確認が可能です。
                    オンライン/オフラインの状態を確認し、適切なリーダーを選択できます。
                  </p>
                  <div className="stripe-badge stripe-badge-info" style={{ fontSize: '11px' }}>
                    Terminal Reader API
                  </div>
                </div>

                {/* POS Payments */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>💳</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>対面決済 (POS)</h3>
                  </div>
                  <p className="stripe-text" style={{ marginBottom: '8px' }}>
                    物理的なカードリーダーを使用した店頭決済を処理します。
                    カード情報は自動的に保存され、次回以降の決済に再利用できます。
                  </p>
                  <div className="stripe-badge stripe-badge-info" style={{ fontSize: '11px' }}>
                    Card Present Payments
                  </div>
                </div>

                {/* MOTO Payments */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>📞</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>MOTO決済</h3>
                  </div>
                  <p className="stripe-text" style={{ marginBottom: '8px' }}>
                    Mail Order / Telephone Order決済に対応。カード情報を手入力で処理します。
                  </p>
                  <div className="stripe-badge stripe-badge-info" style={{ fontSize: '11px' }}>
                    MOTO Payments
                  </div>
                </div>

                {/* Customer Management */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>👥</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>カスタマー管理</h3>
                  </div>
                  <p className="stripe-text" style={{ marginBottom: '8px' }}>
                    顧客情報、保存されたカード、決済履歴、サブスクリプションを一元管理します。
                    カードフィンガープリントによる重複顧客の検出も可能です。
                  </p>
                  <div className="stripe-badge stripe-badge-info" style={{ fontSize: '11px' }}>
                    Customer API
                  </div>
                </div>

                {/* Email Collection */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>📧</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>メール収集</h3>
                  </div>
                  <p className="stripe-text" style={{ marginBottom: '8px' }}>
                    ターミナルデバイスから直接顧客のメールアドレスを収集し、
                    自動的に顧客レコードに紐付けます。
                  </p>
                  <div className="stripe-badge stripe-badge-info" style={{ fontSize: '11px' }}>
                    Collect Inputs API
                  </div>
                </div>

                {/* Subscriptions */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>🔄</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>サブスクリプション</h3>
                  </div>
                  <p className="stripe-text" style={{ marginBottom: '8px' }}>
                    定期課金の作成と管理が可能です。顧客ごとのサブスクリプション状態を確認できます。
                  </p>
                  <div className="stripe-badge stripe-badge-info" style={{ fontSize: '11px' }}>
                    Subscriptions API
                  </div>
                </div>

                {/* Refunds */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>↩️</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>返金処理</h3>
                  </div>
                  <p className="stripe-text" style={{ marginBottom: '8px' }}>
                    決済の全額または一部返金が可能です。返金状態は決済履歴で確認できます。
                  </p>
                  <div className="stripe-badge stripe-badge-info" style={{ fontSize: '11px' }}>
                    Refunds API
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Start */}
            <div className="stripe-grid stripe-grid-2" style={{ marginBottom: '32px' }}>
              <div className="stripe-card" onClick={goToTerminal} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="stripe-card-header">
                  <h3 className="stripe-card-title">1. リーダー選択</h3>
                </div>
                <p className="stripe-text">
                  まずターミナルリーダーを選択してください
                </p>
                <div className="stripe-button stripe-button-primary">
                  リーダー →
                </div>
              </div>

              <div className="stripe-card" onClick={goToCustomers} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="stripe-card-header">
                  <h3 className="stripe-card-title">2. 決済開始</h3>
                </div>
                <p className="stripe-text">
                  カスタマーを選択または作成して決済を開始
                </p>
                <div className="stripe-button stripe-button-primary">
                  POSレジ →
                </div>
              </div>
            </div>

            {/* Stripe Documentation */}
            <div className="stripe-card">
              <div className="stripe-card-header">
                <h2 className="stripe-card-title">Stripe ドキュメント</h2>
                <p className="stripe-card-subtitle">Documentation References</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                    📘 Stripe Terminal
                  </h4>
                  <a
                    href="https://stripe.com/docs/terminal"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--stripe-purple)', textDecoration: 'none', fontSize: '14px' }}
                  >
                    https://stripe.com/docs/terminal
                  </a>
                  <p className="stripe-text-sm" style={{ marginTop: '4px', color: 'var(--stripe-gray-600)' }}>
                    店頭決済ソリューションの公式ドキュメント
                  </p>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                    💳 Payment Intents API
                  </h4>
                  <a
                    href="https://stripe.com/docs/api/payment_intents"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--stripe-purple)', textDecoration: 'none', fontSize: '14px' }}
                  >
                    https://stripe.com/docs/api/payment_intents
                  </a>
                  <p className="stripe-text-sm" style={{ marginTop: '4px', color: 'var(--stripe-gray-600)' }}>
                    決済処理のコアAPI
                  </p>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                    👥 Customers API
                  </h4>
                  <a
                    href="https://stripe.com/docs/api/customers"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--stripe-purple)', textDecoration: 'none', fontSize: '14px' }}
                  >
                    https://stripe.com/docs/api/customers
                  </a>
                  <p className="stripe-text-sm" style={{ marginTop: '4px', color: 'var(--stripe-gray-600)' }}>
                    顧客情報の管理
                  </p>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                    🔄 Subscriptions
                  </h4>
                  <a
                    href="https://stripe.com/docs/billing/subscriptions/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--stripe-purple)', textDecoration: 'none', fontSize: '14px' }}
                  >
                    https://stripe.com/docs/billing/subscriptions/overview
                  </a>
                  <p className="stripe-text-sm" style={{ marginTop: '4px', color: 'var(--stripe-gray-600)' }}>
                    定期課金の実装ガイド
                  </p>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                    📧 Collect Inputs
                  </h4>
                  <a
                    href="https://stripe.com/docs/terminal/features/collect-inputs"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--stripe-purple)', textDecoration: 'none', fontSize: '14px' }}
                  >
                    https://stripe.com/docs/terminal/features/collect-inputs
                  </a>
                  <p className="stripe-text-sm" style={{ marginTop: '4px', color: 'var(--stripe-gray-600)' }}>
                    ターミナルでの情報収集機能
                  </p>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                    🔧 Ruby SDK
                  </h4>
                  <a
                    href="https://github.com/stripe/stripe-ruby"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--stripe-purple)', textDecoration: 'none', fontSize: '14px' }}
                  >
                    https://github.com/stripe/stripe-ruby
                  </a>
                  <p className="stripe-text-sm" style={{ marginTop: '4px', color: 'var(--stripe-gray-600)' }}>
                    このプロジェクトで使用しているRuby SDK
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div style={{ marginTop: '32px', padding: '24px', backgroundColor: 'var(--stripe-gray-50)', borderRadius: '8px', border: '1px solid var(--stripe-gray-200)' }}>
              <div className="stripe-flex stripe-items-center stripe-gap-3">
                <div className="stripe-badge stripe-badge-warning">Demo</div>
                <div>
                  <p className="stripe-text-sm" style={{ margin: 0 }}>
                    このアプリケーションはデモ用途です。本番環境では適切な認証、認可、セキュリティ対策を実装してください。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
