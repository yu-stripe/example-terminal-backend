import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from './index.js'
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import { useNavigate } from "react-router-dom";




export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/customers`).then(async(r) => {
      const { data } = await r.json();
      setCustomers(data);
    });
  }, []);

  const goToCustomer = (customer) => {
    navigate(`/customers/${customer}`)
  }

  return (
    <Container>
      <Row>
        <h2>Customers</h2>
      </Row>
      <Row>
        <ListGroup>
          { customers.map((customer) => 
          <ListGroup.Item action onClick={() => goToCustomer(customer.id)}>{customer.name} ({customer.id}) </ListGroup.Item>
          )}
        </ListGroup>
      </Row>
    </Container>
  )
}
