import React, { useState, useEffect } from 'react';
import { useTerminal } from './context/TerminalContext';
import { API_URL } from './index.js';
import './stripe-theme.css';

const TerminalSelector = ({ onTerminalSelected }) => {
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  const { selectedTerminal, selectTerminal, clearTerminal } = useTerminal();

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

  if (loading) {
    return (
      <div className="terminal-selector-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading terminal readers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="terminal-selector-container">
        <div className="error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchReaders} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-selector-container">
      <div className="terminal-selector-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Select Terminal Reader</h2>
            <p>Choose a terminal reader to process payments</p>
          </div>
          {selectedTerminal && (
            <button
              onClick={handleClearSelection}
              disabled={isSelecting}
              className="clear-btn"
              style={{
                backgroundColor: '#dc3545',
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
          )}
        </div>
        {selectedTerminal && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '8px 12px',
            borderRadius: '4px',
            marginTop: '12px',
            fontSize: '14px'
          }}>
            ✓ Currently selected: {selectedTerminal}
          </div>
        )}
      </div>

      {readers.length === 0 ? (
        <div className="no-readers">
          <p>No terminal readers available</p>
          <button onClick={fetchReaders} className="refresh-btn">
            Refresh
          </button>
        </div>
      ) : (
        <div className="readers-grid">
          {readers.map((reader) => (
            <div
              key={reader.id}
              className={`reader-card ${selectedTerminal === reader.id ? 'selected' : ''} ${
                reader.status === 'offline' ? 'offline' : ''
              }`}
            >
              <div className="reader-header">
                <div className="reader-info">
                  <h3>{reader.label || reader.id}</h3>
                  <p className="device-type">
                    {getDeviceTypeDisplayName(reader.device_type)}
                  </p>
                </div>
                <div className="reader-status">
                  <span
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(reader.status) }}
                  ></span>
                  <span className="status-text">{reader.status}</span>
                </div>
              </div>

              <div className="reader-details">
                <div className="detail-item">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{reader.id}</span>
                </div>
                {reader.serial_number && (
                  <div className="detail-item">
                    <span className="detail-label">Serial:</span>
                    <span className="detail-value">{reader.serial_number}</span>
                  </div>
                )}
                {reader.ip_address && reader.ip_address !== '0.0.0.0' && (
                  <div className="detail-item">
                    <span className="detail-label">IP:</span>
                    <span className="detail-value">{reader.ip_address}</span>
                  </div>
                )}
                {reader.last_seen_at && (
                  <div className="detail-item">
                    <span className="detail-label">Last Seen:</span>
                    <span className="detail-value">
                      {new Date(reader.last_seen_at * 1000).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="reader-actions">
                {selectedTerminal === reader.id ? (
                  <div className="selected-indicator">
                    <span className="checkmark">✓</span>
                    Selected
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectReader(reader.id)}
                    disabled={isSelecting || reader.status === 'offline'}
                    className="select-btn"
                  >
                    {isSelecting ? 'Selecting...' : 'Select'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="terminal-selector-footer">
        <button onClick={fetchReaders} className="refresh-btn">
          Refresh List
        </button>
      </div>
    </div>
  );
};

export default TerminalSelector; 