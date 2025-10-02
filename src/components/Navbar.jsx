import "./../styles/landing.css";

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
          <a href="/login" className="login-btn">
            Login
          </a>
        </li>
        <li>
          <a href="/register" className="register-btn">
            Get Started
          </a>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
