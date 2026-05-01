import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Package, DollarSign, ShoppingCart, AlertTriangle } from "lucide-react";
import "../../../styles/Insights.css";

const Insights = ({ storeId }) => {
  const [salesData, setSalesData] = useState([]);
  const [productMetrics, setProductMetrics] = useState({
    topProducts: [],
    lowStockItems: [],
    totalProducts: 0,
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    averageOrderValue: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7days");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (storeId) {
      fetchInsightsData();
    }
  }, [storeId, timeRange]);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);

      // Fetch sales data
      const salesRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales/store/${storeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const salesData = await salesRes.json();

      // Fetch products data
      const productsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${storeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const productsData = await productsRes.json();

      if (salesData.success && Array.isArray(salesData.data)) {
        processSalesData(salesData.data);
      }

      if (productsData.success && Array.isArray(productsData.data)) {
        processProductData(productsData.data);
      }
    } catch (error) {
      console.error("Error fetching insights data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processSalesData = (sales) => {
    if (sales.length === 0) {
      setSalesData([]);
      setStats({
        totalRevenue: 0,
        totalSales: 0,
        averageOrderValue: 0,
        conversionRate: 0,
      });
      return;
    }

    // Group sales by date
    const salesByDate = {};
    let totalRevenue = 0;

    sales.forEach((sale) => {
      const date = new Date(sale.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!salesByDate[date]) {
        salesByDate[date] = { date, sales: 0, transactions: 0 };
      }

      salesByDate[date].sales += sale.totalAmount || 0;
      salesByDate[date].transactions += 1;
      totalRevenue += sale.totalAmount || 0;
    });

    const chartData = Object.values(salesByDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);

    setSalesData(chartData);
    setStats({
      totalRevenue: Math.round(totalRevenue),
      totalSales: sales.length,
      averageOrderValue: sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0,
      conversionRate: 0, // Can be calculated if you have visitor data
    });
  };

  const processProductData = (products) => {
    if (products.length === 0) {
      setProductMetrics({
        topProducts: [],
        lowStockItems: [],
        totalProducts: 0,
      });
      return;
    }

    // Sort by sales count (if available) or quantity
    const topProducts = [...products]
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 5);

    // Get low stock items
    const lowStockItems = products
      .filter((p) => p.quantity < 5)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    setProductMetrics({
      topProducts,
      lowStockItems,
      totalProducts: products.length,
    });
  };

  if (loading) {
    return (
      <div className="insights-section">
        <p>Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="insights-section">
      <div className="insights-header">
        <h2><TrendingUp size={24} /> Insights & Analytics</h2>
        <div className="time-range-selector">
          <button
            className={`time-btn ${timeRange === "7days" ? "active" : ""}`}
            onClick={() => setTimeRange("7days")}
          >
            7 Days
          </button>
          <button
            className={`time-btn ${timeRange === "30days" ? "active" : ""}`}
            onClick={() => setTimeRange("30days")}
          >
            30 Days
          </button>
          <button
            className={`time-btn ${timeRange === "90days" ? "active" : ""}`}
            onClick={() => setTimeRange("90days")}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon revenue">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <h4>Total Revenue</h4>
            <p className="metric-value">₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orders">
            <ShoppingCart size={24} />
          </div>
          <div className="metric-content">
            <h4>Total Orders</h4>
            <p className="metric-value">{stats.totalSales}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon average">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <h4>Avg Order Value</h4>
            <p className="metric-value">₹{stats.averageOrderValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon products">
            <Package size={24} />
          </div>
          <div className="metric-content">
            <h4>Total Products</h4>
            <p className="metric-value">{productMetrics.totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        {/* Sales Trend Chart */}
        <div className="chart-section">
          <h3>Sales Trend</h3>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#38bdf8"
                  dot={{ fill: "#38bdf8", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Sales (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No sales data available</p>
          )}
        </div>

        {/* Transactions Chart */}
        <div className="chart-section">
          <h3>Daily Transactions</h3>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="transactions" fill="#10b981" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No transaction data available</p>
          )}
        </div>
      </div>

      {/* Product Performance */}
      <div className="performance-container">
        {/* Top Products */}
        <div className="performance-card">
          <h3>Top Performing Products</h3>
          {productMetrics.topProducts.length > 0 ? (
            <div className="product-list">
              {productMetrics.topProducts.map((product, index) => (
                <div key={index} className="product-item">
                  <span className="rank">#{index + 1}</span>
                  <div className="product-info">
                    <h5>{product.name}</h5>
                    {/*<p className="product-meta">SKU: {product.sku || 'N/A'}</p>*/}
                  </div>
                  <span className="product-value">₹{(product.sellingPrice || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No product data available</p>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="performance-card alert">
          <h3><AlertTriangle size={18} /> Low Stock Items</h3>
          {productMetrics.lowStockItems.length > 0 ? (
            <div className="product-list">
              {productMetrics.lowStockItems.map((product, index) => (
                <div key={index} className="product-item warning">
                  <span className="stock-badge">{product.quantity}</span>
                  <div className="product-info">
                    <h5>{product.name}</h5>
                    <p className="product-meta">Stock: {product.quantity} units</p>
                  </div>
                  <span className="warning-icon">⚠️</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">All items well stocked</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Insights;
