import { Store, Package, Users, TrendingUp, IndianRupee, ShoppingBag } from "lucide-react";

function StatsGrid({ stores, stats }) {
  const displayStats = [
    {
      icon: <Store size={32} />,
      value: stores?.length || 0,
      label: "Total Stores",
      color: "#3b82f6",
    },
    {
      icon: <Package size={32} />,
      value: stats?.products || 0,
      label: "Products",
      color: "#f59e0b",
    },
    {
      icon: <Users size={32} />,
      value: stats?.employees || 0,
      label: "Employees",
      color: "#0ea5e9",
    },
    {
      icon: <ShoppingBag size={32} />,
      value: stats?.sales || 0,
      label: "Total Sales",
      color: "#a78bfa",
    },
    {
      icon: <IndianRupee size={32} />,
      value: stats?.revenue || "₹0",
      label: "Revenue",
      color: "#10b981",
    },
    {
      icon: <TrendingUp size={32} />,
      value: stats?.profit || "₹0",
      label: "Net Profit",
      color: "#c084fc",
    },
  ];

  return (
    <div className="owner-stats-grid">
      {displayStats.map((stat, idx) => (
        <div key={idx} className="owner-stat-card">
          <div className="owner-stat-icon" style={{ color: stat.color }}>
            {stat.icon}
          </div>
          <div className="owner-stat-value">{stat.value}</div>
          <div className="owner-stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsGrid;
