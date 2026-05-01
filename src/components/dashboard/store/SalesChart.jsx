import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_URL } from "../../../config";

const SalesChart = ({ storeId }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (storeId) {
      fetchSalesData();
    }
  }, [storeId]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/api/sales/store/${storeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        // Group sales by date
        const salesByDate = {};

        data.data.forEach((sale) => {
          const date = new Date(sale.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          if (!salesByDate[date]) {
            salesByDate[date] = 0;
          }

          salesByDate[date] += sale.totalAmount || 0;
        });

        // Convert to array format for chart
        const chartArray = Object.entries(salesByDate).map(([date, sales]) => ({
          date,
          sales: Math.round(sales),
        }));

        // Sort by date (last 7 days)
        chartArray.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        setChartData(chartArray.slice(-7)); // Last 7 days
        setError(null);
      } else {
        setError("Failed to fetch sales data");
        setChartData([]);
      }
    } catch (err) {
      console.error("Error fetching sales chart data:", err);
      setError(err.message);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="chart-box">
        <h3>Weekly Sales Overview</h3>
        <p>Loading chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-box">
        <h3>Weekly Sales Overview</h3>
        <p style={{ color: "#ef4444" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="chart-box">
      <h3>Weekly Sales Overview</h3>
      {chartData.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
          No sales data available
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f8fafc",
              }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ fill: "#38bdf8", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SalesChart;
