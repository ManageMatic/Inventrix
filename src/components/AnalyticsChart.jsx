import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", sales: 4000, profit: 2400 },
  { month: "Feb", sales: 3000, profit: 1398 },
  { month: "Mar", sales: 5000, profit: 2800 },
  { month: "Apr", sales: 4780, profit: 3908 },
  { month: "May", sales: 5890, profit: 4800 },
  { month: "Jun", sales: 4390, profit: 3800 },
];

function AnalyticsChart() {
  return (
    <div className="analytics-section">
      <h2>Business Overview</h2>
      <div className="charts-grid">
        {/* Bar Chart */}
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" />
              <Bar dataKey="profit" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsChart;
