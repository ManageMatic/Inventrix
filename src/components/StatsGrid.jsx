import { Store, Package, Users, TrendingUp } from "lucide-react";

function StatsGrid({ stores }) {
  const stats = [
    {
      icon: <Store size={40} />,
      value: stores.length,
      label: "Total Stores",
      color: "#3b82f6",
    },
    {
      icon: <Package size={40} />,
      value: "1,234",
      label: "Products",
      color: "#10b981",
    },
    {
      icon: <Users size={40} />,
      value: "48",
      label: "Employees",
      color: "#f59e0b",
    },
    {
      icon: <TrendingUp size={40} />,
      value: "₹2.5L",
      label: "Revenue",
      color: "#ef4444",
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, idx) => (
        <div key={idx} className="stat-card">
          <div className="stat-icon" style={{ color: stat.color }}>
            {stat.icon}
          </div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsGrid;
