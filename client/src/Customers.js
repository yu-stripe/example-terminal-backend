import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from './index.js'
import { useNavigate } from "react-router-dom";
import TerminalStatusBar from './components/TerminalStatusBar';
import PaymentIntentsCard from './components/PaymentIntentsCard';
import PosTerminalCard from './components/PosTerminalCard';
import { useTerminal } from './context/TerminalContext';
import './stripe-theme.css';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [amount, setAmount] = useState(0);
  const { selectedTerminal } = useTerminal();
  const [recentGuests, setRecentGuests] = useState({ data: [] });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/customers`).then(async(r) => {
      const { data } = await r.json();
      setCustomers(data);
    });
  }, []);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const r = await fetch(`${API_URL}/api/payment_intents/recent_guests`);
        const data = await r.json();
        setRecentGuests(data || { data: [] });
      } catch (e) {
        setRecentGuests({ data: [] });
      }
    };
    fetchRecent();
  }, []);

  const goToCustomer = (customer) => {
    navigate(`/customers/${customer}`)
  }

  const goHome = () => {
    navigate('/')
  }

  const collectGuest = async (e) => {
    e.preventDefault();
    if (!selectedTerminal) {
      alert('Terminal not selected. Please select a terminal first.');
      return;
    }
    try {
      const syncResponse = await fetch(`${API_URL}/api/terminal/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reader_id: selectedTerminal }),
      });
      if (!syncResponse.ok) {
        throw new Error('Failed to sync terminal selection with server');
      }

      const response = await fetch(`${API_URL}/api/terminal/${selectedTerminal}/payment_intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount })
      });
      if (response.ok) {
        const res = await response.json();
        const piId = res && (res.payment_intent_id || res.intent_id || res.id);
        if (piId) {
          navigate(`/payment_intents/${piId}`);
        } else {
          alert('ゲスト決済の支払いフローを開始しました');
        }
      } else {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`決済開始に失敗しました: ${err.error || response.statusText}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  const cannel = async () => {
    if (!selectedTerminal) {
      alert('Terminal not selected. Please select a terminal first.');
      return;
    }
    try {
      const syncResponse = await fetch(`${API_URL}/api/terminal/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reader_id: selectedTerminal }),
      });
      if (!syncResponse.ok) {
        throw new Error('Failed to sync terminal selection with server');
      }
      const response = await fetch(`${API_URL}/api/terminal/${selectedTerminal}/cannel`, { method: 'POST' });
      if (response.ok) {
        alert('Action cancelled successfully');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Error: ${errorData.error || 'Failed to cancel action'}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  const createNewCustomer = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const r = await fetch(`${API_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '仮ユーザー' })
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Unknown error' }));
        alert(`作成に失敗しました: ${err.error || r.statusText}`);
        setCreating(false);
        return;
      }
      const cus = await r.json();
      navigate(`/customers/${cus.id}`);
    } catch (e) {
      alert(`エラー: ${e.message}`);
      setCreating(false);
    }
  }

  return (
    <div className="stripe-page">
      {/* Header */}
      <header className="stripe-header">
        <div className="stripe-container">
          <div className="stripe-header-content">
            <div className="stripe-logo" onClick={goHome}>
              Stripe Terminal Demo
            </div>
            <nav className="stripe-nav">
              <Link to="/terminal" className="stripe-nav-link">
                Terminal
              </Link>
              <Link to="/customers" className="stripe-nav-link active">
                Customers
              </Link>
              <Link to="/links" className="stripe-nav-link">
                Links
              </Link>
              <Link to="/custom-checkout" className="stripe-nav-link">
                Checkout
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <TerminalStatusBar showFullStatus={false} />

      {/* Main Content */}
      <main className="stripe-main">
        <div className="stripe-container">
          <div className="stripe-mb-6">
            <div className="stripe-flex stripe-justify-between stripe-items-center" style={{ gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h1 className="stripe-h1">Customers</h1>
                <p className="stripe-text">
                  Manage your customer database and view customer details.
                </p>
              </div>
              <button 
                className="stripe-button stripe-button-primary"
                onClick={createNewCustomer}
                disabled={creating}
              >
                {creating ? '作成中…' : '新規カスタマー作成'}
              </button>
            </div>
          </div>

          {/* Guest POS Terminal */}
          <div className="stripe-grid stripe-grid-1 stripe-mb-6">
            <PosTerminalCard
              amount={amount}
              setAmount={setAmount}
              onSubmitCollect={collectGuest}
              onCancel={cannel}
            />
          </div>

          {/* Recent Guest Payments */}
          <PaymentIntentsCard
            paymentIntents={recentGuests}
            onRefund={async (pi) => {
              try {
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
                alert('返金しました');
              } catch (e) {
                alert(`エラー: ${e.message}`);
              }
            }}
            getStatusBadge={(pi) => {
              try {
                const latest = pi.latest_charge;
                const refundedAmount = latest && latest.amount_refunded ? latest.amount_refunded : 0;
                if (refundedAmount > 0 && latest && refundedAmount >= (latest.amount || pi.amount || 0)) {
                  return { className: 'stripe-badge-muted', label: '返金済み' };
                }
              } catch(e) {}
              switch(pi.status) {
                case 'succeeded': return { className: 'stripe-badge-success', label: '支払い済み' };
                case 'processing': return { className: 'stripe-badge-warning', label: '支払い中' };
                case 'requires_payment_method': return { className: 'stripe-badge-error', label: '支払い方法なし' };
                default: return { className: 'stripe-badge-info', label: pi.status };
              }
            }}
            getRefundInfo={(pi) => {
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
            }}
          />

          {customers.length === 0 ? (
            <div className="stripe-card">
              <div className="stripe-flex stripe-flex-col stripe-items-center stripe-gap-4">
                <div className="stripe-text-sm">No customers found</div>
                <p className="stripe-text">
                  Your customers will appear here once you start processing payments.
                </p>
                <button 
                  className="stripe-button stripe-button-primary"
                  onClick={createNewCustomer}
                  disabled={creating}
                >
                  {creating ? '作成中…' : '新規カスタマー作成'}
                </button>
              </div>
            </div>
          ) : (
            <div className="stripe-list">
              {customers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="stripe-list-item"
                  onClick={() => goToCustomer(customer.id)}
                >
                  <div className="stripe-list-item-content">
                    <div className="stripe-list-item-title">
                      {customer.name || 'Unnamed Customer'}
                    </div>
                    <div className="stripe-list-item-subtitle">
                      Customer ID: {customer.id}
                    </div>
                  </div>
                  <div className="stripe-list-item-meta">
                    {customer.email && (
                      <div className="stripe-text-sm">{customer.email}</div>
                    )}
                    <div className="stripe-badge stripe-badge-info">
                      Active
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
