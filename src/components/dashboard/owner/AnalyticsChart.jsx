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
import TopProducts from "./TopProducts";
import HourlySalesChart from "./HourlySalesChart";
import CategoryPieChart from "./CategoryPieChart";

const defaultData = [
  { month: "Jan", sales: 4000, cost: 1600, profit: 2400 },
  { month: "Feb", sales: 3000, cost: 1602, profit: 1398 },
  { month: "Mar", sales: 5000, cost: 2200, profit: 2800 },
  { month: "Apr", sales: 4780, cost: 872,  profit: 3908 },
  { month: "May", sales: 5890, cost: 1090, profit: 4800 },
  { month: "Jun", sales: 4390, cost: 590,  profit: 3800 },
];

function AnalyticsChart({ data, advancedData }) {
  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="analytics-section">
      <div className="section-header">
        <h2>Advanced Analytics</h2>
      </div>

      <div className="charts-grid main-charts">
        {/* Bar Chart */}
        <div className="chart-box">
          <h3>Monthly Cost, Revenue & Profit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend />
              <Bar name="Revenue" dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar name="Purchased Cost" dataKey="cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar name="Net Profit" dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="chart-box">
          <h3>Growth & Profit Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend />
              <Line
                type="monotone"
                name="Revenue"
                dataKey="sales"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
              />
              <Line
                type="monotone"
                name="Purchased Cost"
                dataKey="cost"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ef4444' }}
              />
              <Line
                type="monotone"
                name="Net Profit"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {advancedData && (
        <div className="advanced-charts-grid">
          <HourlySalesChart data={advancedData.hourlySales} />
          <CategoryPieChart data={advancedData.categoryDistribution} />
          <TopProducts products={advancedData.topProducts} />
        </div>
      )}
    </div>
  );
}

export default AnalyticsChart;
