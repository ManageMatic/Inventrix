import {
  BarChart3,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Settings,
  QrCode,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: <BarChart3 size={18} /> },
  { id: "products", label: "Products", icon: <Package size={18} /> },
  { id: "sales", label: "Sales", icon: <ShoppingBag size={18} /> },
  { id: "generateQR", label: "Generate QR", icon: <QrCode size={18} /> },
  { id: "insights", label: "Insights", icon: <TrendingUp size={18} /> },
  { id: "employees", label: "Employees", icon: <Users size={18} /> },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

const StoreNav = ({ activeTab, setActiveTab }) => {
  return (
    <div className="store-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default StoreNav;
