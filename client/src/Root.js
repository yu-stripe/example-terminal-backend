import { useNavigate } from "react-router-dom";
import './stripe-theme.css';

export default function App() {
  const navigate = useNavigate();

  const goToCustomers = () => {
    navigate("/customers")
  }

  const goToLinks = () => {
    navigate("/links")
  }

  const goToCheckout = () => {
    navigate("/custom-checkout")
  }

  const goToTerminal = () => {
    navigate("/terminal")
  }

  return (
    <div className="stripe-page">
      {/* Header */}
      <header className="stripe-header">
        <div className="stripe-container">
          <div className="stripe-header-content">
            <div className="stripe-logo">
              Stripe Terminal Demo
            </div>
            <nav className="stripe-nav">
              <div className="stripe-nav-link" onClick={goToTerminal}>
                リーダー
              </div>
              <div className="stripe-nav-link" onClick={goToCustomers}>
                POSレジ
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="stripe-main">
        <div className="stripe-container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="stripe-h1" style={{ fontSize: '48px', marginBottom: '24px' }}>
              Stripe Terminal Demo
            </h1>
            <p className="stripe-text" style={{ fontSize: '18px', marginBottom: '40px' }}>
              A comprehensive demo application showcasing Stripe Terminal integration 
              for in-person payments, customer management, and checkout flows.
            </p>
            
            <div className="stripe-grid stripe-grid-2" style={{ marginTop: '48px' }}>
              <div className="stripe-card" onClick={goToTerminal} style={{ cursor: 'pointer' }}>
                <div className="stripe-card-header">
                  <h3 className="stripe-card-title">Terminal Readers</h3>
                  <p className="stripe-card-subtitle">Select terminal device</p>
                </div>
                <p className="stripe-text">
                  Choose and configure your terminal reader for in-person payment processing.
                </p>
                <div className="stripe-button stripe-button-primary">
                  Select Terminal →
                </div>
              </div>

              <div className="stripe-card" onClick={goToCustomers} style={{ cursor: 'pointer' }}>
                <div className="stripe-card-header">
                  <h3 className="stripe-card-title">Customers</h3>
                  <p className="stripe-card-subtitle">Manage customer database</p>
                </div>
                <p className="stripe-text">
                  View and manage your customer information, payment history, and account details.
                </p>
                <div className="stripe-button stripe-button-primary">
                  View Customers →
                </div>
              </div>

              <div className="stripe-card" onClick={goToLinks} style={{ cursor: 'pointer' }}>
                <div className="stripe-card-header">
                  <h3 className="stripe-card-title">Payment Links</h3>
                  <p className="stripe-card-subtitle">Create payment links</p>
                </div>
                <p className="stripe-text">
                  Generate secure payment links for remote transactions and invoicing.
                </p>
                <div className="stripe-button stripe-button-primary">
                  Create Links →
                </div>
              </div>

              <div className="stripe-card" onClick={goToCheckout} style={{ cursor: 'pointer' }}>
                <div className="stripe-card-header">
                  <h3 className="stripe-card-title">Custom Checkout</h3>
                  <p className="stripe-card-subtitle">Terminal integration</p>
                </div>
                <p className="stripe-text">
                  Process in-person payments using Stripe Terminal with custom checkout flows.
                </p>
                <div className="stripe-button stripe-button-primary">
                  Start Checkout →
                </div>
              </div>
            </div>

            <div className="stripe-card" style={{ marginTop: '48px', backgroundColor: 'var(--stripe-gray-100)' }}>
              <div className="stripe-flex stripe-items-center stripe-gap-4">
                <div className="stripe-badge stripe-badge-success">Live Demo</div>
                <div>
                  <p className="stripe-text" style={{ margin: 0 }}>
                    This is a fully functional demo of Stripe's payment processing capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
