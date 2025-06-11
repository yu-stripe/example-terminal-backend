import * as React from 'react';
import { STRIPE_KEY, API_URL } from './index.js'
import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";
import { loadStripe } from "@stripe/stripe-js";
import { 
  useStripe,
  useElements,
  CustomCheckoutProvider
} from "@stripe/react-stripe-js";
import './stripe-theme.css';

export default function Links(props) {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [amount, setAmount] = React.useState('');
  const [product_name, setProductName] = React.useState("");
  const [file, setFile] = useState(null);
  const [newKey, setNewKey] = useState('注文番号');
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(false);

  const [link,setLink] = useState({}); 

  const stripe = loadStripe(props.stripeKey);

  const goHome = () => {
    navigate('/')
  }

  const createLink = async (event) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('product_name', product_name);
    formData.append('metadata', JSON.stringify({[newKey]: newValue}));

    if (file) {
      formData.append('file', file);
    }
      
    const response = await fetch(`${API_URL}/api/payment_link`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    setLink({url: data.url, product_name: product_name, price: amount});
    setLoading(false);
    return data;
  }

  return (
    <div className="stripe-page">
      {/* Header */}
      <header className="stripe-header">
        <div className="stripe-container">
          <div className="stripe-header-content">
            <div className="stripe-logo" onClick={goHome}>
              Stripe Terminal Demo
            </div>
            <nav className="stripe-nav">
              <Link to="/customers" className="stripe-nav-link">
                Customers
              </Link>
              <Link to="/links" className="stripe-nav-link active">
                Links
              </Link>
              <Link to="/custom-checkout" className="stripe-nav-link">
                Checkout
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="stripe-main">
        <div className="stripe-container">
          <div className="stripe-mb-6">
            <h1 className="stripe-h1">Payment Links</h1>
            <p className="stripe-text">
              Create secure payment links for remote transactions and invoicing.
            </p>
          </div>

          <div className="stripe-grid stripe-grid-2">
            {/* Form Card */}
            <div className="stripe-card">
              <div className="stripe-card-header">
                <h3 className="stripe-card-title">Create Payment Link</h3>
                <p className="stripe-card-subtitle">Generate a secure payment link</p>
              </div>

              <form onSubmit={createLink} className="stripe-flex stripe-flex-col stripe-gap-4">
                <div>
                  <label className="stripe-text" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    価格 (Price)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--stripe-gray-500)',
                      fontSize: '14px'
                    }}>¥</span>
                    <input
                      required
                      type="number"
                      value={amount}
                      placeholder="Enter Price"
                      onChange={(event) => { setAmount(event.target.value); }}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 32px',
                        border: '1px solid var(--stripe-gray-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '14px',
                        fontFamily: 'var(--font-family-primary)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="stripe-text" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    商品名 (Product Name)
                  </label>
                  <input
                    required
                    type="text"
                    value={product_name}
                    onChange={(event) => { setProductName(event.target.value); }}
                    placeholder="Enter Product Name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--stripe-gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-family-primary)'
                    }}
                  />
                </div>

                <div>
                  <label className="stripe-text" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    ファイル (File)
                  </label>
                  <input
                    type="file"
                    onChange={(event) => { setFile(event.target.files[0]); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--stripe-gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-family-primary)'
                    }}
                  />
                </div>

                <div>
                  <label className="stripe-text" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    {newKey}
                  </label>
                  <input
                    type="text"
                    placeholder="Value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--stripe-gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-family-primary)'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="stripe-button stripe-button-primary"
                  disabled={loading}
                  style={{ marginTop: '16px' }}
                >
                  {loading ? 'Creating...' : 'Create Payment Link'}
                </button>
              </form>
            </div>

            {/* Result Card */}
            <div className="stripe-card">
              <div className="stripe-card-header">
                <h3 className="stripe-card-title">Generated Link</h3>
                <p className="stripe-card-subtitle">Your payment link will appear here</p>
              </div>

              {loading && (
                <div className="stripe-flex stripe-items-center stripe-gap-2">
                  <div className="stripe-badge stripe-badge-info">Creating</div>
                  <span className="stripe-text">作成中...</span>
                </div>
              )}

              {link.url && (
                <div className="stripe-flex stripe-flex-col stripe-gap-4">
                  <div>
                    <h4 className="stripe-h3">Payment Link Created</h4>
                    <div className="stripe-flex stripe-flex-col stripe-gap-2">
                      <div className="stripe-text-sm">
                        <strong>Product:</strong> {link.product_name}
                      </div>
                      <div className="stripe-text-sm">
                        <strong>Price:</strong> ¥{link.price}
                      </div>
                    </div>
                  </div>

                  <div>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="stripe-button stripe-button-primary"
                      style={{ textDecoration: 'none', display: 'inline-block' }}
                    >
                      Open Payment Link →
                    </a>
                  </div>

                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'var(--stripe-white)', 
                    border: '1px solid var(--stripe-gray-200)', 
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <div className="stripe-text-sm stripe-mb-4">QR Code</div>
                    <QRCode value={link.url} size={150} />
                  </div>
                </div>
              )}

              {!loading && !link.url && (
                <div className="stripe-text stripe-text-sm" style={{ textAlign: 'center', color: 'var(--stripe-gray-400)' }}>
                  Fill out the form to create a payment link
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
