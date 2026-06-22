import { useState, useEffect } from "react";
import axios from "axios";
import {
  Truck,
  Clock,
  Calendar,
  CheckSquare,
  Package,
  Inbox
} from "lucide-react";
import Toast from "../../common/Toast";
import "../../../styles/SupplierDashboardHome.css";
import { API_URL } from "../../../config";

function SupplierDashboardHome({ token }) {
  const [stats, setStats] = useState({ totalOrders: 0, pendingDeliveries: 0, completedDeliveries: 0, pendingApproval: 0 });
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Response form states
  const [selectedPOId, setSelectedPOId] = useState(null);
  const [responseType, setResponseType] = useState(""); // "accept" or "reject"
  const [responseMessage, setResponseMessage] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [isPoDateFocused, setIsPoDateFocused] = useState(false);

  const formatDateToIndian = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

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

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchPOs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  if (loading) {
    return (
      <div className="global-loader-overlay">
        <Loader2 className="spinner spinner-icon" size={40} />
      </div>
    );
  }

  return (
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
                       type={isPoDateFocused ? "date" : "text"}
                       className="date-input"
                       value={isPoDateFocused ? expectedDeliveryDate : formatDateToIndian(expectedDeliveryDate)}
                       placeholder="dd/mm/yyyy"
                       onFocus={() => setIsPoDateFocused(true)}
                       onBlur={() => setIsPoDateFocused(false)}
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </>
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

export default SupplierDashboardHome;
