import "../../../styles/SalesTable.css";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Trash2, Edit2, ChevronUp, ChevronDown } from "lucide-react";

const SalesTable = () => {
  const { storeId } = useParams();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const token = localStorage.getItem("token");

  // Fetch sales data
  useEffect(() => {
    if (!storeId) return;
    fetchSales();
  }, [storeId]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales/store/${storeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      if (data.success) {
        setSales(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
      console.error("Fetch sales error:", err);
    } finally {
      setLoading(false);
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

  const sortedSales = [...sales].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle different data types
    if (sortField === "date") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortField === "subtotal" || sortField === "totalAmount") {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else if (sortField === "sale_id") {
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
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = sortedSales.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDelete = async (saleId) => {
    if (!window.confirm("Are you sure you want to delete this sale?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales/${saleId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      if (data.success) {
        setSales(sales.filter((s) => s._id !== saleId));
        alert("Sale deleted successfully");
      } else {
        alert(data.message || "Failed to delete sale");
      }
    } catch (err) {
      alert("Error deleting sale: " + err.message);
    }
  };

  const handleUpdateStatus = async (saleId, newStatus) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales/${saleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await res.json();

      if (data.success) {
        setSales(sales.map((s) => (s._id === saleId ? data.data : s)));
        setEditingSale(null);
        alert("Sale updated successfully");
      } else {
        alert(data.message || "Failed to update sale");
      }
    } catch (err) {
      alert("Error updating sale: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="sales-section">
        <p>Loading sales...</p>
      </div>
    );

  if (error)
    return (
      <div className="sales-section">
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );

  return (
    <div className="sales-section">
      <div className="sales-header">
        <h2>Sales Records</h2>
      </div>

      {sales.length === 0 ? (
        <p>No sales records found.</p>
      ) : (
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("sale_id")}
                  className="sortable-header"
                >
                  Sale ID{" "}
                  {sortField === "sale_id" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </th>
                <th
                  onClick={() => handleSort("date")}
                  className="sortable-header"
                >
                  Date{" "}
                  {sortField === "date" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </th>
                <th>Items</th>
                <th
                  onClick={() => handleSort("subtotal")}
                  className="sortable-header"
                >
                  Subtotal{" "}
                  {sortField === "subtotal" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </th>
                <th
                  onClick={() => handleSort("totalAmount")}
                  className="sortable-header"
                >
                  Total{" "}
                  {sortField === "totalAmount" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </th>
                <th>Payment</th>
                <th
                  onClick={() => handleSort("status")}
                  className="sortable-header"
                >
                  Status{" "}
                  {sortField === "status" &&
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
              {paginatedSales.map((sale) => (
                <tr key={sale._id}>
                  <td>{sale.sale_id}</td>
                  <td>{new Date(sale.date).toLocaleDateString()}</td>
                  <td>{sale.items.length} items</td>
                  <td>₹{sale.subtotal}</td>
                  <td>
                    <strong>₹{sale.totalAmount}</strong>
                  </td>
                  <td>{sale.paymentMethod.toUpperCase()}</td>
                  <td>
                    {editingSale === sale._id ? (
                      <select
                        value={sale.status}
                        onChange={(e) =>
                          handleUpdateStatus(sale._id, e.target.value)
                        }
                      >
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    ) : (
                      <span className={`status-badge status-${sale.status}`}>
                        {sale.status}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() =>
                        setEditingSale(
                          editingSale === sale._id ? null : sale._id,
                        )
                      }
                      title="Edit Status"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(sale._id)}
                      title="Delete Sale"
                    >
                      <Trash2 size={16} />
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

          <div className="sales-total">
            <h3>
              Total Sales: ₹
              {sales.reduce((sum, sale) => sum + sale.totalAmount, 0)}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTable;
