import React from 'react';
import { useState, useEffect } from "react";
import {
  useCustomCheckout,
  PaymentElement
} from '@stripe/react-stripe-js';

export default function CheckoutForm(props) {
  const [lineItems, setLineItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [surchage, setSurchage] = React.useState(null);
  const [flag, setFlag] = React.useState(false);
  
  const checkout = useCustomCheckout();
  const {applyPromotionCode, removePromotionCode} = useCustomCheckout();
  useEffect(() => {
    setLineItems(checkout.lineItems);
    if (lineItems.length > 1) {
      let sur = lineItems.find(item => item.name == "Surcharge");
      setSurchage(sur);

    }
    setTotal(checkout.total.total);
  })

  const {updateLineItemQuantity} = useCustomCheckout();
  const updatedCheckout = function(quantity)  {
    if (surchage) {
      updateLineItemQuantity({
        lineItem: surchage.id,
        quantity: quantity,
      });
    }
    setLineItems(checkout.lineItems);
  }

  const changePayment = function(evt) {
    console.log(evt)
    if (!evt.empty) {
      setFlag(true);
    }
    let selectedPaymentMethod = evt?.value?.type;
    if (selectedPaymentMethod === 'card') {
      //applyPromotionCode('SECRET');
      applyPromotionCode('CO1', 'SECRET');
      //updatedCheckout(0);
    } else {
      removePromotionCode();
      //updatedCheckout(1);
    }
  }

  return (
    <pre>
      <button onClick={updatedCheckout}>test</button>
      {(flag &&
        <>
      <h2>Total: {total}</h2>
      <p>wechat, alipay requires surcharge </p>
        </>
      )}
      <form>
        <PaymentElement onChange={(evt) => changePayment(evt)} options={{}}/>
      </form>
      {JSON.stringify(lineItems, null, 2)}
    </pre>
  )
};
