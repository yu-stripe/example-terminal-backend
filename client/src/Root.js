import logo from './logo.svg';
import { useNavigate } from "react-router-dom";
import './App.css';

export default function App() {
  const navigate = useNavigate();

  const onClick = () => {
    navigate("/customers")
  }

  return (
      <div className="App">
        <header className="App-header">
          <p onClick={onClick}>
            Stripe Termianl Demo App
          </p>
        </header>
      </div>
  )
}
