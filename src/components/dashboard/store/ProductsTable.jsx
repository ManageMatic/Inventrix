import { useEffect, useState } from "react";
import ProductModal from "./ProductModal";
import ConfirmDialog from "../../common/ConfirmDialog";
import { Trash2, Edit, QrCode, ChevronUp, ChevronDown, X, Search } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { API_URL, CLIENT_URL } from "../../../config";
import "../../../styles/ProductsTable.css";

const ProductsTable = ({ storeId, refreshSignal, permissions = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const token = localStorage.getItem("token");
  const [toast, setToast] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRProduct, setSelectedQRProduct] = useState(null);

  // Helper to check permissions
  const hasPermission = (resource, action) => {
    if (!permissions || permissions.length === 0) return true;
    const perm = permissions.find((p) => p.resource === resource);
    return perm && perm.actions.includes(action);
  };

  useEffect(() => {
    if (storeId) fetchProducts();
  }, [storeId, refreshSignal]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/products/${storeId}`, {
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

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleShowQR = (product) => {
    setSelectedQRProduct(product);
    setShowQRModal(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/products/${deleteId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setProducts(products.filter((p) => p._id !== deleteId));
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Filter products based on search query
  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.product_id?.toString().includes(searchQuery) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === "sellingPrice" || sortField === "quantity") {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else if (sortField === "product_id") {
      aValue = parseInt(aValue);
      bValue = parseInt(bValue);
    } else {
      aValue = String(aValue || "").toLowerCase();
      bValue = String(bValue || "").toLowerCase();
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="products-section">
      <div className="products-header">
        <div className="header-left">
          <h2>Products</h2>
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <div>
          {storeId !== "All" && hasPermission("products", "create") && (
            <button className="add-product" onClick={handleAdd}>
              Add Product
            </button>
          )}
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
                <th onClick={() => handleSort("product_id")} className="sortable-header">
                  ID {sortField === "product_id" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th onClick={() => handleSort("name")} className="sortable-header">
                  Name {sortField === "name" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                {storeId === "All" && <th>Store</th>}
                <th onClick={() => handleSort("category")} className="sortable-header">
                  Category {sortField === "category" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th onClick={() => handleSort("sellingPrice")} className="sortable-header">
                  Price {sortField === "sellingPrice" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th onClick={() => handleSort("quantity")} className="sortable-header">
                  Stock {sortField === "quantity" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p) => {
                const isLowStock = p.quantity < 5;
                return (
                  <tr key={p._id}>
                    <td>{p.product_id}</td>
                    <td>{p.name}</td>
                    {storeId === "All" && <td>{p.store?.name || "Unknown"}</td>}
                    <td>{p.category || "—"}</td>
                    <td><span className="price-highlight">₹{p.sellingPrice.toFixed(2)}</span></td>
                    <td>
                      <div className="stock-info">
                        <strong>{p.quantity}</strong>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${isLowStock ? 'danger' : 'success'}`}>
                        {isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      {hasPermission("products", "update") && (
                        <button className="icon-btn edit-btn" onClick={() => handleEdit(p)} title="Edit">
                          <Edit size={16} />
                        </button>
                      )}
                      {hasPermission("products", "delete") && (
                        <button className="icon-btn delete-btn" onClick={() => handleDeleteClick(p._id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button className="icon-btn qr-btn" title="QR" onClick={() => handleShowQR(p)}>
                        <QrCode size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-btn">
                Previous
              </button>
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-btn">
                Next
              </button>
            </div>
          )}
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

      {confirmOpen && (
        <ConfirmDialog
          title="Delete Product"
          message="Are you sure you want to delete this product?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {showQRModal && selectedQRProduct && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'auto', textAlign: 'center', padding: '30px' }}>
            <div className="modal-header" style={{ justifyContent: 'center', marginBottom: '20px', position: 'relative' }}>
              <h2>QR Code - {selectedQRProduct.name}</h2>
              <button
                style={{ position: 'absolute', right: '0', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setShowQRModal(false)}
              >
                <X size={22} />
              </button>
            </div>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', display: 'inline-block' }}>
              <QRCodeCanvas
                id={`qr-${selectedQRProduct.name}`}
                value={`${CLIENT_URL}/scan-product/${selectedQRProduct.qr_code}?storeId=${storeId}`}
                size={200}
                level={"H"}
                includeMargin={true}
              />
            </div>
            <p style={{ marginTop: '15px', color: '#94a3b8' }}>ID: {selectedQRProduct.product_id}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
