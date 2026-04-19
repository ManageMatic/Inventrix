import { useEffect, useState } from "react";
import ProductModal from "./ProductModal";
import { Trash2, Edit, QrCode, ChevronUp, ChevronDown } from "lucide-react";
import "../../components/Toast.jsx";

const ProductsTable = ({ storeId, refreshSignal }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const token = localStorage.getItem("token");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (storeId) fetchProducts();
  }, [storeId, refreshSignal]);

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle different data types
    if (sortField === 'sellingPrice' || sortField === 'quantity') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else if (sortField === 'product_id') {
      aValue = parseInt(aValue);
      bValue = parseInt(bValue);
    } else {
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

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
                <th onClick={() => handleSort('product_id')} className="sortable-header">
                  ID {sortField === 'product_id' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th onClick={() => handleSort('name')} className="sortable-header">
                  Name {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th onClick={() => handleSort('category')} className="sortable-header">
                  Category {sortField === 'category' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th onClick={() => handleSort('sellingPrice')} className="sortable-header">
                  Price {sortField === 'sellingPrice' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th onClick={() => handleSort('quantity')} className="sortable-header">
                  Stock {sortField === 'quantity' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
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
