import "../../styles/StoreDetails.css";
import { useState, useEffect } from "react";
import { Store as StoreIcon, MapPin, Phone, Mail, User, Home } from "lucide-react";

const StoreDetails = ({ storeId }) => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStoreDetails();
  }, [storeId]);

  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStore(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching store details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="store-details-section"><p>Loading store details...</p></div>;
  }

  if (!store) {
    return <div className="store-details-section"><p>Store not found</p></div>;
  }

  return (
    <div className="store-details-section">
      <div className="store-details-header">
        <h2><StoreIcon size={24} /> Store Details</h2>
      </div>

      <div className="store-details-content">
        <div className="details-group">
          <h3><StoreIcon size={18} /> Store Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Store Name</label>
              <span>{store.name || "Not set"}</span>
            </div>
            <div className="detail-item">
              <label>Store Phone</label>
              <span>{store.contact?.phone || "Not set"}</span>
            </div>
            <div className="detail-item">
              <label>Store Email</label>
              <span>{store.contact?.email || "Not set"}</span>
            </div>
            <div className="detail-item">
              <label>Store ID</label>
              <span>{store.store_id || "Not set"}</span>
            </div>
          </div>
        </div>

        <div className="details-group">
          <h3><User size={18} /> Owner Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Owner Name</label>
              <span>{store.owner_id?.name || "Not set"}</span>
            </div>
            <div className="detail-item">
              <label>Owner Email</label>
              <span>{store.owner_id?.email || "Not set"}</span>
            </div>
            <div className="detail-item">
              <label>Owner Phone</label>
              <span>{store.owner_id?.phone || "Not set"}</span>
            </div>
          </div>
        </div>

        <div className="details-group">
          <h3><MapPin size={18} /> Address</h3>
          <div className="details-grid">
            <div className="detail-item full-width">
              <label>Street</label>
              <span>{store.address?.street || "Not set"}</span>
            </div>
            <div className="detail-item">
              <label>City</label>
              <span>{store.address?.city || "Not set"}</span>
            </div>
            <div className="detail-item">
              <label>State</label>
              <span>{store.address?.state || "Not set"}</span>
            </div>
            <div className="detail-item">
              <label>ZIP Code</label>
              <span>{store.address?.zipCode || "Not set"}</span>
            </div>
          </div>
        </div>

        <div className="details-group">
          <h3><Home size={18} /> Location</h3>
          <div className="details-grid">
            <div className="detail-item full-width">
              <label>Location Label</label>
              <span>{store.location || "Not set"}</span>
            </div>
            <div className="detail-item">
              <label>Status</label>
              <span>{store.status || "active"}</span>
            </div>
            <div className="detail-item">
              <label>Created At</label>
              <span>{store.createdAt ? new Date(store.createdAt).toLocaleDateString() : "Not set"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDetails;