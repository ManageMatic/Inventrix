import {
  BarChart3,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Settings,
  QrCode,
  RefreshCw,
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

const StoreNav = ({ activeTab, setActiveTab, onRefresh, isRefreshing }) => {
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

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="nav-tab refresh-btn"
        title="Refresh dashboard"
        style={{
          marginLeft: "auto",
          opacity: isRefreshing ? 0.6 : 1,
          cursor: isRefreshing ? "not-allowed" : "pointer",
        }}
      >
        <RefreshCw
          size={18}
          style={{
            animation: isRefreshing ? "spin 0.6s linear infinite" : "none",
          }}
        />
        <span>{isRefreshing ? "Refreshing" : "Refresh"}</span>
      </button>
    </div>
  );
};

export default StoreNav;
