import { useState, useEffect, useRef } from 'react';
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import PricingPage from './PricePage.js'
import BuyButton from './BuyButton.js'
import { API_URL } from './index.js'
import { STRIPE_KEY } from './index.js'
import Confirm from './Confirm.js'
import Table from 'react-bootstrap/Table';

import { loadStripe } from "@stripe/stripe-js";
import { 
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function CustomerPortal(prop) {
  let { id } = useParams();
  const [customer, setCustomer] = useState({});
  const [portal, setPortal] = useState({});
  const [card, setCard] = useState({});

  const stripePromise = loadStripe(STRIPE_KEY);
  const [clientSecret, setClientSecret] = useState("");
  const initialized = useRef(false)


  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      fetch(`${API_URL}/api/customers/${id}`).then(async(r) => {
        const cus = await r.json();
        setCustomer(cus);
        setCard(cus.cards[0])
        fetch(`/api/customers/${id}/payment_intent/${cus.cards[0].id}`, {
          method: "POST",
          body: JSON.stringify({}),
        }).then(async (result) => {
          var { clientSecret } = await result.json();
          setClientSecret(clientSecret);
        });
      });
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/customers/${id}/portal_session`, {method: 'POST'}).then(async(r) => {
      const session= await r.json();
      setPortal(session);
    });
  }, []);

  return (
    <Container>
      {customer && (
        <>
          <Row>
            <h2>Customer: {customer.name || "Customer"}</h2>
            <QRCode value={id} />
          </Row>
          <Row>
            <h2>オンラインで購入</h2>
            <div>購入 10 usdを保存したカード</div>
            {clientSecret &&
            <Elements stripe={stripePromise}>
              <Confirm clientSecret={clientSecret} card={card}/>
            </Elements>
            }
            <h3>Card</h3>
            <Table>
              <thead>
                <tr> 
                  <th>brand</th>
                  <th>last4</th>
                  <th>type</th>
                </tr>
              </thead>
              <tbody>
                {customer && customer.cards && customer.cards.map((card, index) => (
                  <tr>
                    <td>{card.card.display_brand}</td>
                    <td>**** **** {card.card.last4}</td>
                    <td>{card.card.generated_from?.payment_method_details?.type || 'online' } </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Row>
        </>
      )}
    </Container>
  )
}

