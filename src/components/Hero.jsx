import "./../styles/landing.css";

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
          <a href="/register" className="cta-btn">
            Get Started
          </a>
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
