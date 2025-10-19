import { useEffect, useState } from "react";

const StoreStats = ({ storeId }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 15000,
    employees: 120,
    stockAlerts: 0,
    lowStockItems: [], // ⬅️ will hold {name, quantity}
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (storeId) fetchStats();
  }, [storeId]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const products = data.data;
        const totalProducts = products.length;

        // filter products where quantity < 5
        const lowStockItems = products
          .filter((p) => p.quantity < 5)
          .map((p) => ({
            name: p.name || "Unnamed Product",
            quantity: p.quantity || 0,
          }));

        setStats((prev) => ({
          ...prev,
          totalProducts,
          stockAlerts: lowStockItems.length,
          lowStockItems,
        }));
      } else {
        console.warn("⚠️ Unexpected response:", data);
      }
    } catch (err) {
      console.error("❌ Error fetching store stats:", err);
    }
  };

  return (
    <div className="store-stats">
      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p>{stats.totalProducts}</p>
        </div>

        <div className="stat-card">
          <h3>Total Sales</h3>
          <p>₹{stats.totalSales}</p>
        </div>

        <div className="stat-card">
          <h3>Employees</h3>
          <p>{stats.employees}</p>
        </div>

        <div className="stat-card">
          <h3>Stock Alerts</h3>
          <p>{stats.stockAlerts}</p>
        </div>
      </div>

      {/* Low Stock Items List */}
      {stats.lowStockItems.length > 0 && (
        <div className="low-stock-section">
          <h4>⚠️ Low Stock Products</h4>
          <ul>
            {stats.lowStockItems.map((item, index) => (
              <li key={index}>
                <strong>{item.name}</strong> — only {item.quantity} left
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StoreStats;
