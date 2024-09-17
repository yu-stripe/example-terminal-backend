import { STRIPE_KEY, API_URL } from './index.js'
import { useState, useEffect } from "react";
import {loadStripe} from "@stripe/stripe-js";
import { 
  useStripe,
  useElements,
  CustomCheckoutProvider
} from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";

export default function CustomCheckout(props) {
  const [clientSecret, setClientSecret] = useState(null);
  const stripe = loadStripe(STRIPE_KEY, {
      betas: ['custom_checkout_beta_2'],
  });

  useEffect(() => {
    fetch(`${API_URL}/api/custom_checkout`, {
      method: 'POST',
    }).then(async(r) => {
      const res = await r.json();
      setClientSecret(res.clientSecret);
    });

  }, []);

  return (
    <>
    <div>Custom Checkout</div>
      {(clientSecret &&
      <CustomCheckoutProvider
        stripe={stripe}
        options={{clientSecret}}
      >
        <CheckoutForm />
      </CustomCheckoutProvider>
      )}
    </>
  );
    

}
