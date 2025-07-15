import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import TimeFormatter from "./TimeFormatter"
import { API_URL } from './index.js'
import QRCode from "react-qr-code";
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

  const [amount, setAmount] = useState(0);
  const [collectedEmail, setCollectedEmail] = useState('');
  const [emailCollectionStatus, setEmailCollectionStatus] = useState('');

  const { selectedTerminal } = useTerminal();

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

      // Now proceed with email collection using the convenience endpoint
      const response = await fetch(`${API_URL}/api/terminal/collect_email`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: id
        })
      });

      if (response.ok) {
        setEmailCollectionStatus('waiting');
        // Poll for collected data
        pollForCollectedEmail();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
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
      fetch(`${API_URL}/api/terminal/collected_data`)
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
        body: JSON.stringify({amount: amount * 100, customer: id, currency: 'jpy' })
      });

      if (response.ok) {
        console.log('Payment intent created successfully');
        alert('Payment intent created successfully');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to create payment intent:', errorData.error);
        alert(`Error: ${errorData.error || 'Failed to create payment intent'}`);
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
      body: JSON.stringify({amount: amount * 100 })
    }).then(async(r) => {
      const pi = await r.json();
      setPiCust(`${pi.id},${id}`)
    });
  }

  let createPaymentIntent = () => {
    fetch(`${API_URL}/api/customers/${id}/payment_intent`, {
      method: "POST",
      body: JSON.stringify({amount: amount * 100 })
    }).then(async(r) => {
      const pi = await r.json();
      setPi(`${pi.id}`)
    });
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'succeeded':
        return 'stripe-badge-success';
      case 'processing':
        return 'stripe-badge-warning';
      case 'requires_payment_method':
        return 'stripe-badge-error';
      default:
        return 'stripe-badge-info';
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

                {customer && customer.metadata && Object.entries(customer.metadata).map(([key, value], index) => (
                  <div key={index} className="stripe-flex stripe-justify-between">
                    <span className="stripe-text" style={{ fontWeight: '500' }}>{key}</span>
                    <span className="stripe-text">{value}</span>
                  </div>
                ))}
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
                      <div className="stripe-flex stripe-items-center stripe-gap-3">
                        <div className="stripe-badge stripe-badge-info">{card.card.display_brand}</div>
                        <span className="stripe-text">**** **** **** {card.card.last4}</span>
                        <span className="stripe-text-sm">
                          {card.card.generated_from?.payment_method_details?.type || 'online'}
                        </span>
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

          {/* Recent Payments */}
          <div className="stripe-card stripe-mt-6">
            <div className="stripe-card-header">
              <h3 className="stripe-card-title">直近の支払い (Recent Payments)</h3>
            </div>
            
            {paymentIntents && paymentIntents.data && paymentIntents.data.length > 0 ? (
              <div className="stripe-list">
                {paymentIntents.data.map((pi, index) => (
                  <div key={index} className="stripe-list-item">
                    <div className="stripe-list-item-content">
                      <div className="stripe-list-item-title">
                        <TimeFormatter timestamp={pi.created}></TimeFormatter>
                      </div>
                      <div className="stripe-list-item-subtitle">
                        {(pi.payment_method_types[0] === 'card') ? "オンライン支払い" : "店頭支払い"}
                      </div>
                    </div>
                    <div className="stripe-flex stripe-items-center stripe-gap-3">
                      <span className="stripe-text" style={{ fontWeight: '500' }}>
                        ${(pi.amount/100).toFixed(2)} {pi.currency.toUpperCase()}
                      </span>
                      <div className={`stripe-badge ${getStatusBadge(pi.status)}`}>
                        {pi.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="stripe-text stripe-text-sm" style={{ textAlign: 'center', color: 'var(--stripe-gray-400)' }}>
                No recent payments
              </div>
            )}
          </div>

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
            {/* POS Terminal */}
            <div className="stripe-card">
              <div className="stripe-card-header">
                <h3 className="stripe-card-title">POS Terminal</h3>
                <p className="stripe-card-subtitle">Process in-person payment</p>
              </div>
              
              <form onSubmit={collect} className="stripe-flex stripe-flex-col stripe-gap-4">
                <div>
                  <label className="stripe-text" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    請求金額 (Amount USD)
                  </label>
                  <input
                    value={amount}
                    onChange={(event) => { setAmount(event.target.value)}}
                    type="number"
                    placeholder="USD"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--stripe-gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-family-primary)'
                    }}
                  />
                  <div className="stripe-text-sm" style={{ marginTop: '4px' }}>
                    POSにてこのお客様に請求されます
                  </div>
                </div>
                
                <div className="stripe-flex stripe-gap-2">
                  <button type="submit" className="stripe-button stripe-button-primary">
                    請求 (Charge)
                  </button>
                  <button type="button" onClick={cannel} className="stripe-button stripe-button-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* QR Code Payment */}
            <div className="stripe-card">
              <div className="stripe-card-header">
                <h3 className="stripe-card-title">QR Payment</h3>
                <p className="stripe-card-subtitle">Generate QR for POS</p>
              </div>
              
              <div className="stripe-flex stripe-flex-col stripe-gap-4">
                {piCust && (
                  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'var(--stripe-gray-50)', borderRadius: 'var(--radius-md)' }}>
                    <QRCode value={piCust} size={120} />
                  </div>
                )}
                
                <div>
                  <label className="stripe-text" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    請求金額 (Amount USD)
                  </label>
                  <input
                    value={amount}
                    onChange={(event) => { setAmount(event.target.value)}}
                    type="number"
                    placeholder="USD"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--stripe-gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-family-primary)'
                    }}
                  />
                  <div className="stripe-text-sm" style={{ marginTop: '4px' }}>
                    QRにてこのお客様に請求されます
                  </div>
                </div>
                
                <button onClick={createPaymentIntentQR} className="stripe-button stripe-button-primary">
                  Generate QR
                </button>
              </div>
            </div>

            {/* Online Payment */}
            <div className="stripe-card">
              <div className="stripe-card-header">
                <h3 className="stripe-card-title">Online Payment</h3>
                <p className="stripe-card-subtitle">Create payment intent</p>
              </div>
              
              <div className="stripe-flex stripe-flex-col stripe-gap-4">
                {pI && (
                  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'var(--stripe-gray-50)', borderRadius: 'var(--radius-md)' }}>
                    <QRCode value={pI} size={120} />
                  </div>
                )}
                
                <div>
                  <label className="stripe-text" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    請求金額 (Amount USD)
                  </label>
                  <input
                    value={amount}
                    onChange={(event) => { setAmount(event.target.value)}}
                    type="number"
                    placeholder="USD"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--stripe-gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-family-primary)'
                    }}
                  />
                  <div className="stripe-text-sm" style={{ marginTop: '4px' }}>
                    オンライン決済用のQRコードを生成
                  </div>
                </div>
                
                <button onClick={createPaymentIntent} className="stripe-button stripe-button-primary">
                  Create Online Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
