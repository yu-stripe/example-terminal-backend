import QRCode from 'react-qr-code';

export default function QrPaymentCard({ amount, setAmount, piCust, onGenerate }) {
  return (
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
            QRにてこのお客様に請求されます
          </div>
        </div>
        <button onClick={onGenerate} className="stripe-button stripe-button-primary">
          Generate QR
        </button>
      </div>
    </div>
  );
}


