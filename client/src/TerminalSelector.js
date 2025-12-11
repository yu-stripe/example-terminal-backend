import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTerminal } from './context/TerminalContext';
import { API_URL } from './index.js';
import TerminalStatusBar from './components/TerminalStatusBar';
import './stripe-theme.css';

const TerminalSelector = ({ onTerminalSelected }) => {
  const navigate = useNavigate();
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState('');

  const { selectedTerminal, terminalReader, selectTerminal, clearTerminal } = useTerminal();

  const goHome = () => {
    navigate('/');
  };

  useEffect(() => {
    fetchReaders();
  }, []);

  const fetchReaders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/terminal/readers`);
      if (!response.ok) {
        throw new Error('Failed to fetch terminal readers');
      }
      const data = await response.json();
      setReaders(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReader = async (readerId) => {
    setIsSelecting(true);
    try {
      const result = await selectTerminal(readerId);
      
      if (result.success) {
        if (onTerminalSelected) {
          onTerminalSelected(readerId);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleClearSelection = async () => {
    if (window.confirm('Are you sure you want to clear the terminal selection?')) {
      setIsSelecting(true);
      try {
        const result = await clearTerminal();
        if (!result.success) {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSelecting(false);
      }
    }
  };

  const showReaderConfirmation = async () => {
    if (!selectedTerminal) {
      alert('ターミナルが選択されていません。先にターミナルを選択してください。');
      return;
    }

    setConfirmationStatus('showing');

    try {
      const r = await fetch(`${API_URL}/api/terminal/${selectedTerminal}/collect_confirmation`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (r.ok) {
        setConfirmationStatus('waiting');
        // Poll for confirmation result
        pollForConfirmation();
      } else {
        const errorData = await r.json().catch(() => ({ error: 'Unknown error' }));
        setConfirmationStatus('error');
        alert(`Error: ${errorData.error || 'Failed to show confirmation'}`);
      }
    } catch (error) {
      setConfirmationStatus('error');
      alert(`Error: ${error.message}`);
    }
  };

  const pollForConfirmation = () => {
    const pollInterval = setInterval(() => {
      fetch(`${API_URL}/api/terminal/${selectedTerminal}/collected_data`)
        .then(async(r) => {
          if (r.ok) {
            const data = await r.json();
            if (data && data.inputs) {
              setConfirmationStatus('confirmed');
              clearInterval(pollInterval);
            }
          } else if (r.status === 404) {
            // No data yet, continue polling
          } else {
            setConfirmationStatus('error');
            clearInterval(pollInterval);
          }
        })
        .catch(error => {
          setConfirmationStatus('error');
          clearInterval(pollInterval);
        });
    }, 2000);

    setTimeout(() => {
      clearInterval(pollInterval);
      if (confirmationStatus === 'waiting') {
        setConfirmationStatus('timeout');
      }
    }, 60000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return '#00D924';
      case 'offline':
        return '#E25950';
      default:
        return '#666';
    }
  };

  const getDeviceTypeDisplayName = (deviceType) => {
    const typeMap = {
      'bbpos_chipper2x': 'BBPOS Chipper 2X BT',
      'bbpos_wisepad3': 'BBPOS WisePad 3',
      'bbpos_wisepos_e': 'BBPOS WisePOS E',
      'mobile_phone_reader': 'Tap to Pay',
      'simulated_stripe_s700': 'Simulated Stripe S700',
      'simulated_wisepos_e': 'Simulated BBPOS WisePOS E',
      'stripe_m2': 'Stripe M2',
      'stripe_s700': 'Stripe S700',
    };
    return typeMap[deviceType] || deviceType;
  };

  const renderHeader = () => (
    <>
      {/* Status Bar */}
      {!selectedTerminal ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--stripe-orange)',
          color: 'white',
          padding: '12px',
          textAlign: 'center',
          fontSize: '14px',
          zIndex: 1000
        }}>
          ⚠️ ターミナルが選択されていません。<Link to="/terminal" style={{ color: 'white', textDecoration: 'underline' }}>ターミナルを選択</Link>してください。
        </div>
      ) : (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--stripe-green)',
          color: 'white',
          padding: '12px',
          textAlign: 'center',
          fontSize: '14px',
          zIndex: 1000
        }}>
          ✓ ターミナル選択済み: <strong>{terminalReader?.label || selectedTerminal}</strong>
        </div>
      )}
      {/* Spacer for fixed status bar */}
      <div style={{ height: '46px' }}></div>
      {/* Header */}
      <header className="stripe-header">
        <div className="stripe-container">
          <div className="stripe-header-content">
            <div className="stripe-logo" onClick={goHome}>
              Stripe Terminal Demo
            </div>
            <nav className="stripe-nav">
              <Link to="/terminal" className="stripe-nav-link active">
                リーダー
              </Link>
              <Link to="/customers" className="stripe-nav-link">
                POSレジ
              </Link>
            </nav>
          </div>
        </div>
      </header>
    </>
  );

  if (loading) {
    return (
      <>
        {renderHeader()}
        <main className="stripe-main">
          <div className="stripe-container">
            <div className="stripe-loading">Loading terminal readers...</div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        {renderHeader()}
        <main className="stripe-main">
          <div className="stripe-container">
            <div className="stripe-alert stripe-alert-error">
              <h3>Error</h3>
              <p>{error}</p>
              <button onClick={fetchReaders} className="stripe-button stripe-button-secondary">
                Retry
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {renderHeader()}
      <main style={{ padding: '0 20px 20px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          
          {/* Page Title */}
          <div style={{ marginBottom: '30px', marginTop: '20px' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '10px', marginTop: '0' }}>Terminal Selection</h1>
            <p style={{ color: '#666', margin: '0' }}>
              Choose a terminal reader to process payments
            </p>
          </div>

          {/* Current Selection Status */}
          {selectedTerminal && (
            <div style={{
              background: '#d4edda',
              color: '#155724',
              padding: '15px',
              marginBottom: '30px',
              borderRadius: '4px',
              border: '1px solid #c3e6cb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>✓ Currently selected: {terminalReader?.label || selectedTerminal}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={showReaderConfirmation}
                    disabled={confirmationStatus === 'showing' || confirmationStatus === 'waiting'}
                    style={{
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: confirmationStatus === 'showing' || confirmationStatus === 'waiting' ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: confirmationStatus === 'showing' || confirmationStatus === 'waiting' ? 0.6 : 1
                    }}
                  >
                    {confirmationStatus === 'showing' || confirmationStatus === 'waiting' ?
                      '確認表示中...' : 'リーダー情報を表示'
                    }
                  </button>
                  <button
                    onClick={handleClearSelection}
                    disabled={isSelecting}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {isSelecting ? 'Clearing...' : 'Clear Selection'}
                  </button>
                </div>
              </div>

              {/* Status message below buttons */}
              {confirmationStatus && (
                <div style={{
                  padding: '10px',
                  marginTop: '10px',
                  backgroundColor: confirmationStatus === 'error' || confirmationStatus === 'timeout' ? '#f8d7da' : confirmationStatus === 'confirmed' ? '#d4edda' : '#d1ecf1',
                  borderRadius: '4px',
                  border: `1px solid ${confirmationStatus === 'error' || confirmationStatus === 'timeout' ? '#f5c6cb' : confirmationStatus === 'confirmed' ? '#c3e6cb' : '#bee5eb'}`,
                  fontSize: '14px'
                }}>
                  ステータス: {
                    confirmationStatus === 'showing' ? '表示中...' :
                    confirmationStatus === 'waiting' ? 'Terminal で確認を待機中...' :
                    confirmationStatus === 'confirmed' ? '確認完了 ✓' :
                    confirmationStatus === 'timeout' ? 'タイムアウトしました' :
                    confirmationStatus === 'error' ? 'エラーが発生しました' : ''
                  }
                </div>
              )}
            </div>
          )}

          {/* Terminal Readers */}
          {readers.length === 0 ? (
            <div style={{ 
              background: '#fff3cd', 
              color: '#856404', 
              padding: '15px', 
              borderRadius: '4px',
              border: '1px solid #ffeaa7'
            }}>
              <p>No terminal readers available</p>
              <button 
                onClick={fetchReaders}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Refresh List
              </button>
            </div>
          ) : (
            <>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px', 
                marginBottom: '30px' 
              }}>
                {readers.map((reader) => (
                  <div
                    key={reader.id}
                    style={{
                      border: selectedTerminal === reader.id ? '2px solid #28a745' : '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '20px',
                      background: 'white',
                      cursor: reader.status === 'online' && !isSelecting ? 'pointer' : 'default',
                      opacity: reader.status === 'offline' ? 0.6 : 1
                    }}
                    onClick={() => 
                      reader.status === 'online' && !isSelecting 
                        ? handleSelectReader(reader.id) 
                        : null
                    }
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>
                        {getDeviceTypeDisplayName(reader.device_type)}
                      </h3>
                      <span style={{
                        background: reader.status === 'online' ? '#28a745' : '#dc3545',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {reader.status}
                      </span>
                    </div>
                    
                    {reader.label && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontWeight: '600', fontSize: '16px', color: '#333' }}>
                          {reader.label}
                        </div>
                      </div>
                    )}
                    
                    {reader.location && reader.location.display_name && (
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ 
                          background: '#f8f9fa', 
                          padding: '8px 12px', 
                          borderRadius: '4px',
                          fontSize: '14px',
                          color: '#495057'
                        }}>
                          📍 {reader.location.display_name}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '500' }}>ID:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                          {reader.id}
                        </span>
                      </div>
                      
                      {reader.serial_number && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '500' }}>Serial:</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                            {reader.serial_number}
                          </span>
                        </div>
                      )}
                      
                      {reader.ip_address && reader.ip_address !== '0.0.0.0' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '500' }}>IP:</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                            {reader.ip_address}
                          </span>
                        </div>
                      )}
                      
                      {reader.last_seen_at && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '500' }}>Last Seen:</span>
                          <span style={{ fontSize: '14px' }}>
                            {new Date(reader.last_seen_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      {selectedTerminal === reader.id ? (
                        <div style={{
                          background: '#28a745',
                          color: 'white',
                          padding: '10px',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontWeight: '500'
                        }}>
                          ✓ Selected
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectReader(reader.id);
                          }}
                          disabled={isSelecting || reader.status === 'offline'}
                          style={{
                            background: reader.status === 'offline' ? '#6c757d' : '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '4px',
                            cursor: reader.status === 'offline' ? 'not-allowed' : 'pointer',
                            width: '100%',
                            fontWeight: '500'
                          }}
                        >
                          {isSelecting ? 'Selecting...' : reader.status === 'offline' ? 'Offline' : 'Select'}
                        </button>
                      )}
                    </div>

                    {reader.status === 'offline' && (
                      <div style={{ marginTop: '10px', textAlign: 'center', color: '#6c757d', fontSize: '14px' }}>
                        Terminal Offline
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button 
                  onClick={fetchReaders}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Refresh List
                </button>
              </div>
            </>
          )}

          {isSelecting && (
            <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
              {selectedTerminal ? 'Clearing selection...' : 'Selecting terminal...'}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default TerminalSelector; 
