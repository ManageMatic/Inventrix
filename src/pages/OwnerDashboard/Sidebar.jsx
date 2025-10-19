import {
  Store,
  Package,
  Users,
  TrendingUp,
  BarChart2,
  Settings,
  LogOut,
  QrCode,
} from "lucide-react";
import logo from "../../assets/logo.png";

function Sidebar({ sidebarOpen, setSidebarOpen, user, onLogout }) {
  const menuItems = [
    { name: "Dashboard", icon: <Store size={20} /> },
    { name: "Stores", icon: <Store size={20} /> },
    { name: "Products", icon: <Package size={20} /> },
    { name: "Employees", icon: <Users size={20} /> },
    { name: "Reports", icon: <TrendingUp size={20} /> },
    { name: "Analytics", icon: <BarChart2 size={20} /> },
    { name: "Generate QR", icon: <QrCode size={20} /> },
    { name: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`sidebar ${!sidebarOpen ? "sidebar-closed" : ""}`}>
      <div className="sidebar-header">
        <div className="logo-icon">
          <img src={logo} alt="Invintrix Logo" />
        </div>
        <h2 className="logo">Invintrix</h2>
      </div>

      <nav className="nav">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`nav-link ${index === 0 ? "active" : ""}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="user-section">
        <div className="user-profile">
          <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <h4>{user.name || "Owner"}</h4>
            <p>{user.role || "Store Owner"}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
