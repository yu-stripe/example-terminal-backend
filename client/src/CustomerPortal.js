import { useState, useEffect, useRef } from 'react';
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import PricingPage from './PricePage.js'
import BuyButton from './BuyButton.js'
import { API_URL } from './index.js'
import Confirm from './Confirm.js'
import './stripe-theme.css';

import { loadStripe } from "@stripe/stripe-js";
import { 
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export default function CustomerPortal(prop) {
  let { id } = useParams();
  const [customer, setCustomer] = useState({});
  const [portal, setPortal] = useState({});
  const [card, setCard] = useState({});

  const stripePromise = loadStripe(prop.stripeKey);
  const [clientSecret, setClientSecret] = useState("");
  const initialized = useRef(false)


  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      fetch(`${API_URL}/api/customers/${id}`).then(async(r) => {
        const cus = await r.json();
        setCustomer(cus);
        setCard(cus.cards[0])
      });
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/customers/${id}/portal_session`, {method: 'POST'}).then(async(r) => {
      const session= await r.json();
      setPortal(session);
    });
  }, []);


  const setOnlinePayment = () => {
    fetch(`/api/customers/${id}/payment_intent/${customer.cards[0].id}`, {
      method: "POST",
      body: JSON.stringify({}),
    }).then(async (result) => {
      var { clientSecret } = await result.json();
      setClientSecret(clientSecret);
    });
  }

  const setDefault = (pid) => {

    fetch(`/api/customers/${id}/attach_default/${pid}`, {
      method: "POST",
      body: JSON.stringify({}),
    }).then(async (result) => {
      var customer = await result.json();
      setCustomer(customer)
    });

  }

  return (
    <div className="stripe-page">
      <div className="stripe-container">
        <div className="stripe-main">
          {customer && (
            <>
              {/* Header Section */}
              <div className="stripe-card stripe-mb-6">
                <div className="stripe-card-header">
                  <h1 className="stripe-card-title">顧客ポータル</h1>
                  <p className="stripe-card-subtitle">
                    {customer.name || "Customer"} - ID: {id}
                  </p>
                </div>
                <div className="stripe-flex stripe-items-center stripe-gap-6">
                  <div className="stripe-flex stripe-flex-col stripe-gap-2">
                    <h3 className="stripe-h3">QRコード</h3>
                    <p className="stripe-text-sm">このQRコードをスキャンして簡単にアクセス</p>
                  </div>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    border: '1px solid #e3e8ee'
                  }}>
                    <QRCode value={id} size={120} />
                  </div>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="stripe-card stripe-mb-6">
                <div className="stripe-card-header">
                  <h2 className="stripe-card-title">支払い方法</h2>
                  <p className="stripe-card-subtitle">登録されているカード情報</p>
                </div>
                
                {customer.cards && customer.cards.length > 0 ? (
                  <div className="stripe-list">
                    {customer.cards.map((card, index) => (
                      <div key={card.id} className="stripe-list-item">
                        <div className="stripe-list-item-content">
                          <div className="stripe-flex stripe-items-center stripe-gap-4">
                            <div className="stripe-flex stripe-items-center stripe-gap-3">
                              {/* Card Brand Icon */}
                              <div style={{
                                width: '32px',
                                height: '20px',
                                backgroundColor: card.card.display_brand === 'VISA' ? '#1a1f71' : 
                                                card.card.display_brand === 'MC' ? '#eb001b' : 
                                                card.card.display_brand === 'JCB' ? '#006cbb' : '#6b7280',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                              }}>
                                {card.card.display_brand}
                              </div>
                              <div>
                                <div className="stripe-list-item-title">
                                  •••• •••• •••• {card.card.last4}
                                </div>
                                <div className="stripe-list-item-subtitle">
                                  {card.card.generated_from?.payment_method_details?.type || 'オンライン'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="stripe-flex stripe-items-center stripe-gap-2">
                          {card.id === customer.invoice_settings?.default_payment_method ? (
                            <span className="stripe-badge stripe-badge-success">デフォルト</span>
                          ) : (
                            <button 
                              className="stripe-button stripe-button-secondary"
                              onClick={() => setDefault(card.id)}
                            >
                              デフォルトに設定
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="stripe-text">
                    登録されている支払い方法がありません
                  </div>
                )}
              </div>

              {/* Online Payment Section */}
              <div className="stripe-card">
                <div className="stripe-card-header">
                  <h2 className="stripe-card-title">オンライン決済</h2>
                  <p className="stripe-card-subtitle">新しい支払いを開始</p>
                </div>
                <div className="stripe-flex stripe-gap-4">
                  <button 
                    className="stripe-button stripe-button-primary"
                    onClick={setOnlinePayment}
                  >
                    新しい支払いを開始
                  </button>
                  {portal.url && (
                    <a 
                      href={portal.url} 
                      className="stripe-button stripe-button-secondary"
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Stripeポータルを開く
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
