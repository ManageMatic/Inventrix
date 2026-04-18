import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Trash2, Edit2 } from "lucide-react";

const SalesTable = () => {
  const { storeId } = useParams();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
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
          headers: { Authorization: `Bearer ${token}` }
        }
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

  const handleDelete = async (saleId) => {
    if (!window.confirm("Are you sure you want to delete this sale?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales/${saleId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();

      if (data.success) {
        setSales(sales.filter(s => s._id !== saleId));
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
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const data = await res.json();

      if (data.success) {
        setSales(sales.map(s => s._id === saleId ? data.data : s));
        setEditingSale(null);
        alert("Sale updated successfully");
      } else {
        alert(data.message || "Failed to update sale");
      }
    } catch (err) {
      alert("Error updating sale: " + err.message);
    }
  };

  if (loading) return <div className="sales-section"><p>Loading sales...</p></div>;

  if (error) return <div className="sales-section"><p style={{ color: 'red' }}>Error: {error}</p></div>;

  return (
    <div className="sales-section">
      <div className="sales-header">
        <h2>Sales Records</h2>
        <button onClick={fetchSales} className="refresh-btn">Refresh</button>
      </div>

      {sales.length === 0 ? (
        <p>No sales records found.</p>
      ) : (
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td>{sale.sale_id}</td>
                  <td>{new Date(sale.date).toLocaleDateString()}</td>
                  <td>{sale.items.length} items</td>
                  <td>₹{sale.subtotal}</td>
                  <td><strong>₹{sale.totalAmount}</strong></td>
                  <td>{sale.paymentMethod.toUpperCase()}</td>
                  <td>
                    {editingSale === sale._id ? (
                      <select
                        value={sale.status}
                        onChange={(e) => handleUpdateStatus(sale._id, e.target.value)}
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
                      onClick={() => setEditingSale(editingSale === sale._id ? null : sale._id)}
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