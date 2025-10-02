import { useScrollAnimation } from "../hooks/useScrollAnimation";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import About from "../components/About";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

function LandingPage() {
  useScrollAnimation();

  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <About />
      <Contact />
      <Footer />
    </>
  );
}

export default LandingPage;
