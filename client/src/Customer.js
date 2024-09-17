import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { Link } from 'react-router-dom';
import TimeFormatter from "./TimeFormatter"
import { API_URL } from './index.js'

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import { useNavigate } from "react-router-dom";
import Table from 'react-bootstrap/Table';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import QRCode from "react-qr-code";

export default function Customer(prop) {
  let { id } = useParams();
  const [customer, setCustomer] = useState({});
  const [paymentIntents, setPaymentIntents] = useState({});
  const [piCust, setPiCust] = useState(null);
  const [pI, setPi] = useState(null);
  const terminal = 'tmr_Fcd9lADqPm3A5q'

  const [amount, setAmount] = useState(0);

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

  let collect = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/terminal/${terminal}/payment_intent`, {
      method: "POST",
      body: JSON.stringify({amount: amount * 100, customer: id})
    }).then(async(r) => {
    });
  }

  let cannel = () => {
    fetch(`${API_URL}/api/terminal/${terminal}/cannel`, {
      method: "POST",
    }).then(async(r) => {
      console.log(r)
    });
  }

  let createPaymentIntentQR = () => {
    fetch(`${API_URL}/api/customers/${id}/payment_intent`, {
      method: "POST",
      body: JSON.stringify({amount: amount * 100 })
    }).then(async(r) => {
      const pi = await r.json();
      setPiCust(`${pi.id},${id}`)
    });
  }

  let createPaymentIntent = () => {
    fetch(`${API_URL}/api/customers/${id}/payment_intent`, {
      method: "POST",
      body: JSON.stringify({amount: amount * 100 })
    }).then(async(r) => {
      const pi = await r.json();
      setPi(`${pi.id}`)
    });
  }

  return (
    <Container>
      <Row>
        <h2>Merchant画面: {customer.name}</h2>
        <Table>
          <h3>基本情報</h3>
          <thead>
          </thead>
          <tbody>
            <tr>
              <th>id</th>
              <td><a href={`https://dashboard.stripe.com/test/customers/${id}`}>{id}</a></td>
            </tr>
            <tr>
              <th>Name</th>
              <td>{customer.name}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>{customer.email}</td>
            </tr>
            <tr>
              <th>Description</th>
              <td>{customer.description}</td>
            </tr>
            <tr>
              <th>カスタマー画面 </th>
              <td> {customer && <Link to={`/customers/${customer.id}/portal`}>LINK</Link> } </td>
            </tr>
            {customer && customer.metadata && Object.entries(customer.metadata).map(([key, value], index) => (
              <tr>
                <th>{key}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Row>
    <Row>
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
      <Row>
        <h3>直近の支払い</h3>
        <Table>
          <thead>
            <tr>
              <td>date</td>
              <td>amount</td>
              <td>status</td>
              <td>type</td>
            </tr>
          </thead>
          <tbody>
            {paymentIntents && paymentIntents.data && paymentIntents.data.map((pi, index) => (
              <tr>
                <td><TimeFormatter timestamp={pi.created}></TimeFormatter></td>
                <td>{pi.amount/100} {pi.currency}</td>
                <td>{pi.status}</td>
                <td>{ (pi.payment_method_types[0] === 'card') ? "online" : "card_present" }</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Row>
      <Row>
        <h3>POS</h3>
      <div>

        <Form>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>請求金額 USD</Form.Label>
            <Form.Control value={amount} onChange={(event) => { setAmount(event.target.value)}} type="number" placeholder="USD" />
            <Form.Text className="text-muted">
              POSにてこのお客様に請求されます
            </Form.Text>
          </Form.Group>
          <Button onClick={collect} variant="primary" type="submit">
            請求
          </Button>
          <Button variant="secondary" onClick={cannel}>Cannel</Button>
        </Form>

      </div>
      </Row>
      <Row>
        <h3>QR on POS</h3>
        { piCust != null &&
        <QRCode value={piCust} />
        }
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>請求金額 USD</Form.Label>
            <Form.Control value={amount} onChange={(event) => { setAmount(event.target.value)}} type="number" placeholder="USD" />
            <Form.Text className="text-muted">
              QRにてこのお客様に請求されます
            </Form.Text>
        </Form.Group>
        <Button onClick={createPaymentIntentQR}>QR</Button>
      </Row>
      <Row>
        <h3>LIVE </h3>
        { pI != null &&
        <QRCode value={pI} />
        }
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>請求金額 USD</Form.Label>
            <Form.Control value={amount} onChange={(event) => { setAmount(event.target.value)}} type="number" placeholder="USD" />
            <Form.Text className="text-muted">
              QRにてこのお客様に請求されます
            </Form.Text>
        </Form.Group>
        <Button onClick={createPaymentIntent}>Online</Button>
      </Row>
    </Container>
  )
}
