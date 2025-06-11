import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
export const API_URL = process.env.REACT_APP_BACKEND_URL

const root = ReactDOM.createRoot(document.getElementById('root'));

function Root() {
  const [stripeKey, setStripeKey] = useState("");

  useEffect(() => {
    const fetchStripeKey = async () => {
      try {
        // APIからSTRIPE_KEYを取得
        const response = await fetch(`${API_URL}/token`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setStripeKey(data.stripe_key); 
      } catch (error) {
        console.error("Error fetching STRIPE_KEY:", error);
      }
    };

    fetchStripeKey();
  }, []);

  return (
    <React.StrictMode>
      <App stripeKey={stripeKey} />
    </React.StrictMode>
  );
}

root.render(
  <Root />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
