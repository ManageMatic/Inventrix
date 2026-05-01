import "../../../styles/StoreStats.css";
import { useEffect, useState } from "react";
import { API_URL } from "../../../config";

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
      // Fetch products
      const productsRes = await fetch(`${API_URL}/api/products/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productsData = await productsRes.json();

      let totalProducts = 0;
      let lowStockItems = [];

      if (productsData.success && Array.isArray(productsData.data)) {
        const products = productsData.data;
        totalProducts = products.length;
        lowStockItems = products
          .filter((p) => p.quantity < 5)
          .map((p) => ({
            name: p.name || "Unnamed Product",
            quantity: p.quantity || 0,
          }));
      }

      // Fetch sales for total sales amount
      const salesRes = await fetch(
        `${API_URL}/api/sales/store/${storeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const salesData = await salesRes.json();

      let totalSales = 0;
      if (salesData.success && Array.isArray(salesData.data)) {
        totalSales = salesData.data.reduce(
          (sum, sale) => sum + (sale.totalAmount || 0),
          0
        );
      }

      // Fetch employees count from employee table
      const employeesRes = await fetch(
        `${API_URL}/api/employees/count/${storeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const employeesData = await employeesRes.json();

      let employees = 0;
      if (employeesData.success && employeesData.data && typeof employeesData.data.count === 'number') {
        employees = employeesData.data.count;
      }

      setStats((prev) => ({
        ...prev,
        totalProducts,
        totalSales,
        employees,
        stockAlerts: lowStockItems.length,
        lowStockItems,
      }));
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
