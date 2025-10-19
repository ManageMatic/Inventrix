import { useEffect, useState } from "react";
import ProductModal from "./ProductModal";
import { Trash2, Edit, QrCode } from "lucide-react";
import "../../components/Toast.jsx";

const ProductsTable = ({ storeId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const token = localStorage.getItem("token");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (storeId) fetchProducts();
  }, [storeId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/products/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data.success) setProducts(data.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditing(product);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.filter((p) => p._id !== id));
      } else {
        
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      setToast({ message: "Error deleting product", type: "error" });
    }
  };

  return (
    <div className="products-section">
      <div className="products-header">
        <h2>Products</h2>
        <div>
          <button className="add-product" onClick={handleAdd}>
            Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products yet. Add one to get started.</p>
      ) : (
        <div className="products-table-wrap">
          <table className="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.product_id}</td>
                  <td>{p.name}</td>
                  <td>{p.category || "—"}</td>
                  <td>₹{p.price?.toFixed?.(2) ?? p.price}</td>
                  <td>{p.quantity}</td>
                  <td>
                    <button
                      className="icon-btn"
                      onClick={() => handleEdit(p)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => handleDelete(p._id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button className="icon-btn" title="QR">
                      <QrCode size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ProductModal
          storeId={storeId}
          product={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};

export default ProductsTable;
