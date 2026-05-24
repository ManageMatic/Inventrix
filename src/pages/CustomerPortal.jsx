import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Mail, ShieldCheck, Download, Trash2, ArrowLeft, Loader2, Sparkles } from "lucide-react";
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
      const res = await axios.post(`${API_URL}/api/auth/send-otp`, {
        email: email.trim(),
        isCustomer: true,
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
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, {
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
  };

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
                <div className="table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
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
                      {invoices.map((inv) => (
                        <tr key={inv._id}>
                          <td>
                            <span className="invoice-badge">{inv.invoice_id}</span>
                          </td>
                          <td>
                            <div className="store-name">{inv.store_id?.name || "Inventrix Store"}</div>
                            <div className="store-loc">{inv.store_id?.location || "Retail Outlet"}</div>
                          </td>
                          <td>{new Date(inv.date).toLocaleDateString()}</td>
                          <td>{inv.items?.reduce((acc, item) => acc + item.quantity, 0) || 0} items</td>
                          <td>
                            <span className="amount-text">₹{inv.totalAmount}</span>
                          </td>
                          <td>
                            <span className="payment-text">{inv.paymentMethod || "Cash"}</span>
                          </td>
                          <td>
                            <a
                              href={`${API_URL}/api/invoices/public/download/${inv._id}?email=${encodeURIComponent(email)}`}
                              className="download-link"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download size={14} />
                              <span>PDF</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
