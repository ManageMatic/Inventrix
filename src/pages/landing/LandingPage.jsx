import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";
import Features from "../../components/landing/Features";
import About from "../../components/landing/About";
import Contact from "../../components/landing/Contact";
import Footer from "../../components/landing/Footer";

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
