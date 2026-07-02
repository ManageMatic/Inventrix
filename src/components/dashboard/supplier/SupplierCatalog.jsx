import { useState, useEffect } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";
import Toast from "../../common/Toast";
import ConfirmDialog from "../../common/ConfirmDialog";
import "../../../styles/SupplierCatalog.css";
import { API_URL } from "../../../config";

function SupplierCatalog({ token }) {
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogForm, setCatalogForm] = useState({ name: "", category: "General", description: "", purchasePrice: "" });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, productId: null });

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

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

  const loadData = async () => {
    setLoading(true);
    await fetchProducts();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleDeleteCatalogProduct = (productId) => {
    setConfirmDialog({ show: true, productId });
  };

  const handleConfirmDelete = async () => {
    const productId = confirmDialog.productId;
    setConfirmDialog({ show: false, productId: null });
    if (!productId) return;

    try {
      const res = await axios.delete(`${API_URL}/api/suppliers/products/catalog/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Product removed from catalog successfully!", "success");
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to remove product from catalog", "error");
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
    <div className="supplier-catalog-container">
      
      {/* Form to Add Product */}
      <div className="supplier-catalog-form-container">
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
      <div className="supplier-catalog-list-container">
        <h2 className="supplier-section-title">My Supply Catalog</h2>
        {catalogProducts.length === 0 ? (
          <div className="supplier-empty-state" style={{ padding: "3rem" }}>
            <span>Your catalog is empty. Add products on the left to start supplying.</span>
          </div>
        ) : (
          <div className="supplier-catalog-product-grid">
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
                  <button 
                    onClick={() => handleDeleteCatalogProduct(product._id)}
                    className="catalog-delete-btn"
                    title="Remove Product from Catalog"
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDialog.show && (
        <ConfirmDialog
          title="Remove Catalog Product"
          message="Are you sure you want to remove this product from your catalog? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDialog({ show: false, productId: null })}
        />
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

export default SupplierCatalog;
