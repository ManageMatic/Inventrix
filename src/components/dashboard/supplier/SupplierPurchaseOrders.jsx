import { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckSquare,
  Inbox
} from "lucide-react";
import Toast from "../../common/Toast";
import "../../../styles/SupplierDashboard.css";
import { API_URL } from "../../../config";

function SupplierPurchaseOrders({ token }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

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
    await fetchPOs();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePOAction = async (poId, status) => {
    try {
      const res = await axios.put(`${API_URL}/api/suppliers/po/${poId}`, {
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        showToast(`Purchase order successfully marked as ${status}!`, "success");
        fetchPOs();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update order status", "error");
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
                <span>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN") : "Not specified"}</span>
              </div>
              <div className="po-detail-item">
                <label>Actual Delivery</label>
                <span>{po.actualDeliveryDate ? new Date(po.actualDeliveryDate).toLocaleDateString("en-IN") : "Not delivered"}</span>
              </div>
              <div className="po-detail-item">
                <label>Date Ordered</label>
                <span>{new Date(po.createdAt).toLocaleDateString("en-IN")}</span>
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

export default SupplierPurchaseOrders;
