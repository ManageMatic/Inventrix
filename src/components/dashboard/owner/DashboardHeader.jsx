import { Plus, Menu, X, Bell, Calendar } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { API_URL } from "../../../config";

function DashboardHeader({ onOpenModal, setSidebarOpen, sidebarOpen, user, notifications = [], setNotifications, stores = [], selectedStore, setSelectedStore }) {
  const [date, setDate] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id) => {
    if (setNotifications) {
      // Optimistic UI update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/api/notifications/${id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (setNotifications) {
      // Optimistic UI update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/api/notifications/read-all`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Error marking all as read:", err);
      }
    }
  };

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
        {setSelectedStore && (
          <select 
            value={selectedStore} 
            onChange={(e) => setSelectedStore(e.target.value)}
            className="store-filter-dropdown"
          >
            <option value="All" className="store-filter-option">All Stores</option>
            {stores.map(store => (
              <option key={store._id} value={store._id} className="store-filter-option">
                {store.name}
              </option>
            ))}
          </select>
        )}

        <div className="notif-wrapper" ref={notifRef}>
          <button 
            className="notif-btn" 
            title="Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notif-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <h3>Notifications</h3>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="notif-mark-read-btn"
                    >
                      Mark all read
                    </button>
                  )}
                  <button 
                    onClick={() => setIsNotifOpen(false)}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="notif-dropdown-body">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => handleMarkAsRead(notif.id)}
                      className={`notif-item ${notif.read ? 'read' : 'unread'}`}
                    >
                      <div className="notif-content" style={{ paddingRight: "20px" }}>
                        <p className="notif-message">
                          {notif.message}
                        </p>
                        <span className="notif-time">
                          {notif.time ? new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                        </span>
                      </div>
                      {!notif.read && <div className="notif-dot"></div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="create-btn" onClick={onOpenModal}>
          <Plus size={20} />
          <span>Create Store</span>
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
