import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from './index.js'

export default function Customers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/customers`).then(async(r) => {
      const { data } = await r.json();
      setCustomers(data);
    });
  }, []);

  return (
    <div>
      <h2>Customers</h2>
      <ul>
        { customers.map((customer) => 
        <li><Link to={`/customers/${customer.id}`}>{customer.id}: {customer.name}</Link></li>
        )}
      </ul>
    </div>
  )
}
