import Root from './Root.js';
import Customers from './Customers.js'
import Customer from './Customer.js'
import Links from './Links.js'
import CustomerPortal from './CustomerPortal.js'
import CustomCheckout from './CustomCheckout.js'
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Terminal /> */}
        <Route path="/" element={<Root />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/links" element={<Links />} />
        <Route path="/customers/:id" element={<Customer />} />
        <Route path="/customers/:id/portal" element={<CustomerPortal />} />

        {/* Custom Checktou /> */}
        <Route path="/custom-checkout" element={<CustomCheckout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
