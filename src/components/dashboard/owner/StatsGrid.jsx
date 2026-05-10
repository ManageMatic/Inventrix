import { Store, Package, Users, TrendingUp } from "lucide-react";

function StatsGrid({ stores, stats }) {
  const displayStats = [
    {
      icon: <Store size={40} />,
      value: stores?.length || 0,
      label: "Total Stores",
      color: "#3b82f6",
    },
    {
      icon: <Package size={40} />,
      value: stats?.products || 0,
      label: "Products",
      color: "#10b981",
    },
    {
      icon: <Users size={40} />,
      value: stats?.employees || 0,
      label: "Employees",
      color: "#f59e0b",
    },
    {
      icon: <TrendingUp size={40} />,
      value: stats?.revenue || "₹0",
      label: "Revenue",
      color: "#ef4444",
    },
  ];

  return (
    <div className="stats-grid">
      {displayStats.map((stat, idx) => (
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
