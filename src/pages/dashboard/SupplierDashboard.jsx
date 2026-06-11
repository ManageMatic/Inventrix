import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import {
  Truck,
  Package,
  CheckSquare,
  XSquare,
  Settings,
  LogOut,
  TrendingUp,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Clock,
  Sparkles,
  Inbox,
  Save,
  Menu,
  X
} from "lucide-react";
import Toast from "../../components/common/Toast";
import logo from "../../assets/logo.png";
import "../../styles/BaseDashboard.css";
import "../../styles/SupplierDashboard.css";
import { API_URL } from "../../config";

function SupplierDashboard() {
  const [supplier, setSupplier] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(localStorage.getItem("supplierActiveTab") || "Dashboard");
  const [stats, setStats] = useState({ totalOrders: 0, pendingDeliveries: 0, completedDeliveries: 0, pendingApproval: 0 });
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogForm, setCatalogForm] = useState({ name: "", category: "General", description: "", purchasePrice: "" });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", address: "" });
  const [date, setDate] = useState("");

  // Response form states
  const [selectedPOId, setSelectedPOId] = useState(null);
  const [responseType, setResponseType] = useState(""); // "accept" or "reject"
  const [responseMessage, setResponseMessage] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");

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
    if (supplier) {
      setProfileForm({
        name: supplier.name || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
      });
    }
  }, [supplier]);

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

  useEffect(() => {
    if (supplier) {
      if (activeTab === "Dashboard") {
        fetchStats();
        fetchPOs();
      } else if (activeTab === "Purchase Orders") {
        fetchPOs();
      } else if (activeTab === "Supplied Products") {
        fetchProducts();
      }
    }
  }, [activeTab, supplier]);

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/api/auth/update-profile`,
        {
          name: profileForm.name,
          phone: profileForm.phone,
          address: profileForm.address,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        showToast("Profile updated successfully!", "success");
        setSupplier(res.data.user);
      } else {
        showToast(res.data.message || "Failed to update profile.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Error updating profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/suppliers/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPOs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/suppliers/pos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPurchaseOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/suppliers/products/catalog`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCatalogProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCatalogProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/suppliers/products/catalog/add`, catalogForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Catalog product added successfully!", "success");
        setCatalogForm({ name: "", category: "General", description: "", purchasePrice: "" });
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to add catalog product", "error");
    }
  };

  const handlePOAction = async (poId, status) => {
    try {
      const res = await axios.put(`${API_URL}/api/suppliers/po/${poId}`, {
        status,
        message: responseMessage,
        expectedDeliveryDate: expectedDeliveryDate || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        showToast(`Purchase order successfully ${status}!`, "success");
        setSelectedPOId(null);
        setResponseMessage("");
        setExpectedDeliveryDate("");
        fetchPOs();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update order", "error");
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
            <>
              {/* Stats Grid */}
              <div className="supplier-stats-grid">
                <div className="supplier-stat-card">
                  <div className="supplier-stat-icon">
                    <Truck size={24} />
                  </div>
                  <div className="supplier-stat-info">
                    <h3>Total Orders</h3>
                    <p>{stats.totalOrders}</p>
                  </div>
                </div>

                <div className="supplier-stat-card">
                  <div className="supplier-stat-icon pending">
                    <Clock size={24} />
                  </div>
                  <div className="supplier-stat-info">
                    <h3>Pending Approval</h3>
                    <p>{stats.pendingApproval}</p>
                  </div>
                </div>

                <div className="supplier-stat-card">
                  <div className="supplier-stat-icon accepted">
                    <Calendar size={24} />
                  </div>
                  <div className="supplier-stat-info">
                    <h3>Pending Deliveries</h3>
                    <p>{stats.pendingDeliveries}</p>
                  </div>
                </div>

                <div className="supplier-stat-card">
                  <div className="supplier-stat-icon completed">
                    <CheckSquare size={24} />
                  </div>
                  <div className="supplier-stat-info">
                    <h3>Completed Orders</h3>
                    <p>{stats.completedDeliveries}</p>
                  </div>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <h2 className="supplier-section-title">Recent Pending Orders</h2>
              {purchaseOrders.filter(po => po.status === 'pending').length === 0 ? (
                <div className="supplier-empty-state">
                  <Inbox size={32} className="supplier-empty-state-icon" />
                  <span>No pending purchase requests currently.</span>
                </div>
              ) : (
                purchaseOrders.filter(po => po.status === 'pending').map((po) => (
                  <div className="po-card" key={po._id}>
                    <div className="po-card-header">
                      <div className="po-title">
                        <Package size={18} className="po-title-icon" />
                        <span>Order Ref: {po.po_id}</span>
                      </div>
                      <span className={`po-status-badge ${po.status}`}>{po.status}</span>
                    </div>

                    <div className="po-details-grid">
                      <div className="po-detail-item">
                        <label>Store Name</label>
                        <span>{po.store_id?.name || "Retail Store"}</span>
                      </div>
                      <div className="po-detail-item">
                        <label>Total Items</label>
                        <span>{po.items?.reduce((sum, i) => sum + i.quantity, 0) || 0} items</span>
                      </div>
                      <div className="po-detail-item">
                        <label>PO Value</label>
                        <span className="po-value-text">₹{po.totalAmount}</span>
                      </div>
                    </div>

                    <h4 className="po-items-section-header">Items Details</h4>
                    <table className="po-items-detail-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th className="center">Qty</th>
                          <th className="right">Unit Price</th>
                          <th className="right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {po.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.productName}</td>
                            <td className="center">{item.quantity}</td>
                            <td className="right">₹{item.unitPrice}</td>
                            <td className="right total">₹{item.totalPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {selectedPOId !== po._id ? (
                      <div className="po-actions-row">
                        <button onClick={() => { setSelectedPOId(po._id); setResponseType("accept"); }} className="action-btn-accept">Accept Order</button>
                        <button onClick={() => { setSelectedPOId(po._id); setResponseType("reject"); }} className="action-btn-reject">Reject Order</button>
                      </div>
                    ) : (
                      <div className="po-response-box">
                        <h4 className={`po-response-header ${responseType === "accept" ? "accept" : "reject"}`}>
                          {responseType === "accept" ? "Accepting Purchase Order" : "Rejecting Purchase Order"}
                        </h4>
                        {responseType === "accept" && (
                          <div className="po-response-field-group">
                            <label>Expected Delivery Date</label>
                            <input
                              type="date"
                              className="date-input"
                              value={expectedDeliveryDate}
                              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                            />
                          </div>
                        )}
                        <textarea
                          className="textarea-input"
                          placeholder={responseType === "accept" ? "Add expected delivery details or notes..." : "Provide reason for rejecting..."}
                          rows={3}
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                        />
                        <div className="po-response-actions">
                          <button onClick={() => handlePOAction(po._id, responseType === "accept" ? "accepted" : "rejected")} className={responseType === "accept" ? "action-btn-accept" : "action-btn-reject"}>
                            Confirm {responseType === "accept" ? "Accept" : "Reject"}
                          </button>
                          <button onClick={() => setSelectedPOId(null)} className="cancel-btn">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* TAB 2: PURCHASE ORDERS LIST */}
          {activeTab === "Purchase Orders" && (
            <div>
              <h2 className="supplier-section-title po-history-title">Purchase Orders Log</h2>
              {purchaseOrders.length === 0 ? (
                <div className="supplier-empty-state large">
                  <Inbox size={40} className="supplier-empty-state-icon large" />
                  <h3>No Purchase Orders Found</h3>
                  <p>Retail store owners will initiate purchase requests which will appear here.</p>
                </div>
              ) : (
                purchaseOrders.map((po) => (
                  <div className="po-card" key={po._id}>
                    <div className="po-card-header">
                      <div className="po-title">
                        <CheckSquare size={18} className="po-title-icon orders" />
                        <span>Order Ref: {po.po_id}</span>
                      </div>
                      <span className={`po-status-badge ${po.status}`}>{po.status}</span>
                    </div>

                    <div className="po-details-grid">
                      <div className="po-detail-item">
                        <label>Store Name</label>
                        <span>{po.store_id?.name || "Retail Outlet"}</span>
                      </div>
                      <div className="po-detail-item">
                        <label>Store Owner</label>
                        <span>{po.owner_id?.name || "Owner"}</span>
                      </div>
                      <div className="po-detail-item">
                        <label>Total Value</label>
                        <span className="po-value-text">₹{po.totalAmount}</span>
                      </div>
                      <div className="po-detail-item">
                        <label>Expected Delivery</label>
                        <span>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "Not specified"}</span>
                      </div>
                      <div className="po-detail-item">
                        <label>Actual Delivery</label>
                        <span>{po.actualDeliveryDate ? new Date(po.actualDeliveryDate).toLocaleDateString() : "Not delivered"}</span>
                      </div>
                      <div className="po-detail-item">
                        <label>Date Ordered</label>
                        <span>{new Date(po.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Supplier response summary */}
                    {po.supplierResponse?.message && (
                      <div className="po-supplier-response-msg">
                        <span className="po-supplier-response-msg-label">Supplier Response Message</span>
                        <p className="po-supplier-response-msg-text">{po.supplierResponse.message}</p>
                      </div>
                    )}

                    {po.status === 'accepted' && (
                      <button
                        onClick={() => handlePOAction(po._id, 'delivered')}
                        className="action-btn-delivered"
                      >
                        🚚 Mark as Delivered
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: SUPPLIED PRODUCTS */}
          {activeTab === "Supplied Products" && (
            <div className="supplier-catalog-container" style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
              
              {/* Form to Add Product */}
              <div className="customer-auth-card" style={{ flex: "1 1 350px", background: "rgba(15, 12, 30, 0.45)", padding: "24px", borderRadius: "18px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <h2 className="supplier-section-title" style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Add Product to Catalog</h2>
                <form onSubmit={handleCreateCatalogProduct} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Product Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Wireless Mouse"
                      value={catalogForm.name}
                      onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Category</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Electronics"
                      value={catalogForm.category}
                      onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Supply Price (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 400"
                      value={catalogForm.purchasePrice}
                      onChange={(e) => setCatalogForm({ ...catalogForm, purchasePrice: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Description</label>
                    <textarea
                      className="textarea-input"
                      placeholder="Product details..."
                      rows={3}
                      value={catalogForm.description}
                      onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="submit-btn" style={{ padding: "10px", marginTop: "10px" }}>
                    Add Product
                  </button>
                </form>
              </div>

              {/* Catalog List */}
              <div style={{ flex: "2 1 500px" }}>
                <h2 className="supplier-section-title">My Supply Catalog</h2>
                {catalogProducts.length === 0 ? (
                  <div className="supplier-empty-state" style={{ padding: "3rem" }}>
                    <span>Your catalog is empty. Add products on the left to start supplying.</span>
                  </div>
                ) : (
                  <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
                    {catalogProducts.map((product) => (
                      <div className="supplier-product-card" key={product._id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff", marginBottom: "5px" }}>{product.name}</h3>
                          <span style={{ fontSize: "0.75rem", background: "rgba(167, 139, 250, 0.15)", color: "#a78bfa", padding: "3px 8px", borderRadius: "20px", display: "inline-block", marginBottom: "10px" }}>
                            {product.category || "General"}
                          </span>
                          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 15px 0" }}>{product.description || "No description provided."}</p>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "10px" }}>
                          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "#10b981" }}>₹{product.purchasePrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: SETTINGS / PROFILE */}
          {activeTab === "Settings" && (
            <div className="customer-auth-card settings-profile-card">
              <h2 className="supplier-section-title">Profile Information</h2>

              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="profile-fields-row">
                  <div className="form-group">
                    <label>Supplier ID</label>
                    <input type="text" className="form-input" value={supplier?.supplier_id || ""} disabled />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" className="form-input" value={supplier?.email || ""} disabled />
                  </div>
                </div>

                <div className="profile-fields-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Phone *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "15px" }}>
                  <label>Business Address</label>
                  <input
                    className="form-input"
                    placeholder="Enter your business address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>

                <div className="supplier-form-actions">
                  <button type="submit" className="submit-btn">
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
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
