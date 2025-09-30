import React from 'react';
import { Link } from 'react-router-dom';
import { useTerminal } from '../context/TerminalContext';

const TerminalStatusBar = ({ showFullStatus = true, showClearButton = false }) => {
  const { selectedTerminal, terminalReader, loading, clearTerminal } = useTerminal();

  const handleClearTerminal = async () => {
    if (window.confirm('Are you sure you want to clear the selected terminal?')) {
      await clearTerminal();
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!selectedTerminal) {
    return (
      <div style={{ 
        position: 'fixed',
        top: '73px',
        left: 0,
        right: 0,
        zIndex: 99,
        backgroundColor: 'var(--stripe-orange)', 
        color: 'white', 
        padding: showFullStatus ? 'var(--space-3)' : 'var(--space-2)', 
        textAlign: 'center',
        fontSize: showFullStatus ? '14px' : '12px'
      }}>
        ⚠️ No terminal selected. 
        <Link 
          to="/terminal" 
          style={{ 
            color: 'white', 
            textDecoration: 'underline', 
            marginLeft: 'var(--space-2)' 
          }}
        >
          Select a terminal
        </Link> 
        {showFullStatus && ' to use terminal features.'}
      </div>
    );
  }

  if (showFullStatus) {
    const displayLabel = terminalReader?.label || selectedTerminal;
    const displayLocation = terminalReader?.location?.display_name;
    
    return (
      <div style={{ 
        position: 'fixed',
        top: '73px',
        left: 0,
        right: 0,
        zIndex: 99,
        backgroundColor: 'var(--stripe-green)', 
        color: 'white', 
        padding: 'var(--space-2)', 
        textAlign: 'center',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)'
      }}>
        <span>
          ✓ Terminal: <strong>{displayLabel}</strong>
          {displayLocation && <> | 📍 {displayLocation}</>}
        </span>
        {showClearButton && (
          <button
            onClick={handleClearTerminal}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        )}
      </div>
    );
  }

  return null; // Don't show success state if showFullStatus is false
};

export default TerminalStatusBar; 