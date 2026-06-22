import { useState, useEffect } from "react";
import axios from "axios";
import { Save } from "lucide-react";
import Toast from "../../common/Toast";
import "../../../styles/SupplierSettings.css";
import { API_URL } from "../../../config";

function SupplierSettings({ supplier, setSupplier, token }) {
  const [profileForm, setProfileForm] = useState({
    name: supplier?.name || "",
    phone: supplier?.phone || "",
    address: supplier?.address || ""
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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

  if (loading) {
    return (
      <div className="global-loader-overlay">
        <Loader2 className="spinner spinner-icon" size={40} />
      </div>
    );
  }

  return (
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

export default SupplierSettings;
