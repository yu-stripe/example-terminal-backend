import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_URL } from './index.js';
import PaymentIntentCard from './components/PaymentIntentCard';
import TerminalStatusBar from './components/TerminalStatusBar';
import './stripe-theme.css';

export default function PaymentIntentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pi, setPi] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [status, setStatus] = useState('');

  const fetchPI = async () => {
    const r = await fetch(`${API_URL}/api/payment_intents/${id}`);
    const data = await r.json();
    setPi(data);
    return data;
  };

  useEffect(() => {
    fetchPI();

    let eventSource = null;
    let reconnectTimeout = null;
    let isUnmounted = false;

    const connectSSE = () => {
      if (isUnmounted) return;

      console.log('Connecting to SSE...');
      eventSource = new EventSource(`${API_URL}/events`);

      eventSource.onopen = () => {
        console.log('SSE connection established');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Log connection confirmation
          if (data.event_type === 'connected') {
            console.log('SSE connection confirmed');
            return;
          }

          // If this is a payment_intent.succeeded event for our payment intent
          if (data.event_type === 'payment_intent.succeeded' && data.object_id === id) {
            console.log('Received webhook event for payment intent:', id);
            // Refresh the payment intent data
            fetchPI();
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error');
        eventSource.close();

        // Attempt to reconnect after 3 seconds
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect SSE...');
            connectSSE();
          }, 3000);
        }
      };
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      isUnmounted = true;
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [id]);

  // Auto-search candidates once PI is loaded
  useEffect(() => {
    if (!pi) return;
    // Avoid re-triggering if already searched
    if (status === 'loading' || status === 'done' || status === 'error') return;
    (async () => {
      try {
        const pm = pi?.payment_method;
        const pmFp = pm?.card?.fingerprint || pm?.card_present?.fingerprint;
        const lcd = pi?.latest_charge?.payment_method_details;
        const lcdFp = lcd?.card?.fingerprint || lcd?.card_present?.fingerprint;
        const fp = pmFp || lcdFp;
        if (!fp) {
          setStatus('no_fingerprint');
          return;
        }
        setStatus('loading');
        const r = await fetch(`${API_URL}/api/customers/candidates_by_payment_method`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fingerprint: fp })
        });
        if (!r.ok) { setStatus('error'); return; }
        const data = await r.json();
        setCandidates(data.candidates || []);
        setStatus('done');
      } catch (e) {
        setStatus('error');
      }
    })();
  }, [pi, status]);

  const goHome = () => navigate('/');
  const goBack = () => navigate(-1);

  const getStatusBadge = (pi) => {
    try {
      const latest = pi.latest_charge;
      const refundedAmount = latest && latest.amount_refunded ? latest.amount_refunded : 0;
      if (refundedAmount > 0 && latest && refundedAmount >= (latest.amount || pi.amount || 0)) {
        return { className: 'stripe-badge-muted', label: '返金済み' };
      }
    } catch(e) {}
    switch(pi.status) {
      case 'succeeded':
        return { className: 'stripe-badge-success', label: '支払い済み' };
      case 'processing':
        return { className: 'stripe-badge-warning', label: '支払い中' };
      case 'requires_payment_method':
        return { className: 'stripe-badge-error', label: '支払い方法なし' };
      default:
        return { className: 'stripe-badge-info', label: pi.status };
    }
  };

  const getRefundInfo = (pi) => {
    try {
      const latest = pi.latest_charge;
      if (latest && typeof latest === 'object') {
        const totalAmount = latest.amount || pi.amount || 0;
        const refundedAmount = latest.amount_refunded || 0;
        if (refundedAmount <= 0) return { refunded: 0, status: 'none' };
        if (latest.refunded === true || refundedAmount >= totalAmount) {
          return { refunded: refundedAmount, status: 'refunded' };
        }
        return { refunded: refundedAmount, status: 'partially_refunded' };
      }
      return { refunded: 0, status: 'none' };
    } catch(e) {
      return { refunded: 0, status: 'none' };
    }
  };

  const refundPayment = async (pi) => {
    const isConfirmed = window.confirm(`この支払いを返金しますか？\nPI: ${pi.id}`);
    if (!isConfirmed) return;
    const resp = await fetch(`${API_URL}/api/refunds`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_intent: pi.id, confirm: true })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
      alert(`返金に失敗しました: ${err.error || resp.statusText}`);
      return;
    }
    const refund = await resp.json();
    alert(`返金を作成しました: ${refund.id}`);
  };

  const searchCandidatesByFingerprint = async () => {
    try {
      const pm = pi?.payment_method;
      const pmFp = pm?.card?.fingerprint || pm?.card_present?.fingerprint;
      const lcd = pi?.latest_charge?.payment_method_details;
      const lcdFp = lcd?.card?.fingerprint || lcd?.card_present?.fingerprint;
      const fp = pmFp || lcdFp;
      if (!fp) {
        alert('fingerprint が見つかりません');
        return;
      }
      setStatus('loading');
      const r = await fetch(`${API_URL}/api/customers/candidates_by_payment_method`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fingerprint: fp })
      });
      if (!r.ok) {
        setStatus('error');
        return;
      }
      const data = await r.json();
      setCandidates(data.candidates || []);
      setStatus('done');
    } catch (e) {
      setStatus('error');
    }
  };

  const mergeThisPiToCustomer = async (customerId) => {
    try {
      const r = await fetch(`${API_URL}/api/payment_intents/assign_customer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_id: customerId, payment_intent_ids: [id] })
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Unknown error' }));
        alert(`移行に失敗しました: ${err.error || r.statusText}`);
        return;
      }
      alert('支払いを対象のお客様に紐づけました');
      navigate(`/customers/${customerId}`);
    } catch (e) {
      alert(`エラー: ${e.message}`);
    }
  };

  return (
    <div className="stripe-page">
      <header className="stripe-header">
        <div className="stripe-container">
          <div className="stripe-header-content">
            <div className="stripe-logo" onClick={goHome}>Stripe Terminal Demo</div>
            <nav className="stripe-nav">
              <Link to="/terminal" className="stripe-nav-link">リーダー</Link>
              <Link to="/customers" className="stripe-nav-link">POSレジ</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="stripe-main">
        <div className="stripe-container">
          <div className="stripe-mb-4">
            <button onClick={goBack} className="stripe-button stripe-button-secondary">← Back</button>
          </div>

          <h1 className="stripe-h1">Payment Intent Details</h1>

          <PaymentIntentCard
            pi={pi}
            onRefund={refundPayment}
            getStatusBadge={getStatusBadge}
            getRefundInfo={getRefundInfo}
            onOpen={() => {}}
          />

          <div className="stripe-card stripe-mt-6">
            <div className="stripe-card-header">
              <h3 className="stripe-card-title">この人ですか？</h3>
              <p className="stripe-card-subtitle">カードの情報から、顧客候補を表示し、この支払いをこのお客様に移行します</p>
            </div>
            <div style={{ padding: '12px' }}>
              <div className="stripe-text-sm" style={{ color: 'var(--stripe-gray-500)' }}>
                {status === 'loading'
                  ? '候補を自動検索中…'
                  : status === 'no_fingerprint'
                    ? 'fingerprint が見つかりませんでした'
                    : status === 'error'
                      ? '検索中にエラーが発生しました'
                      : (Array.isArray(candidates) && candidates.length > 0
                          ? `${candidates.length} 件の候補が見つかりました`
                          : '候補は見つかりませんでした')}
              </div>
            </div>
            {Array.isArray(candidates) && candidates.length > 0 && (
              <div className="stripe-list">
                {candidates.map((c) => (
                  <div key={c.id} className="stripe-list-item" onClick={() => navigate(`/customers/${c.id}`)}>
                    <div className="stripe-list-item-content">
                      <div className="stripe-list-item-title">{c.name || 'Unnamed Customer'}</div>
                      <div className="stripe-list-item-subtitle">{c.email || '—'}</div>
                    </div>
                    <div className="stripe-list-item-meta" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div className="stripe-text-sm" style={{ fontFamily: 'var(--font-family-mono)' }}>{c.id}</div>
                      <button className="stripe-button stripe-button-secondary" onClick={(e) => { e.stopPropagation(); mergeThisPiToCustomer(c.id); }} style={{ fontSize: '12px', padding: '4px 8px' }}>
                        この顧客に移行
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


