import { useState } from "react";
import { X, Store } from "lucide-react";
import "../../components/Toast.jsx";

function CreateStoreModal({ onClose, setStores, stores }) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem("token");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/stores/createStore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          contact: { phone: formData.phone, email: formData.email },
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStores([...stores, data.data]);
        setToast({ message: "Store created successfully!", type: "success" });
        onClose();
      } else {
        setToast({ message: data.message || "Failed to create store", type: "error" });
      }
    } catch (err) {
      console.error("Error creating store:", err);
      setToast({ message: "Error creating store", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Store size={22} /> Create New Store
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <form className="form-container" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Store Name *</label>
            <input
              name="name"
              type="text"
              placeholder="e.g. SuperMart"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Location *</label>
            <input
              name="location"
              type="text"
              placeholder="City or Area"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="store@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Street</label>
              <input
                name="street"
                type="text"
                placeholder="e.g. 123 Main St"
                value={formData.street}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                name="city"
                type="text"
                placeholder="e.g. Surat"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>State</label>
              <input
                name="state"
                type="text"
                placeholder="e.g. Gujarat"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>ZIP</label>
              <input
                name="zipCode"
                type="text"
                placeholder="e.g. 395007"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStoreModal;
