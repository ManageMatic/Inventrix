import { useState } from "react";
import { X } from "lucide-react";
import "../../components/Toast.jsx";

const ProductModal = ({ storeId, product, onClose }) => {
  const [form, setForm] = useState({
    name: product?.name || "",
    category: product?.category || "",
    price: product?.price || 0,
    quantity: product?.quantity || 0,
    description: product?.description || "",
    imageUrl: product?.imageUrl || "",
    reorderLevel: product?.reorderLevel || 10,
  });
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const [toast, setToast] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = product
        ? `http://localhost:5000/api/products/${product._id}`
        : `http://localhost:5000/api/products/add/${storeId}`;
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, store_id: storeId }),
      });

      const data = await res.json();
      if (data.success) {
        onClose();
      } else {
        setToast({ message: data.message || "Error saving product", type: "error" });
      }
    } catch (err) {
      console.error("product save error:", err);
      setToast({ message: "Server error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? "Edit Product" : "Add Product"}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="form-container" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Price</label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Reorder Level</label>
              <input
                name="reorderLevel"
                type="number"
                value={form.reorderLevel}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
