import Root from './Root.js';
import Customers from './Customers.js'
import Customer from './Customer.js'
import CustomerPortal from './CustomerPortal.js'
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<Customer />} />
        <Route path="/customers/:id/portal" element={<CustomerPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
