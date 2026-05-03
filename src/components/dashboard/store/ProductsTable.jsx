import "../../../styles/ProductsTable.css";
import { useEffect, useState } from "react";
import ProductModal from "./ProductModal";
import ConfirmDialog from "../../common/ConfirmDialog";
import { Trash2, Edit, QrCode, ChevronUp, ChevronDown, X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { API_URL, CLIENT_URL } from "../../../config";

const ProductsTable = ({ storeId, refreshSignal }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const token = localStorage.getItem("token");
  const [toast, setToast] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRProduct, setSelectedQRProduct] = useState(null);

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
      } else {
        setToast({ message: "Error deleting product", type: "error" });
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      setToast({ message: "Error deleting product", type: "error" });
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
    setCurrentPage(1); // Reset to first page when sorting
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle different data types
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

  // Pagination logic
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
                <th
                  onClick={() => handleSort("product_id")}
                  className="sortable-header"
                >
                  ID{" "}
                  {sortField === "product_id" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </th>
                <th
                  onClick={() => handleSort("name")}
                  className="sortable-header"
                >
                  Name{" "}
                  {sortField === "name" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </th>
                <th
                  onClick={() => handleSort("category")}
                  className="sortable-header"
                >
                  Category{" "}
                  {sortField === "category" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </th>
                <th
                  onClick={() => handleSort("sellingPrice")}
                  className="sortable-header"
                >
                  Price{" "}
                  {sortField === "sellingPrice" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </th>
                <th
                  onClick={() => handleSort("quantity")}
                  className="sortable-header"
                >
                  Stock{" "}
                  {sortField === "quantity" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p) => (
                <tr key={p._id}>
                  <td>{p.product_id}</td>
                  <td>{p.name}</td>
                  <td>{p.category || "—"}</td>
                  <td>₹{p.sellingPrice.toFixed(2)}</td>
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
                      onClick={() => handleDeleteClick(p._id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button className="icon-btn" title="QR" onClick={() => handleShowQR(p)}>
                      <QrCode size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Product Modal for Add/Edit */}
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

      {/* Confirm Delete Dialog */}
      {confirmOpen && (
        <ConfirmDialog
          title="Delete Product"
          message="Are you sure you want to delete this product?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {/* QR Modal */}
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
