import TimeFormatter from '../TimeFormatter';

export default function PaymentIntentsCard({ paymentIntents, onRefund, getStatusBadge, getRefundInfo }) {
  return (
    <div className="stripe-card stripe-mt-6">
      <div className="stripe-card-header">
        <h3 className="stripe-card-title">直近の支払い (Recent Payments)</h3>
      </div>
      {paymentIntents && paymentIntents.data && paymentIntents.data.length > 0 ? (
        <div className="stripe-list">
          {paymentIntents.data.map((pi, index) => (
            <div key={index} className="stripe-list-item">
              <div className="stripe-flex stripe-flex-col" style={{ width: '100%', gap: '6px' }}>
                <div className="stripe-flex stripe-justify-between stripe-items-center">
                  <div className="stripe-flex stripe-items-center" style={{ gap: '8px', alignItems: 'baseline' }}>
                    <span className="stripe-text" style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {pi?.currency?.toLowerCase() === 'jpy' ? `¥${Number(pi.amount).toLocaleString('ja-JP')}` : `$${pi.amount}`} {pi.currency.toUpperCase()}
                    </span>
                    {(() => {
                      const s = getStatusBadge(pi);
                      return (
                        <div className={`stripe-badge ${s.className}`}>
                          {s.label}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="stripe-flex stripe-items-center" style={{ gap: '8px' }}>
                    {(() => {
                      const methodType = Array.isArray(pi.payment_method_types) ? pi.payment_method_types[0] : undefined;
                      if (pi.status !== 'succeeded') return null;
                      const refundState = getRefundInfo(pi).status;
                      if (refundState === 'refunded') return null;
                      return (
                        <>
                          {(methodType === 'card' || methodType === 'card_present') && (
                            <button
                              className="stripe-button stripe-button-secondary"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                              onClick={() => onRefund(pi)}
                            >
                              Refund
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="stripe-flex stripe-justify-between stripe-items-center">
                  <span className="stripe-text">
                    <TimeFormatter timestamp={pi.created}></TimeFormatter>
                  </span>
                  <span className="stripe-badge stripe-badge-info" style={{ whiteSpace: 'nowrap' }}>
                    {(pi.payment_method_types[0] === 'card') ? 'オンライン' : '店頭'}
                  </span>
                </div>

                {pi.description && (
                  <div className="stripe-text stripe-text-sm" style={{ marginTop: '2px', color: 'var(--stripe-gray-600)' }}>
                    {pi.description}
                  </div>
                )}

                {pi.metadata && Object.keys(pi.metadata).length > 0 && (
                  <div className="stripe-flex stripe-flex-wrap" style={{ marginTop: '2px', gap: '4px' }}>
                    {Object.entries(pi.metadata)
                      .filter(([key, value]) => value && key !== 'product_image')
                      .map(([key, value], i) => (
                        <span
                          key={`${key}-${i}`}
                          className="stripe-badge"
                          style={{
                            backgroundColor: 'var(--stripe-gray-50)',
                            borderColor: 'var(--stripe-gray-200)',
                            color: 'var(--stripe-gray-700)',
                            fontSize: '10px',
                            padding: '2px 6px',
                            lineHeight: 1.2,
                            borderRadius: '8px',
                          }}
                        >
                          {String(value)}
                        </span>
                      ))}
                  </div>
                )}
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
  );
}


