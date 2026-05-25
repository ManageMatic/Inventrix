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
  Inbox
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
  const [productsData, setProductsData] = useState({ supplied: [], allAvailable: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Response form states
  const [selectedPOId, setSelectedPOId] = useState(null);
  const [responseType, setResponseType] = useState(""); // "accept" or "reject"
  const [responseMessage, setResponseMessage] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  if (!token) {
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
      const res = await axios.get(`${API_URL}/api/suppliers/my-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setProductsData(res.data.data);
      }
    } catch (err) {
      console.error(err);
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

  const handleSupplyProduct = async (productId) => {
    try {
      const res = await axios.post(`${API_URL}/api/suppliers/products/supply`, {
        product_id: productId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        showToast("Product added to your supply list!", "success");
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to supply product", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
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
        <div className="supplier-dashboard-header">
          <div className="supplier-header-left">
            <button
              className="supplier-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <div className="header-title">Supplier Workspace</div>
          </div>
          <div className="header-actions">
            <span className="supplier-user-badge">
              🚚 {supplier?.email}
            </span>
          </div>
        </div>

        <div className="supplier-content-area">

          {/* Banner */}
          <div className="supplier-welcome-banner">
            <h1>
              Welcome Back, {supplier?.name || "Supplier Partner"}
            </h1>
            <p>Manage retail store orders, supply items, and delivery logs in real-time.</p>
          </div>

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
                            <button onClick={() => setSelectedPOId(null)} className="supplier-logout-btn">Cancel</button>
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
                  <div>
                    <h2 className="supplier-section-title">Supply Catalog</h2>
                    <p className="supplier-catalog-desc">Register items you can supply to retail locations. When store owners request these products, your contact details will serve as supplier references.</p>

                    <div className="product-grid">
                      {productsData.allAvailable?.map((product) => {
                        const isSupplied = productsData.supplied?.some(s => s._id === product._id);
                        return (
                          <div className="supplier-product-card" key={product._id}>
                            <h3>{product.name}</h3>
                            <p>{product.description || "No description provided."}</p>
                            <div className="product-store-ref">
                              Store: {product.store?.name || "Retail Store"}
                            </div>
                            <div className="product-meta-row">
                              <div className="product-supply-price">₹{product.purchasePrice}</div>
                              {isSupplied ? (
                                <span className="supply-status-tag">Supplying</span>
                              ) : (
                                <button onClick={() => handleSupplyProduct(product._id)} className="supply-action-btn">
                                  Supply Product
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 4: SETTINGS / PROFILE */}
                {activeTab === "Settings" && (
                  <div className="customer-auth-card settings-profile-card">
                    <h2 className="supplier-section-title">Profile Information</h2>

                    <div className="profile-fields-row">
                      <div className="form-group">
                        <label>Supplier ID</label>
                        <input type="text" className="form-input" value={supplier?.supplier_id || ""} disabled />
                      </div>

                      <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" className="form-input" value={supplier?.name || ""} disabled />
                      </div>
                    </div>

                    <div className="profile-fields-row">
                      <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" className="form-input" value={supplier?.email || ""} disabled />
                      </div>

                      <div className="form-group">
                        <label>Contact Phone</label>
                        <input type="text" className="form-input" value={supplier?.phone || ""} disabled />
                      </div>
                    </div>
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
        const Loader2 = ({className, size}) => (
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
