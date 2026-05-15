import { useState, useEffect } from "react";
import { Trash2, Edit, ChevronUp, ChevronDown, Search, Download } from "lucide-react";
import { API_URL } from "../../../config";
import ConfirmDialog from "../../common/ConfirmDialog";
import Toast from "../../common/Toast";
import "../../../styles/SalesTable.css";

const SalesTable = ({ storeId, employeeId, permissions = [], refreshSignal }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const token = localStorage.getItem("token");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  // Helper to check permissions
  const hasPermission = (resource, action) => {
    if (!permissions || permissions.length === 0) return true;
    const perm = permissions.find((p) => p.resource === resource);
    return perm && perm.actions.includes(action);
  };

  useEffect(() => {
    if (!storeId) return;
    fetchSales();
  }, [storeId, employeeId, refreshSignal]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/sales/store/${storeId}`;
      if (employeeId) {
        url += `?employeeId=${employeeId}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    setCurrentPage(1);
  };

  // Search logic
  const filteredSales = sales.filter(sale => {
    const sId = sale.sale_id?.toString().toLowerCase() || "";
    const empName = (sale.employee_id?.name || "").toLowerCase();
    const ownerName = (sale.store_owner_id?.name || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return sId.includes(query) || empName.includes(query) || ownerName.includes(query);
  });

  const sortedSales = [...filteredSales].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

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

  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = sortedSales.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (saleId) => {
    setDeleteId(saleId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_URL}/api/sales/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSales(sales.filter((s) => s._id !== deleteId));
        setToast({ message: "Sale deleted successfully", type: "success" });
      } else {
        setToast({ message: "Failed to delete sale", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Error deleting sale: " + err.message, type: "error" });
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleUpdateStatus = async (saleId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/sales/${saleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSales(sales.map((s) => (s._id === saleId ? data.data : s)));
        setEditingSale(null);
      }
    } catch (err) {
      console.error("Update sale error:", err);
    }
  };

  const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (data, headers) => {
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] !== undefined && row[header] !== null ? row[header] : '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  const handleExportCSV = () => {
    if (sales.length === 0) {
      setToast({ message: "No data to export", type: "info" });
      return;
    }

    const formattedData = sales.map(s => ({
      'Sale ID': s.sale_id,
      'Date': new Date(s.date).toLocaleDateString(),
      'Time': new Date(s.date).toLocaleTimeString(),
      'Processed By': s.employee_id?.name || s.store_owner_id?.name || 'N/A',
      'Role': s.employee_id ? "Employee" : s.store_owner_id ? "Store Owner" : "N/A",
      'Items Count': s.items?.length || 0,
      'Subtotal': s.subtotal,
      'Total Amount': s.totalAmount,
      'Payment Method': s.paymentMethod?.toUpperCase(),
      'Status': s.status
    }));

    const headers = Object.keys(formattedData[0]);
    const csv = convertToCSV(formattedData, headers);
    downloadCSV(csv, `sales_history_${new Date().toISOString().split('T')[0]}.csv`);
    setToast({ message: "Sales history exported!", type: "success" });
  };

  if (loading) return <div className="sales-section"><p>Loading sales...</p></div>;
  if (error) return <div className="sales-section"><p style={{ color: "red" }}>Error: {error}</p></div>;

  return (
    <div className="sales-section">
      <div className="sales-header">
        <div className="header-left">
          <h2>Sales Records</h2>
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by ID or Name..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={handleExportCSV}>
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <p>No sales records found.</p>
      ) : (
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("sale_id")} className="sortable-header">
                  Sale ID {sortField === "sale_id" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th onClick={() => handleSort("date")} className="sortable-header">
                  Date {sortField === "date" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th>Processed By</th>
                <th>Items</th>
                <th onClick={() => handleSort("subtotal")} className="sortable-header">
                  Subtotal {sortField === "subtotal" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th onClick={() => handleSort("totalAmount")} className="sortable-header">
                  Total {sortField === "totalAmount" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th>Payment</th>
                <th onClick={() => handleSort("status")} className="sortable-header">
                  Status {sortField === "status" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                {hasPermission("sales", "update") || hasPermission("sales", "delete") ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((sale) => (
                <tr key={sale._id}>
                  <td>{sale.sale_id}</td>
                  <td>{new Date(sale.date).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '500' }}>
                        {sale.employee_id?.name || sale.store_owner_id?.name || "N/A"}
                      </span>
                      <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        {sale.employee_id ? "Employee" : sale.store_owner_id ? "Store Owner" : ""}
                      </small>
                    </div>
                  </td>
                  <td>{sale.items.length} items</td>
                  <td>₹{sale.subtotal}</td>
                  <td><strong>₹{sale.totalAmount}</strong></td>
                  <td>{sale.paymentMethod.toUpperCase()}</td>
                  <td>
                    {editingSale === sale._id ? (
                      <select value={sale.status} onChange={(e) => handleUpdateStatus(sale._id, e.target.value)}>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    ) : (
                      <span className={`status-badge status-${sale.status}`}>{sale.status}</span>
                    )}
                  </td>
                  {hasPermission("sales", "update") || hasPermission("sales", "delete") ? (
                    <td>
                      {hasPermission("sales", "update") && (
                        <button className="edit-btn" onClick={() => setEditingSale(editingSale === sale._id ? null : sale._id)} title="Edit Status">
                          <Edit size={16} />
                        </button>
                      )}
                      {hasPermission("sales", "delete") && (
                        <button className="delete-btn" onClick={() => handleDeleteClick(sale._id)} title="Delete Sale">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
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

          <div className="sales-total">
            <h3>
              Total Sales: <span>₹{sales.reduce((sum, sale) => sum + sale.totalAmount, 0).toLocaleString('en-IN')}</span>
            </h3>
          </div>
        </div>
      )}

      {confirmOpen && (
        <ConfirmDialog
          title="Delete Sale Record"
          message="Are you sure you want to delete this sale?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SalesTable;
