import "../../styles/landing.css";
import aboutImg from "../../assets/about_visual.png";

function About() {
  return (
    <section className="about" id="about">
      <div className="about-text">
        <h2>Our Mission</h2>
        <p>
          Inventrix was born from a simple observation: managing a retail business is complex, but the tools shouldn't be. We've built an ecosystem that bridge the gap between complex data and actionable insights.
        </p>
        <p>
          From real-time inventory tracking to advanced AI-driven sales analytics, our mission is to empower store owners with the same level of technology used by global retail giants, delivered in a package that's intuitive and effortless.
        </p>
      </div>
      <div className="about-visual">
        <div className="mockup-glow"></div>
        <div className="about-image">
          <img src={aboutImg} alt="About Inventrix" style={{ width: '100%', borderRadius: '16px' }} />
        </div>
      </div>
    </section>
  );
}

export default About;
