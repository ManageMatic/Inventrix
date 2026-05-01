import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaQuestionCircle,
} from "react-icons/fa";
import "../../styles/landing.css";

function Contact() {
  return (
    <section className="contact" id="contact">
      {/* Contact Form */}
      <div className="contact-form">
        <h2>Get in Touch</h2>
        <input type="text" placeholder="Your Name" required />
        <input type="email" placeholder="Your Email" required />
        <input type="text" placeholder="Phone Number" required />
        <input type="text" placeholder="Subject" required />
        <textarea placeholder="Your Message" rows="7" required></textarea>
        <button type="submit">Send Message</button>
      </div>

      {/* Right Side */}
      <div className="contact-right">
        {/* Quick Info */}
        <div className="contact-cards">
          <div className="contact-card">
            <FaPhoneAlt className="contact-icon" />
            <p>+91 98765 43210</p>
          </div>
          <div className="contact-card">
            <FaEnvelope className="contact-icon" />
            <p>support@invintrix.com</p>
          </div>
          <div className="contact-card">
            <FaMapMarkerAlt className="contact-icon" />
            <p>Surat, Gujarat, India</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="contact-extra">
          <FaQuestionCircle className="contact-icon" />
          <h3>Frequently Asked Questions</h3>
          <div className="faq-item">
            <p className="faq-q">Q: Can I manage multiple stores?</p>
            <p className="faq-a">
              Yes, Invintrix allows you to handle multiple store branches under
              one account.
            </p>
          </div>
          <div className="faq-item">
            <p className="faq-q">Q: Is my data secure?</p>
            <p className="faq-a">
              Absolutely. We use encryption and role-based access control to
              keep your data safe.
            </p>
          </div>
          <div className="faq-item">
            <p className="faq-q">Q: Can I track profit and expenses?</p>
            <p className="faq-a">
              Yes, detailed analytics and reports are available in your
              dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
