import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { date: "Mon", sales: 1200 },
  { date: "Tue", sales: 1800 },
  { date: "Wed", sales: 900 },
  { date: "Thu", sales: 1600 },
  { date: "Fri", sales: 2200 },
  { date: "Sat", sales: 1950 },
  { date: "Sun", sales: 2500 },
];

const SalesChart = () => {
  return (
    <div className="chart-box">
      <h3>Weekly Sales Overview</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#38bdf8"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
