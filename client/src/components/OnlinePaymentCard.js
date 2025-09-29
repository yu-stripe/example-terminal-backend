import QRCode from 'react-qr-code';

export default function OnlinePaymentCard({ amount, setAmount, checkoutUrl, onCreate }) {
  return (
    <div className="stripe-card">
      <div className="stripe-card-header">
        <h3 className="stripe-card-title">Online Payment</h3>
        <p className="stripe-card-subtitle">Create payment intent</p>
      </div>
      <div className="stripe-flex stripe-flex-col stripe-gap-4">
        {checkoutUrl && (
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'var(--stripe-gray-50)', borderRadius: 'var(--radius-md)' }}>
            <QRCode value={checkoutUrl} size={140} />
            <div className="stripe-text-sm" style={{ marginTop: '8px', wordBreak: 'break-all' }}>
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">{checkoutUrl}</a>
            </div>
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
            オンライン決済用のQRコードを生成
          </div>
        </div>
        <button onClick={onCreate} className="stripe-button stripe-button-primary">
          Create Online Payment
        </button>
      </div>
    </div>
  );
}


