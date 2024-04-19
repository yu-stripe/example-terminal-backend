import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { Link } from 'react-router-dom';
import TimeFormatter from "./TimeFormatter"
import { API_URL } from './index.js'
export default function Customer(prop) {
  let { id } = useParams();
  const [customer, setCustomer] = useState({});
  const [paymentIntents, setPaymentIntents] = useState({});
  const terminal = 'tmr_Fcd9lADqPm3A5q'

  useEffect(() => {
    fetch(`${API_URL}/api/customers/${id}`).then(async(r) => {
      const cus = await r.json();
      setCustomer(cus);
    });
  }, []);

  useEffect(() => {
    getPaymentIntents()
  }, []);

  let getPaymentIntents = () => {
    fetch(`${API_URL}/api/customers/${id}/payment_intents`).then(async(r) => {
      const pis = await r.json();
      setPaymentIntents(pis);
    });
  }

  let collect = (amount, terminal) => {
    fetch(`${API_URL}/api/terminal/${terminal}/payment_intent`, {
      method: "POST",
      body: JSON.stringify({amount: amount, customer: id})
    }).then(async(r) => {
    });
  }

  let cannel = () => {
    fetch(`${API_URL}/api/terminal/${terminal}/cannel`, {
      method: "POST",
    }).then(async(r) => {
    });
  }

  return (
    <>
      <h2>Customer</h2>
      <ul>
        <li>{id}</li>
        <li>name: {customer.name}</li>
        <li>email: {customer.email}</li>
        <li>desc: {customer.description}</li>
        <li>card:
          <ul>
            {customer && customer.cards && customer.cards.map((card, index) => (
              <li>
              {card.card.display_brand}:**** **** {card.card.last4} {card.card.generated_from?.payment_method_details?.type || 'online' } 
              </li>
            ))}
          </ul>
        </li>
        <li>支払い:
          <ul>
            {paymentIntents && paymentIntents.data && paymentIntents.data.map((pi, index) => (
              <li><TimeFormatter timestamp={pi.created}></TimeFormatter> : {pi.amount/100} {pi.currency} { (pi.payment_method_types[0] === 'card') ? "online" : "card_present" }</li>
            ))}
          </ul>
        </li>
      </ul>
      <div>
        <button onClick={() => collect(10000, 'tmr_Fcd9lADqPm3A5q')}>初期費用(100,000円)</button>
        <button onClick={cannel}>Cannel</button>
      </div>
      <div>
        {customer && 
        <li><Link to={`/customers/${customer.id}/portal`}>カスタマーポータル</Link></li>
        }
      </div>
    </>
  )
}
