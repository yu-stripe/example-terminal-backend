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
  
  const { selectedTerminal, selectTerminal, clearTerminal } = useTerminal();

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
      {/* Header */}
      <header className="stripe-header">
        <div className="stripe-container">
          <div className="stripe-header-content">
            <div className="stripe-logo" onClick={goHome}>
              Stripe Terminal Demo
            </div>
            <nav className="stripe-nav">
              <Link to="/terminal" className="stripe-nav-link active">
                Terminal
              </Link>
              <Link to="/customers" className="stripe-nav-link">
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
                <span>✓ Currently selected: {selectedTerminal}</span>
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