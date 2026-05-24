import { useState, useEffect } from "react";
import axios from "axios";
import { 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  AlertTriangle, 
  Package, 
  Sparkles,
  Inbox
} from "lucide-react";
import "../../../styles/EmployeeDashboardHome.css";
import { API_URL } from "../../../config";

function EmployeeDashboardHome({ employee }) {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todaySalesCount, setTodaySalesCount] = useState(0);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const storeId = employee?.store_id?._id || employee?.store_id;

  useEffect(() => {
    if (storeId) {
      fetchDashboardData();
    }
  }, [storeId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Sales to calculate Today's Sales
      const salesRes = await axios.get(`${API_URL}/api/sales/${storeId}?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (salesRes.data.success) {
        const todayStr = new Date().toDateString();
        // Filter sales done today by this employee
        const todaySales = salesRes.data.data.filter(sale => {
          const isToday = new Date(sale.date).toDateString() === todayStr;
          // Matches the employee's Mongo ID
          const isMe = sale.employee_id?._id === employee?.id || sale.employee_id === employee?.id;
          return isToday && isMe;
        });

        const rev = todaySales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
        setTodayRevenue(rev);
        setTodaySalesCount(todaySales.length);
      }

      // 2. Fetch Inventory to calculate Low Stock
      const productsRes = await axios.get(`${API_URL}/api/products/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (productsRes.data.success) {
        const lowStock = productsRes.data.data.filter(prod => prod.quantity <= (prod.reorderLevel || 0));
        setLowStockAlerts(lowStock);
      }

    } catch (err) {
      console.error("Error loading employee dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-home-container">
      
      {/* Welcome Banner */}
      <div className="employee-welcome">
        <h2>Workspace Overview</h2>
        <p>Operational summary for Store: <strong>{employee?.store_id?.name || "Retail Outlet"}</strong></p>
      </div>

      {/* Stats Cards */}
      <div className="supplier-stats-grid" style={{ marginBottom: "2rem" }}>
        
        <div className="supplier-stat-card">
          <div className="supplier-stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <TrendingUp size={24} />
          </div>
          <div className="supplier-stat-info">
            <h3>Today's Revenue</h3>
            <p>₹{todayRevenue}</p>
          </div>
        </div>

        <div className="supplier-stat-card">
          <div className="supplier-stat-icon" style={{ background: "rgba(129, 140, 248, 0.1)", color: "#818cf8" }}>
            <ShoppingCart size={24} />
          </div>
          <div className="supplier-stat-info">
            <h3>Today's Bills</h3>
            <p>{todaySalesCount}</p>
          </div>
        </div>

        <div className="supplier-stat-card">
          <div className="supplier-stat-icon pending" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
            <Clock size={24} />
          </div>
          <div className="supplier-stat-info">
            <h3>Active Shift</h3>
            <p>{employee?.schedule?.clockedIn ? "Clocked In" : "Clocked Out"}</p>
          </div>
        </div>

        <div className="supplier-stat-card">
          <div className="supplier-stat-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
            <AlertTriangle size={24} />
          </div>
          <div className="supplier-stat-info">
            <h3>Stock Alerts</h3>
            <p>{lowStockAlerts.length}</p>
          </div>
        </div>

      </div>

      {/* Stock Alerts Card */}
      <div className="stock-alerts-card">
        <div className="stock-alert-header">
          <AlertTriangle size={20} />
          <span>Low Stock Inventory Alerts</span>
        </div>

        {loading ? (
          <div style={{ color: "#ef4444", fontWeight: 600, padding: "1rem" }}>Loading alerts...</div>
        ) : lowStockAlerts.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: "0.9rem", padding: "1rem" }}>
            👍 All product quantities in this store are above reorder safety limits.
          </div>
        ) : (
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {lowStockAlerts.map((prod) => (
              <div className="stock-alert-item" key={prod._id}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Package size={16} style={{ color: "#ef4444" }} />
                  <span className="stock-alert-item-name">{prod.name}</span>
                </div>
                <div className="stock-alert-item-details">
                  Only {prod.quantity} remaining (Reorder Level: {prod.reorderLevel})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default EmployeeDashboardHome;
