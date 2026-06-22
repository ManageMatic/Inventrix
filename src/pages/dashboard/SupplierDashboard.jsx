import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import {
  TrendingUp,
  CheckSquare,
  Package,
  Settings,
  LogOut,
  Calendar,
  Menu,
  X
} from "lucide-react";
import Toast from "../../components/common/Toast";
import logo from "../../assets/logo.png";
import "../../styles/BaseDashboard.css";
import "../../styles/SupplierDashboard.css";
import { API_URL } from "../../config";

import SupplierDashboardHome from "../../components/dashboard/supplier/SupplierDashboardHome";
import SupplierPurchaseOrders from "../../components/dashboard/supplier/SupplierPurchaseOrders";
import SupplierCatalog from "../../components/dashboard/supplier/SupplierCatalog";
import SupplierSettings from "../../components/dashboard/supplier/SupplierSettings";

function SupplierDashboard() {
  const [supplier, setSupplier] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(localStorage.getItem("supplierActiveTab") || "Dashboard");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [date, setDate] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userType && userType !== "supplier") {
    if (userType === "store_owner") return <Navigate to="/OwnerDashboard" replace />;
    if (userType === "employee") return <Navigate to="/EmployeeDashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

  useEffect(() => {
    localStorage.setItem("supplierActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setDate(formatted);
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && res.data.user.userType === "supplier") {
        setSupplier(res.data.user);
      } else {
        showToast("Access denied. Supplier authorization required.", "error");
        handleLogout();
      }
    } catch (err) {
      console.error(err);
      showToast("Authentication failed. Please login again.", "error");
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("supplierActiveTab");
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", icon: <TrendingUp size={20} /> },
    { name: "Purchase Orders", icon: <CheckSquare size={20} /> },
    { name: "Supplied Products", icon: <Package size={20} /> },
    { name: "Settings", icon: <Settings size={20} /> }
  ];

  if (loading && !supplier) {
    return (
      <div style={{ background: "#090514", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
        <Loader2 className="spinner" size={40} />
      </div>
    );
  }

  return (
    <div className="dashboard-container supplier-theme">

      {/* Sidebar */}
      <aside className={`sidebar ${!sidebarOpen ? "sidebar-closed" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-icon">
            <img src={logo} alt="Inventrix Logo" />
          </div>
          <h2 className="logo">Inventrix</h2>
        </div>

        <nav className="nav">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              className={`nav-link ${activeTab === item.name ? "active" : ""}`}
              onClick={() => setActiveTab(item.name)}
              title={!sidebarOpen ? item.name : ""}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="user-section">
          <div className="user-profile">
            <div className="avatar">{supplier?.name?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <h4>{supplier?.name || "Supplier"}</h4>
              <p>Supplier Partner</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`main-content ${!sidebarOpen ? "main-expanded" : ""}`}>

        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="header-info">
              <h1 className="header-title">
                Welcome back {supplier?.name ? supplier.name.split(" ")[0] : "Supplier"} 👋
              </h1>
              <div className="header-date">
                <Calendar size={16} />
                <span>{date}</span>
              </div>
            </div>
          </div>

          <div className="header-right">
            <span className="supplier-user-badge" style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", color: "#a78bfa" }}>
              🚚 {supplier?.email}
            </span>
          </div>
        </header>

        <div className="supplier-content-area">

          {/* TAB 1: DASHBOARD */}
          {activeTab === "Dashboard" && (
            <SupplierDashboardHome token={token} />
          )}

          {/* TAB 2: PURCHASE ORDERS LIST */}
          {activeTab === "Purchase Orders" && (
            <SupplierPurchaseOrders token={token} />
          )}

          {/* TAB 3: SUPPLIED PRODUCTS */}
          {activeTab === "Supplied Products" && (
            <SupplierCatalog token={token} />
          )}

          {/* TAB 4: SETTINGS / PROFILE */}
          {activeTab === "Settings" && (
            <SupplierSettings supplier={supplier} setSupplier={setSupplier} token={token} />
          )}

        </div>
      </main>

      {/* Loader */}
      {loading && (
        <div className="global-loader-overlay">
          <Loader2 className="spinner spinner-icon" size={40} />
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

    </div>
  );
}

// Simple loader helper icon
const Loader2 = ({ className, size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`lucide lucide-loader-2 ${className || ""}`}
    style={{ animation: "spin 1s linear infinite" }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default SupplierDashboard;
