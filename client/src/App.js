import Root from './Root.js';
import Customers from './Customers.js'
import Customer from './Customer.js'
import Links from './Links.js'
import CustomerPortal from './CustomerPortal.js'
import CustomCheckout from './CustomCheckout.js'
import TerminalSelector from './TerminalSelector.js'
import { TerminalProvider } from './context/TerminalContext.js'
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <TerminalProvider>
      <BrowserRouter>
        <Routes>
          {/* Terminal */ }
          <Route path="/" element={<Root />} />
          <Route path="/terminal" element={<TerminalSelector />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/links" element={<Links />} />
          <Route path="/customers/:id" element={<Customer />} />
          <Route path="/customers/:id/portal" element={<CustomerPortal />} />

          {/* Custom Checkout */ }
          <Route path="/custom-checkout" element={<CustomCheckout />} />
        </Routes>
      </BrowserRouter>
    </TerminalProvider>
  );
}

export default App;
