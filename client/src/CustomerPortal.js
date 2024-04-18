import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import PricingPage from './PricePage.js'
import BuyButton from './BuyButton.js'
import { API_URL } from './index.js'

export default function CustomerPortal(prop) {
  let { id } = useParams();
  const [customer, setCustomer] = useState({});
  const [portal, setPortal] = useState({});

  useEffect(() => {
    fetch(`${API_URL}/api/customers/${id}`).then(async(r) => {
      const cus = await r.json();
      setCustomer(cus);
    });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/customers/${id}/portal_session`, {method: 'POST'}).then(async(r) => {
      const session= await r.json();
      setPortal(session);
    });
  }, []);

  return (
    <>
      {customer && (
      <div>
      <h2>{customer.name}</h2>
        <QRCode value={id} />
        <h3><a href={portal.url}>ポータル</a></h3>
      </div>
      )}
    </>
  )
}

