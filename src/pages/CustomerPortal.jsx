import { useState, useEffect, Fragment } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { 
  Mail, 
  ShieldCheck, 
  Download, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Search, 
  TrendingUp, 
  ShoppingBag, 
  Store, 
  Receipt, 
  Eye, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Toast from "../components/common/Toast";
import "../styles/CustomerPortal.css";
import { API_URL } from "../config";

function CustomerPortal() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = Email Input, 2 = OTP input, 3 = Dashboard
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState("All");
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

  // Check if already logged in as customer on load
  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    const savedEmail = localStorage.getItem("customerEmail");
    if (token && savedEmail) {
      setEmail(savedEmail);
      setStep(3);
      fetchHistory(token);
    }
  }, []);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/send-customer-otp`, {
        email: email.trim(),
      });

      if (res.data.success) {
        showToast("OTP sent to your email successfully!", "success");
        setStep(2);
      } else {
        showToast(res.data.message || "Failed to send OTP", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Error sending OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-customer-otp`, {
        email: email.trim(),
        otp: otp.trim(),
      });

      if (res.data.success) {
        const token = res.data.token;
        localStorage.setItem("customerToken", token);
        localStorage.setItem("customerEmail", email.trim());
        showToast("Access granted!", "success");
        
        setStep(3);
        fetchHistory(token);
      } else {
        showToast(res.data.message || "Verification failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Invalid or expired OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (token) => {
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem("customerToken");
      const res = await axios.get(`${API_URL}/api/invoices/customer/history`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });

      if (res.data.success) {
        setInvoices(res.data.data);
      } else {
        showToast(res.data.message || "Failed to fetch purchase history", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Session expired or authentication failed. Please login again.", "error");
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerEmail");
    setEmail("");
    setOtp("");
    setInvoices([]);
    setStep(1);
    setSearchQuery("");
    setSelectedStoreFilter("All");
    setExpandedInvoiceId(null);
  };

  // Helper to toggle expanded invoice row
  const toggleExpand = (invoiceId) => {
    setExpandedInvoiceId(expandedInvoiceId === invoiceId ? null : invoiceId);
  };

  // Compute unique stores for filters
  const uniqueStores = Array.from(
    new Map(
      invoices
        .filter((inv) => inv.store_id)
        .map((inv) => [inv.store_id._id, inv.store_id])
    ).values()
  );

  // Filter invoices based on search & store filter
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.store_id?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.items?.some((item) =>
        item.productName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStore =
      selectedStoreFilter === "All" || inv.store_id?._id === selectedStoreFilter;
    return matchesSearch && matchesStore;
  });

  // Calculate statistics dynamically
  const totalSpend = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalVisits = new Set(invoices.map((inv) => inv.store_id?._id).filter(Boolean)).size;
  const totalItems = invoices.reduce((acc, inv) => acc + (inv.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0), 0);

  // Group invoice amounts chronologically for Recharts spending trends chart
  const getChartData = () => {
    const dataMap = {};
    [...invoices].reverse().forEach((inv) => {
      const dateStr = new Date(inv.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });
      if (!dataMap[dateStr]) {
        dataMap[dateStr] = 0;
      }
      dataMap[dateStr] += inv.totalAmount || 0;
    });
    return Object.keys(dataMap).map((date) => ({
      date,
      amount: Math.round(dataMap[date]),
    }));
  };
  const chartData = getChartData();

  return (
    <div className="customer-portal-body">
      <div className="customer-portal-container">
        
        {/* Header section */}
        <div className="portal-header">
          <div className="portal-logo">
            <Sparkles size={28} />
            <span>Inventrix Customer Portal</span>
          </div>
          <p className="portal-subtitle">Access your bills, previous invoices and purchase history securely</p>
        </div>

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <div className="customer-auth-card">
            <h3 className="auth-title">Verify Identity</h3>
            <p className="auth-desc">We will send a secure One-Time Password (OTP) code to your registered email to grant access.</p>
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label>Registered Email Address</label>
                <div className="form-input-icon-wrapper">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="form-input form-input-with-icon"
                    required
                  />
                  <Mail size={18} className="form-input-icon" />
                </div>
              </div>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? <Loader2 className="spinner btn-spinner" size={16} /> : null}
                Send Verification OTP
              </button>
            </form>
            <Link to="/" className="secondary-link">
              <span className="flex-center-gap"><ArrowLeft size={14} /> Back to Landing Page</span>
            </Link>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <div className="customer-auth-card">
            <h3 className="auth-title">Enter Verification Code</h3>
            <p className="auth-desc">Enter the 6-digit OTP code sent to <strong>{email}</strong>.</p>
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label>One-Time Password (OTP)</label>
                <div className="form-input-icon-wrapper">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="form-input otp-input"
                    required
                  />
                  <ShieldCheck size={18} className="form-input-icon" />
                </div>
              </div>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? <Loader2 className="spinner btn-spinner" size={16} /> : null}
                Verify & Continue
              </button>
            </form>
            <div className="flex-space-between-full">
              <button onClick={() => setStep(1)} className="secondary-link btn-link-action">
                Change Email
              </button>
              <button onClick={handleSendOTP} className="secondary-link btn-link-action">
                Resend OTP
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Purchase History Dashboard */}
        {step === 3 && (
          <div className="customer-dashboard">
            {/* Stats Dashboard Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper blue">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Spent</span>
                  <h3 className="stat-value">₹{totalSpend.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper purple">
                  <Store size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Stores Visited</span>
                  <h3 className="stat-value">{totalVisits}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper pink">
                  <ShoppingBag size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Items Bought</span>
                  <h3 className="stat-value">{totalItems}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper emerald">
                  <Receipt size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Invoices</span>
                  <h3 className="stat-value">{invoices.length}</h3>
                </div>
              </div>
            </div>

            {/* Spend Analytics Chart */}
            {invoices.length > 0 && (
              <div className="chart-section">
                <h3 className="section-title">Spending Analytics</h3>
                <div className="chart-container" style={{ width: "100%", height: 260, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b" 
                        fontSize={11}
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: "rgba(15, 23, 42, 0.9)", 
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "#fff"
                        }} 
                        formatter={(value) => [`₹${value}`, "Spent"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#818cf8" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorAmount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="dashboard-card">
              <div className="dashboard-header">
                <div className="customer-info">
                  <h2>Welcome Back!</h2>
                  <p>{email}</p>
                </div>
                <button className="logout-link-btn" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>

              {loading && invoices.length === 0 ? (
                <div className="loader-wrapper">
                  <Loader2 className="spinner loader-icon-color" size={36} />
                </div>
              ) : invoices.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">📂</span>
                  <h3>No purchase history found</h3>
                  <p>Invoices are automatically registered under your email during checkout at our retail counters.</p>
                </div>
              ) : (
                <>
                  {/* Search and Filters Bar */}
                  <div className="filter-bar">
                    <div className="search-wrapper">
                      <Search size={18} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search by store, product, or invoice ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="filter-search-input"
                      />
                    </div>
                    <div className="select-wrapper">
                      <Store size={18} className="filter-icon" />
                      <select
                        value={selectedStoreFilter}
                        onChange={(e) => setSelectedStoreFilter(e.target.value)}
                        className="filter-select"
                      >
                        <option value="All">All Stores</option>
                        {uniqueStores.map((st) => (
                          <option key={st._id} value={st._id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>{/* Accordion toggle column */}</th>
                          <th>Invoice ID</th>
                          <th>Store</th>
                          <th>Date</th>
                          <th>Items Count</th>
                          <th>Total Amount</th>
                          <th>Payment</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((inv) => {
                          const isExpanded = expandedInvoiceId === inv._id;
                          const totalQuantity = inv.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                          return (
                            <Fragment key={inv._id}>
                              <tr 
                                onClick={() => toggleExpand(inv._id)}
                                className={`invoice-row ${isExpanded ? "expanded" : ""}`}
                                style={{ cursor: "pointer" }}
                              >
                                <td>
                                  {isExpanded ? <ChevronUp size={16} className="text-indigo" /> : <ChevronDown size={16} />}
                                </td>
                                <td>
                                  <span className="invoice-badge">{inv.invoice_id}</span>
                                </td>
                                <td>
                                  <div className="store-name">{inv.store_id?.name || "Inventrix Store"}</div>
                                  <div className="store-loc">{inv.store_id?.location || "Retail Outlet"}</div>
                                </td>
                                <td>{new Date(inv.date).toLocaleDateString("en-IN")}</td>
                                <td>{totalQuantity} items</td>
                                <td>
                                  <span className="amount-text">₹{inv.totalAmount.toFixed(2)}</span>
                                </td>
                                <td>
                                  <span className="payment-text">{inv.paymentMethod || "Cash"}</span>
                                </td>
                                <td>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <a
                                      href={`${API_URL}/api/invoices/public/download/${inv._id}?email=${encodeURIComponent(email)}`}
                                      className="download-link"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <Download size={14} />
                                      <span>PDF</span>
                                    </a>
                                  </div>
                                </td>
                              </tr>
                              
                              {/* Expandable details row */}
                              {isExpanded && (
                                <tr className="details-expanded-row">
                                  <td colSpan="8">
                                    <div className="details-expanded-container">
                                      <h4 className="details-title">Purchase Details</h4>
                                      <div className="details-items-table-wrapper">
                                        <table className="details-items-table">
                                          <thead>
                                            <tr>
                                              <th>Item Name</th>
                                              <th style={{ textAlign: "right" }}>Price</th>
                                              <th style={{ textAlign: "right" }}>Qty</th>
                                              <th style={{ textAlign: "right" }}>Subtotal</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {inv.items?.map((item, idx) => (
                                              <tr key={idx}>
                                                <td>{item.productName}</td>
                                                <td style={{ textAlign: "right" }}>₹{item.price?.toFixed(2)}</td>
                                                <td style={{ textAlign: "right" }}>{item.quantity}</td>
                                                <td style={{ textAlign: "right" }}>₹{item.subtotal?.toFixed(2)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      
                                      <div className="details-summary-grid">
                                        <div className="summary-left">
                                          <p><strong>Payment Method:</strong> <span className="payment-text uppercase">{inv.paymentMethod}</span></p>
                                          {inv.customer_mobile && <p><strong>Mobile:</strong> {inv.customer_mobile}</p>}
                                        </div>
                                        <div className="summary-right">
                                          <div className="summary-row">
                                            <span>Subtotal:</span>
                                            <span>₹{inv.subtotal?.toFixed(2)}</span>
                                          </div>
                                          {inv.discount > 0 && (
                                            <div className="summary-row discount">
                                              <span>Discount:</span>
                                              <span>-₹{inv.discount?.toFixed(2)}</span>
                                            </div>
                                          )}
                                          {inv.tax > 0 && (
                                            <div className="summary-row">
                                              <span>Tax:</span>
                                              <span>+₹{inv.tax?.toFixed(2)}</span>
                                            </div>
                                          )}
                                          <div className="summary-row total">
                                            <span>Total Amount:</span>
                                            <span>₹{inv.totalAmount?.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Toast Alert */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </div>
  );
}

export default CustomerPortal;
