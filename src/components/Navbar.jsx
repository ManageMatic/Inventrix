import "./../styles/landing.css";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">Inventrix</div>
      <ul className="nav-links">
        <li>
          <a href="#features">Features</a>
        </li>
        <li>
          <a href="#about">About</a>
        </li>
        <li>
          <a href="#contact">Contact</a>
        </li>
        <li>
          <Link to="/login" className="login-btn">
            Login
          </Link>
        </li>
        <li>
          <Link to="/register" className="register-btn">
            Get Started
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
