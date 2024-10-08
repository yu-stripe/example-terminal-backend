import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
export const API_URL = "https://example-terminal-backend-l8i6.onrender.com" 
//export const API_URL = "http://localhost:4567"

export const STRIPE_KEY = "pk_live_51Oh4JADoruLo2b1w5SqSRBE243cruQO8fbcdSw7jiqdoabS4cwKHxM7LTO5WLEWgQ9bDqpF9dJm1Tbc5UwO5aotK00HYjCZZAk"
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
