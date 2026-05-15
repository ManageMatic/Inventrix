import "../../styles/landing.css";
import { Link } from "react-router-dom";
import mockupImg from "../../assets/dashboard_mockup.png"; // I'll need to move/rename the artifact

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Smarter Store Management Starts Here</h1>
        <p>
          Inventrix helps you track inventory, manage sales, and make
          data-driven decisions with a powerful, intuitive dashboard.
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="cta-btn">
            Get Started Free
          </Link>
          <a href="#features" className="outline-btn">
            View Features
          </a>
        </div>
      </div>
      
      <div className="hero-visual">
        <div className="mockup-glow"></div>
        <div className="mockup-container">
          <img 
            src={mockupImg} 
            alt="Inventrix Dashboard Mockup" 
            className="dashboard-mockup"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
