import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import TimeFormatter from "./TimeFormatter"
import { API_URL } from './index.js'
import QRCode from "react-qr-code";
import PosTerminalCard from './components/PosTerminalCard';
import QrPaymentCard from './components/QrPaymentCard';
import OnlinePaymentCard from './components/OnlinePaymentCard';
import PaymentIntentsCard from './components/PaymentIntentsCard';
import { useTerminal } from './context/TerminalContext';
import TerminalStatusBar from './components/TerminalStatusBar';
import './stripe-theme.css';

export default function Customer(prop) {
  let { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({});
  const [paymentIntents, setPaymentIntents] = useState({});
  const [piCust, setPiCust] = useState(null);
  const [pI, setPi] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const [amount, setAmount] = useState(0);
  const [collectedEmail, setCollectedEmail] = useState('');
  const [emailCollectionStatus, setEmailCollectionStatus] = useState('');

  const { selectedTerminal } = useTerminal();

  const colorForId = (id) => {
    try {
      let hash = 0;
      const s = String(id || '');
      for (let i = 0; i < s.length; i++) {
        hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
      }
      const hue = hash % 360;
      return {
        bg: `hsla(${hue}, 80%, 45%, 0.18)`,
        border: `hsla(${hue}, 80%, 45%, 0.5)`,
        text: `hsl(${hue}, 80%, 35%)`,
      };
    } catch (e) {
      return { bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.5)', text: 'rgb(37,99,235)' };
    }
  };

  

  useEffect(() => {
    fetch(`${API_URL}/api/customers/${id}`).then(async(r) => {
      const cus = await r.json();
      setCustomer(cus);
    });
  }, []);

  const setDefault = (pid) => {
    fetch(`${API_URL}/api/customers/${id}/attach_default/${pid}`, {
      method: "POST",
      body: JSON.stringify({}),
    }).then(async (result) => {
      var updatedCustomer = await result.json();
      setCustomer(updatedCustomer)
    });
  }

  const collectEmail = async () => {
    if (!selectedTerminal) {
      alert('Terminal not selected. Please select a terminal first.');
      return;
    }

    setEmailCollectionStatus('collecting');
    setCollectedEmail('');
    
    // Use the new convenience endpoint that uses selected terminal from session
    try {
      const r = await fetch(`${API_URL}/api/terminal/${selectedTerminal}/collect_email`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: id
        })
      });

      if (r.ok) {
        setEmailCollectionStatus('waiting');
        // Poll for collected data
        pollForCollectedEmail();
      } else {
        const errorData = await r.json().catch(() => ({ error: 'Unknown error' }));
        setEmailCollectionStatus('error');
        console.error('Failed to initiate email collection:', errorData.error);
        if (errorData.error && errorData.error.includes('No terminal reader selected')) {
          alert('No terminal reader selected. Please select a terminal first from the Terminal page.');
        } else {
          alert(`Error: ${errorData.error || 'Failed to start email collection'}`);
        }
      }
    } catch (error) {
      setEmailCollectionStatus('error');
      console.error('Error collecting email:', error);
      alert(`Error: ${error.message}`);
    }
  }

  const refreshCustomerData = () => {
    fetch(`${API_URL}/api/customers/${id}`).then(async(r) => {
      const cus = await r.json();
      setCustomer(cus);
    });
  }

  const pollForCollectedEmail = () => {
    const pollInterval = setInterval(() => {
      // Use the new convenience endpoint that uses selected terminal from session
      fetch(`${API_URL}/api/terminal/${selectedTerminal}/collected_data`)
        .then(async(r) => {
          if (r.ok) {
            const data = await r.json();
            if (data && data.inputs) {
              // Find email input from collected inputs
              const emailInput = data.inputs.find(input => input.type === 'email');
              if (emailInput && emailInput.email && emailInput.email.value) {
                setCollectedEmail(emailInput.email.value);
                setEmailCollectionStatus('collected');
                clearInterval(pollInterval);
                // Refresh customer data to show updated email
                setTimeout(() => {
                  refreshCustomerData();
                }, 2000); // Wait 2 seconds for webhook to process
              }
            }
          } else if (r.status === 404) {
            // No data yet, continue polling
          } else {
            setEmailCollectionStatus('error');
            clearInterval(pollInterval);
          }
        })
        .catch(error => {
          setEmailCollectionStatus('error');
          clearInterval(pollInterval);
          console.error('Error polling for collected data:', error);
        });
    }, 2000); // Poll every 2 seconds

    // Stop polling after 60 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      if (emailCollectionStatus === 'waiting') {
        setEmailCollectionStatus('timeout');
      }
    }, 60000);
  }

  const cancelEmailCollection = async () => {
    if (!selectedTerminal) {
      alert('Terminal not selected. Please select a terminal first.');
      return;
    }

    try {
      // First, ensure the server session has the correct terminal selected
      const syncResponse = await fetch(`${API_URL}/api/terminal/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reader_id: selectedTerminal }),
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync terminal selection with server');
      }

      // Now proceed with canceling email collection
      const response = await fetch(`${API_URL}/api/terminal/cancel_collect_inputs`, {
        method: "POST",
      });

      if (response.ok) {
        setEmailCollectionStatus('cancelled');
        setCollectedEmail('');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error canceling email collection:', errorData.error);
        if (errorData.error && errorData.error.includes('No terminal reader selected')) {
          alert('No terminal reader selected. Please select a terminal first from the Terminal page.');
        } else {
          alert(`Error: ${errorData.error || 'Failed to cancel email collection'}`);
        }
      }
    } catch (error) {
      console.error('Error canceling email collection:', error);
      alert(`Error: ${error.message}`);
    }
  }

  useEffect(() => {
    getPaymentIntents()
  }, []);

  const goHome = () => {
    navigate('/')
  }

  const goBack = () => {
    navigate('/customers')
  }

  let getPaymentIntents = () => {
    fetch(`${API_URL}/api/customers/${id}/payment_intents`).then(async(r) => {
      const pis = await r.json();
      setPaymentIntents(pis);
    });
  }

  const refundPayment = async (pi) => {
    try {
      const isConfirmed = window.confirm(`この支払いを返金しますか？\nPI: ${pi.id}\n金額: ${pi.currency?.toLowerCase() === 'jpy' ? `¥${Number(pi.amount).toLocaleString('ja-JP')}` : `$${pi.amount}`} ${pi.currency?.toUpperCase()}`);
      if (!isConfirmed) return;

      const resp = await fetch(`${API_URL}/api/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_intent: pi.id, confirm: true })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
        alert(`返金に失敗しました: ${err.error || resp.statusText}`);
        return;
      }
      const refund = await resp.json();
      alert(`返金を作成しました: ${refund.id}`);
      getPaymentIntents();
    } catch (e) {
      alert(`返金エラー: ${e.message}`);
    }
  }

  // Terminal refund removed

  // Unused: replaced by refundPayment (with confirmation)

  let collect = async (e) => {
    e.preventDefault();
    if (!selectedTerminal) {
      alert('Terminal not selected. Please select a terminal first.');
      return;
    }

    try {
      // First, ensure the server session has the correct terminal selected
      const syncResponse = await fetch(`${API_URL}/api/terminal/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reader_id: selectedTerminal }),
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync terminal selection with server');
      }

      // Now proceed with payment intent creation
      const response = await fetch(`${API_URL}/api/terminal/${selectedTerminal}/payment_intent`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({amount: amount, customer: id, currency: 'jpy' })
      });

      if (response.ok) {
        console.log('Payment intent created successfully');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to create payment intent:', errorData.error);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert(`Error: ${error.message}`);
    }
  }

  let cannel = async () => {
    if (!selectedTerminal) {
      alert('Terminal not selected. Please select a terminal first.');
      return;
    }

    try {
      // First, ensure the server session has the correct terminal selected
      const syncResponse = await fetch(`${API_URL}/api/terminal/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reader_id: selectedTerminal }),
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync terminal selection with server');
      }

      // Now proceed with canceling action
      const response = await fetch(`${API_URL}/api/terminal/${selectedTerminal}/cannel`, {
        method: "POST",
      });

      if (response.ok) {
        console.log('Action cancelled successfully');
        alert('Action cancelled successfully');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to cancel action:', errorData.error);
        alert(`Error: ${errorData.error || 'Failed to cancel action'}`);
      }
    } catch (error) {
      console.error('Error cancelling action:', error);
      alert(`Error: ${error.message}`);
    }
  }

  let createPaymentIntentQR = () => {
    fetch(`${API_URL}/api/customers/${id}/payment_intent`, {
      method: "POST",
      body: JSON.stringify({amount: amount })
    }).then(async(r) => {
      const pi = await r.json();
      setPiCust(`${pi.id},${id}`)
    });
  }

  let createCheckoutSession = async () => {
    try {
      const r = await fetch(`${API_URL}/api/customers/${id}/checkout_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount })
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to create checkout session: ${err.error || r.statusText}`);
        return;
      }
      const session = await r.json();
      if (session.url) {
        setCheckoutUrl(session.url);
      } else {
        alert('No session URL returned.');
      }
    } catch (e) {
      alert(`Error creating checkout session: ${e.message}`);
    }
  }

  const getStatusBadge = (pi) => {
    const refundState = getRefundInfo(pi).status;
    if (refundState === 'refunded') {
      return { className: 'stripe-badge-muted', label: '返金済み' };
    }
    switch(pi.status) {
      case 'succeeded':
        return { className: 'stripe-badge-success', label: '支払い済み' };
      case 'processing':
        return { className: 'stripe-badge-warning', label: '支払い中' };
      case 'requires_payment_method':
        return { className: 'stripe-badge-error', label: '支払い待ち' };
      default:
        return { className: 'stripe-badge-info', label: pi.status };
    }
  }

  const getRefundInfo = (pi) => {
    try {
      // Prefer latest_charge (expanded) if available
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

      // Fallback to charges array if latest_charge not expanded
      const charges = pi.charges && pi.charges.data ? pi.charges.data : [];
      if (charges.length === 0) return { refunded: 0, status: 'none' };
      const totalAmount = charges.reduce((sum, c) => sum + (c.amount || 0), 0);
      const refundedAmount = charges.reduce((sum, c) => sum + (c.amount_refunded || 0), 0);
      if (refundedAmount <= 0) return { refunded: 0, status: 'none' };
      if (refundedAmount >= totalAmount) return { refunded: refundedAmount, status: 'refunded' };
      return { refunded: refundedAmount, status: 'partially_refunded' };
    } catch (e) {
      return { refunded: 0, status: 'none' };
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

              <TerminalStatusBar showClearButton={true} />

      {/* Main Content */}
      <main className="stripe-main">
        <div className="stripe-container">
          {/* Breadcrumb */}
          <div className="stripe-mb-4">
            <button onClick={goBack} className="stripe-button stripe-button-secondary">
              ← Back to Customers
            </button>
          </div>

          <div className="stripe-mb-6">
            <h1 className="stripe-h1">Customer Details</h1>
            <p className="stripe-text">
              Merchant Dashboard: {customer.name || 'Loading...'}
            </p>
          </div>

          <div className="stripe-grid stripe-grid-2">
            {/* Customer Information */}
            <div className="stripe-card">
              <div className="stripe-card-header">
                <h3 className="stripe-card-title">基本情報 (Basic Information)</h3>
              </div>
              
              <div className="stripe-flex stripe-flex-col stripe-gap-4">
                <div className="stripe-flex stripe-justify-between">
                  <span className="stripe-text" style={{ fontWeight: '500' }}>Customer ID</span>
                  <a 
                    href={`https://dashboard.stripe.com/test/customers/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stripe-text-sm"
                    style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--stripe-purple)' }}
                  >
                    {id}
                  </a>
                </div>
                
                <div className="stripe-flex stripe-justify-between">
                  <span className="stripe-text" style={{ fontWeight: '500' }}>Name</span>
                  <span className="stripe-text">{customer.name || 'N/A'}</span>
                </div>
                
                <div className="stripe-flex stripe-justify-between">
                  <span className="stripe-text" style={{ fontWeight: '500' }}>Email</span>
                  <span className="stripe-text">{customer.email || 'N/A'}</span>
                </div>
                
                <div className="stripe-flex stripe-justify-between">
                  <span className="stripe-text" style={{ fontWeight: '500' }}>Description</span>
                  <span className="stripe-text">{customer.description || 'N/A'}</span>
                </div>
                
                <div className="stripe-flex stripe-justify-between">
                  <span className="stripe-text" style={{ fontWeight: '500' }}>Customer Portal</span>
                  {customer && (
                    <Link 
                      to={`/customers/${customer.id}/portal`}
                      className="stripe-button stripe-button-secondary"
                      style={{ textDecoration: 'none', fontSize: '12px', padding: '4px 8px' }}
                    >
                      Open Portal
                    </Link>
                  )}
                </div>

                {/* Metadata section */}
                {customer && (
                  <div className="stripe-flex stripe-flex-col stripe-gap-2">
                    <div className="stripe-text" style={{ fontWeight: '600', marginTop: '8px' }}>Metadata</div>

                    {/* Highlight brand/label as badges if present */}
                    {customer.metadata && (customer.metadata.brand || customer.metadata.label) && (
                      <div className="stripe-flex stripe-flex-wrap" style={{ gap: '6px' }}>
                        {customer.metadata.brand && (
                          <span className="stripe-badge" style={{ fontSize: '10px' }}>brand: {String(customer.metadata.brand)}</span>
                        )}
                        {customer.metadata.label && (
                          <span className="stripe-badge" style={{ fontSize: '10px' }}>label: {String(customer.metadata.label)}</span>
                        )}
                      </div>
                    )}

                    {/* Remaining metadata as key/value rows */}
                    {customer.metadata && Object.entries(customer.metadata)
                      .filter(([k]) => k !== 'brand' && k !== 'label')
                      .map(([key, value], index) => (
                        <div key={index} className="stripe-flex stripe-justify-between">
                          <span className="stripe-text" style={{ fontWeight: '500' }}>{key}</span>
                          <span className="stripe-text">{String(value)}</span>
                        </div>
                      ))}

                    {/* Empty state */}
                    {(!customer.metadata || Object.keys(customer.metadata).length === 0) && (
                      <div className="stripe-text stripe-text-sm" style={{ color: 'var(--stripe-gray-400)' }}>
                        No metadata
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Cards */}
            <div className="stripe-card">
              <div className="stripe-card-header">
                <h3 className="stripe-card-title">Payment Methods</h3>
              </div>
              
              {customer && customer.cards && customer.cards.length > 0 ? (
                <div className="stripe-flex stripe-flex-col stripe-gap-3">
                  {customer.cards.map((card, index) => (
                    <div key={index} className="stripe-flex stripe-justify-between stripe-items-center" style={{ padding: '12px', backgroundColor: 'var(--stripe-gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <div className="stripe-flex stripe-flex-col" style={{ gap: '4px' }}>
                        <div className="stripe-flex stripe-items-center stripe-gap-3">
                          <div className="stripe-badge stripe-badge-info">{card.card.display_brand}</div>
                          <span className="stripe-text">**** **** **** {card.card.last4}</span>
                          <span className="stripe-badge stripe-badge-info" style={{ whiteSpace: 'nowrap' }}>
                            {(() => {
                              const t = card.card.generated_from?.payment_method_details?.type;
                              return (t && (t === 'card_present' || (typeof t === 'string' && t.endsWith('_present')))) ? '店頭' : 'オンライン';
                            })()}
                          </span>
                        </div>
                        <div className="stripe-text-sm" style={{ color: 'var(--stripe-gray-500)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span>country: {card.card.country || '—'}</span>
                          <span>display_brand: {card.card.display_brand || '—'}</span>
                          <span>funding: {card.card.funding || '—'}</span>
                          {card.card.fingerprint ? (
                            <span>
                              fingerprint: {' '}
                              <a
                                href={`https://dashboard.stripe.com/test/search?query=fingerprint%3A${encodeURIComponent(card.card.fingerprint)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontFamily: 'var(--font-family-mono)' }}
                              >
                                {card.card.fingerprint}
                              </a>
                            </span>
                          ) : (
                            <span>fingerprint: —</span>
                          )}
                        </div>
                      </div>
                      <div className="stripe-flex stripe-items-center stripe-gap-2">
                        {card.id === customer.invoice_settings?.default_payment_method ? (
                          <span className="stripe-badge stripe-badge-success">デフォルト</span>
                        ) : (
                          <button 
                            className="stripe-button stripe-button-secondary"
                            onClick={() => setDefault(card.id)}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            デフォルトに設定
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stripe-text stripe-text-sm" style={{ textAlign: 'center', color: 'var(--stripe-gray-400)' }}>
                  No payment methods on file
                </div>
              )}
            </div>
          </div>

          <PaymentIntentsCard
            paymentIntents={paymentIntents}
            onRefund={refundPayment}
            getStatusBadge={getStatusBadge}
            getRefundInfo={getRefundInfo}
          />

          

          {/* Email Collection */}
          <div className="stripe-card stripe-mt-6">
            <div className="stripe-card-header">
              <h3 className="stripe-card-title">メール収集 (Email Collection)</h3>
              <p className="stripe-card-subtitle">Terminal からメールアドレスを収集</p>
            </div>
            
            <div className="stripe-flex stripe-flex-col stripe-gap-4">
              {collectedEmail && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'var(--stripe-green-50)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--stripe-green-200)'
                }}>
                  <div className="stripe-text" style={{ fontWeight: '500', color: 'var(--stripe-green-700)' }}>
                    収集されたメール:
                  </div>
                  <div className="stripe-text" style={{ fontFamily: 'var(--font-family-mono)' }}>
                    {collectedEmail}
                  </div>
                </div>
              )}

              {emailCollectionStatus && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: emailCollectionStatus === 'error' || emailCollectionStatus === 'timeout' ? 'var(--stripe-red-50)' : 'var(--stripe-blue-50)', 
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${emailCollectionStatus === 'error' || emailCollectionStatus === 'timeout' ? 'var(--stripe-red-200)' : 'var(--stripe-blue-200)'}`
                }}>
                  <div className="stripe-text" style={{ 
                    fontWeight: '500', 
                    color: emailCollectionStatus === 'error' || emailCollectionStatus === 'timeout' ? 'var(--stripe-red-700)' : 'var(--stripe-blue-700)' 
                  }}>
                    ステータス: {
                      emailCollectionStatus === 'collecting' ? '収集開始中...' :
                      emailCollectionStatus === 'waiting' ? 'Terminal でメール入力を待機中...' :
                      emailCollectionStatus === 'collected' ? 'メール収集完了' :
                      emailCollectionStatus === 'cancelled' ? 'キャンセルされました' :
                      emailCollectionStatus === 'timeout' ? 'タイムアウトしました' :
                      emailCollectionStatus === 'error' ? 'エラーが発生しました' : ''
                    }
                  </div>
                </div>
              )}

              <div className="stripe-flex stripe-gap-2">
                <button 
                  onClick={collectEmail} 
                  className="stripe-button stripe-button-primary"
                  disabled={emailCollectionStatus === 'collecting' || emailCollectionStatus === 'waiting'}
                >
                  {emailCollectionStatus === 'collecting' || emailCollectionStatus === 'waiting' ? 
                    'メール収集中...' : 'メール収集開始'
                  }
                </button>
                
                {(emailCollectionStatus === 'collecting' || emailCollectionStatus === 'waiting') && (
                  <button 
                    onClick={cancelEmailCollection} 
                    className="stripe-button stripe-button-secondary"
                  >
                    キャンセル
                  </button>
                )}
              </div>

              <div className="stripe-text-sm" style={{ color: 'var(--stripe-gray-500)' }}>
                Terminal ID: {selectedTerminal}
              </div>
            </div>
          </div>

          {/* Payment Actions */}
          <div className="stripe-grid stripe-grid-3 stripe-mt-6">
            <PosTerminalCard
              amount={amount}
              setAmount={setAmount}
              onSubmitCollect={collect}
              onCancel={cannel}
            />
            <QrPaymentCard
              amount={amount}
              setAmount={setAmount}
              piCust={piCust}
              onGenerate={createPaymentIntentQR}
            />
            <OnlinePaymentCard
              amount={amount}
              setAmount={setAmount}
              checkoutUrl={checkoutUrl}
              onCreate={createCheckoutSession}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
