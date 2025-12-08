export default function PosTerminalCard({ amount, setAmount, onSubmitCollect, onCancel }) {

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


