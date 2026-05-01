import "../../styles/landing.css";
import { FaBoxOpen, FaUsersCog, FaChartLine, FaStore } from "react-icons/fa";
import { MdOutlinePointOfSale, MdLoyalty } from "react-icons/md";

function Features() {
  const features = [
    {
      title: "Real-time Inventory",
      desc: "Stay updated with live stock levels.",
      icon: <FaBoxOpen className="feature-icon" />,
    },
    {
      title: "Supplier Tracking",
      desc: "Manage suppliers and product sources.",
      icon: <FaUsersCog className="feature-icon" />,
    },
    {
      title: "Profit & Loss Reports",
      desc: "Track expenses and earnings easily.",
      icon: <FaChartLine className="feature-icon" />,
    },
    {
      title: "Employee Roles",
      desc: "Assign roles with access control.",
      icon: <FaStore className="feature-icon" />,
    },
    {
      title: "Customer Loyalty",
      desc: "Reward returning customers with points.",
      icon: <MdLoyalty className="feature-icon" />,
    },
    {
      title: "Store Insights",
      desc: "Visualize your growth with charts.",
      icon: <MdOutlinePointOfSale className="feature-icon" />,
    },
  ];

  return (
    <section className="features" id="features">
      <h2>Features</h2>
      <div className="feature-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            {f.icon}
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;
