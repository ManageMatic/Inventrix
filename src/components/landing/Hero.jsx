import "../../styles/landing.css";
import { Link } from "react-router-dom";
import bgm from "../../assets/bgm.mp4";

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
      <div className="hero-video">
        <video className="hero-video" autoPlay loop muted>
          <source src={bgm} type="video/mp4" />
        </video>
      </div>
    </section>
  );
}

export default Hero;
