import { useState, useEffect } from 'react';
import { API_URL } from '../index.js';
import TimeFormatter from '../TimeFormatter';

export default function SubscriptionsCard({ customerId }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchSubscriptions();
    }
  }, [customerId]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/customers/${customerId}/subscriptions`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    if (creating) return;

    try {
      setCreating(true);
      const response = await fetch(`${API_URL}/api/customers/${customerId}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const subscription = await response.json();
        alert(`サブスクリプションを作成しました: ${subscription.id}`);
        fetchSubscriptions(); // Refresh the list
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`サブスクリプション作成に失敗しました: ${error.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert(`エラー: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'var(--stripe-green)';
      case 'trialing':
        return 'var(--stripe-blue)';
      case 'past_due':
        return 'var(--stripe-orange)';
      case 'canceled':
      case 'unpaid':
        return 'var(--stripe-red)';
      default:
        return 'var(--stripe-gray-600)';
    }
  };

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatInterval = (interval, intervalCount) => {
    if (intervalCount === 1) {
      switch (interval) {
        case 'day': return '日次';
        case 'week': return '週次';
        case 'month': return '月次';
        case 'year': return '年次';
        default: return interval;
      }
    }
    return `${intervalCount} ${interval}`;
  };

  if (loading) {
    return (
      <div className="stripe-card stripe-mt-6">
        <div className="stripe-card-header">
          <h3 className="stripe-card-title">サブスクリプション</h3>
          <p className="stripe-card-subtitle">Subscriptions</p>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--stripe-gray-600)' }}>
          読み込み中...
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="stripe-card stripe-mt-6">
        <div className="stripe-card-header">
          <div style={{ flex: 1 }}>
            <h3 className="stripe-card-title">サブスクリプション</h3>
            <p className="stripe-card-subtitle">Subscriptions</p>
          </div>
          <button
            onClick={createSubscription}
            disabled={creating}
            className="stripe-button stripe-button-primary"
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            {creating ? '作成中...' : 'サブスクリプション作成'}
          </button>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--stripe-gray-600)' }}>
          サブスクリプションがありません
        </div>
      </div>
    );
  }

  return (
    <div className="stripe-card stripe-mt-6">
      <div className="stripe-card-header">
        <div style={{ flex: 1 }}>
          <h3 className="stripe-card-title">サブスクリプション</h3>
          <p className="stripe-card-subtitle">{subscriptions.length} Subscriptions</p>
        </div>
        <button
          onClick={createSubscription}
          disabled={creating}
          className="stripe-button stripe-button-primary"
          style={{ fontSize: '14px', padding: '8px 16px' }}
        >
          {creating ? '作成中...' : 'サブスクリプション作成'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 0 16px 0' }}>
        {subscriptions.map((sub) => (
          <div
            key={sub.id}
            style={{
              padding: '16px',
              border: '1px solid var(--stripe-gray-200)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--stripe-gray-50)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--stripe-gray-900)',
                  fontFamily: 'monospace'
                }}>
                  {sub.id}
                </div>
                {sub.items?.data[0]?.price?.product && (
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--stripe-gray-600)',
                    marginTop: '4px'
                  }}>
                    {typeof sub.items.data[0].price.product === 'string'
                      ? sub.items.data[0].price.product
                      : sub.items.data[0].price.product.name || 'Product'}
                  </div>
                )}
              </div>
              <div style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: `${getStatusColor(sub.status)}20`,
                color: getStatusColor(sub.status),
                textTransform: 'uppercase'
              }}>
                {sub.status}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '13px'
            }}>
              <div>
                <div style={{ color: 'var(--stripe-gray-600)', fontSize: '11px', marginBottom: '2px' }}>
                  金額 / Amount
                </div>
                <div style={{ fontWeight: '600', color: 'var(--stripe-gray-900)' }}>
                  {sub.items?.data[0]?.price && formatAmount(
                    sub.items.data[0].price.unit_amount,
                    sub.items.data[0].price.currency
                  )}
                  {' '}
                  <span style={{ fontSize: '11px', color: 'var(--stripe-gray-600)' }}>
                    / {sub.items?.data[0]?.price && formatInterval(
                      sub.items.data[0].price.recurring.interval,
                      sub.items.data[0].price.recurring.interval_count
                    )}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--stripe-gray-600)', fontSize: '11px', marginBottom: '2px' }}>
                  作成日 / Created
                </div>
                <div style={{ fontWeight: '600', color: 'var(--stripe-gray-900)' }}>
                  <TimeFormatter timestamp={sub.created} />
                </div>
              </div>

              {sub.cancel_at && (
                <div>
                  <div style={{ color: 'var(--stripe-gray-600)', fontSize: '11px', marginBottom: '2px' }}>
                    キャンセル予定 / Cancel At
                  </div>
                  <div style={{ fontWeight: '600', color: 'var(--stripe-orange)' }}>
                    <TimeFormatter timestamp={sub.cancel_at} />
                  </div>
                </div>
              )}
            </div>

            {sub.discount && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: 'var(--stripe-green-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--stripe-green)'
              }}>
                🎉 割引適用中: {sub.discount.coupon.name || sub.discount.coupon.id}
                {sub.discount.coupon.percent_off && ` (${sub.discount.coupon.percent_off}% OFF)`}
                {sub.discount.coupon.amount_off && ` (${formatAmount(sub.discount.coupon.amount_off, sub.currency)} OFF)`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
