import * as React from 'react';

function PricingPage() {
  // Paste the stripe-pricing-table snippet in your React component
  return (
    <stripe-pricing-table
      pricing-table-id="prctbl_1P6mXdDoruLo2b1wcToDzk06"
      publishable-key="pk_test_51Oh4JADoruLo2b1wGQxY3JEp9oCp3YCeWMjkET5YCSzDpNduUXGZRV7gVEYx47nIMKeT3d6HQCVCTZxYBPVlxtIS00a5dXFwoX"
      customer-session-client-secret="cuss_secret_PwgKGzaE0u01DoZ37M1fW8FIszqWPJuXYYx4LUzPPywznZO"
    >
    </stripe-pricing-table>
  );
}

export default PricingPage;
