import * as React from 'react';
import { STRIPE_KEY, API_URL } from './index.js'
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { 
  useStripe,
  useElements,
  CustomCheckoutProvider
} from "@stripe/react-stripe-js";

import {
  Container,
  Form,
  Button,
  Row,
  Col,
  InputGroup
} from 'react-bootstrap';

export default function Links(props) {
  const [clientSecret, setClientSecret] = useState(null);
  const [amount, setAmount] = React.useState(10000);
  const [product_name, setProductName] = React.useState("シャツ");
  const [file, setFile] = useState(null);
  const [newKey, setNewKey] = useState('注文番号');
  const [newValue, setNewValue] = useState('MR-1234');


  const [link,setLink] = useState({}); 

  const stripe = loadStripe(STRIPE_KEY);

  const createLink = async (event) => {
    event.preventDefault();
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
    return data;
  }

  return (
     <Container>
      <h2>Links</h2>
       <Form onSubmit={createLink}>
         <Form.Group className="mb-3" controlId="Amount">
           <Form.Label>価格</Form.Label>
            <InputGroup>
              <InputGroup.Text>¥</InputGroup.Text>
           <Form.Control 
              type="number"
              value={amount}
              placeholder="Enter Price"
              onChange={(event) => { setAmount(event.target.value); }}/>
            </InputGroup>
         </Form.Group>
         <Form.Group className="mb-3" controlId="Amount">
           <Form.Label>商品名</Form.Label>
           <Form.Control
             type="text"
             value={product_name}
             onChange={(event) => { setProductName(event.target.value); }}
             placeholder="Enter Product Name" />
         </Form.Group>
         <Form.Group className="mb-3" controlId="File">
           <Form.Label>ファイル</Form.Label>
           <Form.Control
             type="file"
             onChange={(event) => { setFile(event.target.files[0]); }}
           />
         </Form.Group>


        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">Metadata</Form.Label>
          <Col sm="4">
            <Form.Control 
              type="text" 
              placeholder="Key" 
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
          </Col>
          <Col sm="4">
            <Form.Control 
              type="text" 
              placeholder="Value" 
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </Col>
        </Form.Group>

         <Button variant="primary" type="submit">
           Submit
         </Button>
      </Form>
      {link.url &&
      <>
        <h3>リンク</h3>
        <a href={link.url}>{link.product_name} {link.price}円</a>
        </>
      }

     </Container>
  );
}
