import "./../styles/landing.css";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Smarter Store Management Starts Here</h1>
        <p>
          Inventrix helps you track inventory, manage sales, and make
          data-driven decisions.
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="cta-btn">
            Get Started
          </Link>
          <a href="#features" className="outline-btn">
            Learn More
          </a>
        </div>
      </div>
      <div className="hero-image">
        <img className="hero-image" src="/src/assets/hero.png" alt="Hero" />
      </div>
    </section>
  );
}

export default Hero;
