import { useState, useEffect } from "react";
import {loadStripe} from "@stripe/stripe-js";
import { 
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export default function Confirm(props) {
  const stripe = useStripe();
  const elements = useElements();
  const clientSecret = props.clientSecret;
  const card = props.card;

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
    });

    if (error) {
      console.log(error);
    }

    setIsProcessing(false);
  };

  return (
    <div>
      <p>登録済みのカード番号: **** {card.card.last4}</p>
      <form id="payment-form" onSubmit={handleSubmit}>
        <button disabled={isProcessing || !stripe || !elements} id="submit">
          <span id="button-text">
            {isProcessing ? "Processing ... " : "購入"}
          </span>
        </button>
        {/* Show any error or success messages */}
        {message && 
          <div id="payment-message">{message}
          </div>
        }
      </form>
    </div>
  );
}
