import { Plus, Menu, X, Bell, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

function DashboardHeader({ onOpenModal, setSidebarOpen, sidebarOpen, user }) {
  const [date, setDate] = useState("");

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setDate(formatted);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="header-info">
          <h1 className="header-title">
            Welcome back {user?.name ? user.name.split(" ")[0] : "User"} 👋
          </h1>
          <div className="header-date">
            <Calendar size={16} />
            <span>{date}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <button className="notif-btn" title="Notifications">
          <Bell size={20} />
        </button>
        <button className="create-btn" onClick={onOpenModal}>
          <Plus size={20} />
          <span>Create Store</span>
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
