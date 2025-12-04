import { useState } from 'react';

export default function PosTerminalCard({ amount, setAmount, onSubmitCollect, onCancel }) {
  const [showTenKey, setShowTenKey] = useState(false);

  const handleTenKeyClick = (value) => {
    if (value === 'clear') {
      setAmount('');
    } else if (value === 'backspace') {
      setAmount(amount.slice(0, -1));
    } else if (value === '00') {
      setAmount(amount + '00');
    } else {
      setAmount(amount + value);
    }
  };

  return (
    <div className="stripe-card">
      <div className="stripe-card-header">
        <h3 className="stripe-card-title">対面決済</h3>
        <p className="stripe-card-subtitle">Process in-person payment</p>
      </div>
      <form onSubmit={onSubmitCollect} className="stripe-flex stripe-flex-col stripe-gap-4">
        <div>
          <label className="stripe-text" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            請求金額 (Amount JPY)
          </label>
          <input
            value={amount}
            onChange={(event) => { setAmount(event.target.value) }}
            type="number"
            placeholder="JPY"
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
            Termianlにてこのお客様に請求されます
          </div>
        </div>

        {/* Ten Key Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowTenKey(!showTenKey)}
            className="stripe-button stripe-button-secondary"
            style={{ width: '100%' }}
          >
            {showTenKey ? 'テンキーを非表示' : 'テンキーを表示'}
          </button>
        </div>

        {/* Ten Key Pad */}
        {showTenKey && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '16px',
            backgroundColor: 'var(--stripe-gray-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--stripe-gray-200)'
          }}>
            {['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', 'C'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTenKeyClick(key === 'C' ? 'clear' : key)}
                style={{
                  padding: '16px',
                  fontSize: '18px',
                  fontWeight: '600',
                  backgroundColor: key === 'C' ? 'var(--stripe-red)' : 'white',
                  color: key === 'C' ? 'white' : 'var(--stripe-gray-900)',
                  border: '1px solid var(--stripe-gray-300)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {key}
              </button>
            ))}
          </div>
        )}

        <div className="stripe-flex stripe-gap-2">
          <button type="submit" className="stripe-button stripe-button-primary">
            請求 (Charge)
          </button>
          <button type="button" onClick={onCancel} className="stripe-button stripe-button-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}


