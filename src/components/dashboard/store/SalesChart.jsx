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
    <div className="chart-box sales-chart-box">
      <h3>Weekly Sales Overview</h3>
      {chartData.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
          No sales data available
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" stroke="#475569" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis stroke="#475569" tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(9, 14, 35, 0.97)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "10px",
                color: "#f8fafc",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
              labelStyle={{ color: "#60a5fa", fontWeight: 600 }}
              itemStyle={{ color: "#cbd5e1" }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: "#3b82f6", r: 4, strokeWidth: 2, stroke: "rgba(59,130,246,0.3)" }}
              activeDot={{ r: 6, fill: "#60a5fa", stroke: "rgba(59,130,246,0.4)", strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );

};

export default SalesChart;
