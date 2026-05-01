import "../../styles/landing.css";

function About() {
  return (
    <section className="about" id="about">
      <div className="about-text">
        <h2>About Inventrix</h2>
        <p>
          Inventrix is a powerful store management system crafted to make
          inventory, sales, and supplier tracking effortless. With real-time
          insights, you can reduce stock issues, boost profits, and provide a
          seamless experience to employees and customers alike.
        </p>
        <p>
          Our mission is to help businesses grow smarter — by minimizing errors,
          automating manual work, and delivering data-driven reports that help
          you make the right decisions at the right time.
        </p>
      </div>
      <div className="about-image">
        <img className="about-image" src="/src/assets/about.png" alt="About Inventrix" />
      </div>
    </section>
  );
}

export default About;
