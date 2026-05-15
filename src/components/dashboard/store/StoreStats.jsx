import { Package, ShoppingCart, Users, AlertTriangle, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "../../../config";
import "../../../styles/StoreStats.css";

const StoreStats = ({ storeId }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    employees: 0,
    stockAlerts: 0,
    lowStockItems: [],
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (storeId) fetchStats();
  }, [storeId]);

  const fetchStats = async () => {
    try {
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

      const salesRes = await fetch(`${API_URL}/api/sales/store/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const salesData = await salesRes.json();

      let totalSales = 0;
      if (salesData.success && Array.isArray(salesData.data)) {
        totalSales = salesData.data.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      }

      const employeesRes = await fetch(`${API_URL}/api/employees/count/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const employeesData = await employeesRes.json();

      let employees = 0;
      if (employeesData.success && employeesData.data) {
        employees = employeesData.data.count;
      }

      setStats({
        totalProducts,
        totalSales,
        employees,
        stockAlerts: lowStockItems.length,
        lowStockItems,
      });
    } catch (err) {
      console.error("❌ Error fetching store stats:", err);
    }
  };

  return (
    <div className="store-stats">
      <div className="store-stats-grid">
        <div className="store-stat-card products">
          <div className="store-stat-icon"><Package size={24} /></div>
          <div className="store-stat-details">
            <h3>Total Products</h3>
            <p>{stats.totalProducts}</p>
          </div>
        </div>

        <div className="store-stat-card sales">
          <div className="store-stat-icon"><TrendingUp size={24} /></div>
          <div className="store-stat-details">
            <h3>Total Sales</h3>
            <p>₹{stats.totalSales.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="store-stat-card employees">
          <div className="store-stat-icon"><Users size={24} /></div>
          <div className="store-stat-details">
            <h3>Employees</h3>
            <p>{stats.employees}</p>
          </div>
        </div>

        <div className="store-stat-card alerts">
          <div className="store-stat-icon"><AlertTriangle size={24} /></div>
          <div className="store-stat-details">
            <h3>Stock Alerts</h3>
            <p className={stats.stockAlerts > 0 ? "text-danger" : ""}>{stats.stockAlerts}</p>
          </div>
        </div>
      </div>

      {stats.lowStockItems.length > 0 && (
        <div className="low-stock-section">
          <div className="section-header">
            <AlertTriangle size={20} className="warning-icon" />
            <h4>Low Stock Products</h4>
          </div>
          <div className="low-stock-list">
            {stats.lowStockItems.map((item, index) => (
              <div key={index} className="low-stock-item">
                <span className="item-name">{item.name}</span>
                <span className="item-qty">Only {item.quantity} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreStats;
