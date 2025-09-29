import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from './index.js'
import { useNavigate } from "react-router-dom";
import TerminalStatusBar from './components/TerminalStatusBar';
import './stripe-theme.css';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/customers`).then(async(r) => {
      const { data } = await r.json();
      setCustomers(data);
    });
  }, []);

  const goToCustomer = (customer) => {
    navigate(`/customers/${customer}`)
  }

  const goHome = () => {
    navigate('/')
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
