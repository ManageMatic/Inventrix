import { LogOut } from "lucide-react";
import logo from "../../../assets/logo.png";

function EmployeeSidebar({ sidebarOpen, setSidebarOpen, employee, onLogout, activeTab, setActiveTab, availableTabs }) {
  return (
    <aside className={`sidebar ${!sidebarOpen ? "sidebar-closed" : ""}`}>
      <div className="sidebar-header">
        <div className="logo-icon">
          <img src={logo} alt="Inventrix Logo" />
        </div>
        <h2 className="logo">Inventrix</h2>
      </div>

      <nav className="nav">
        {availableTabs.map((tab, index) => (
          <button
            key={index}
            className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab.id);
              if (window.innerWidth <= 768) {
                setSidebarOpen(false);
              }
            }}
            title={!sidebarOpen ? tab.label : ""}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="user-section">
        <div className="user-profile">
          <div className="avatar">{employee?.name?.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <h4>{employee?.name || "Employee"}</h4>
            <p>{employee?.role?.name?.replace('_', ' ') || "Staff Member"}</p>
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

export default EmployeeSidebar;
