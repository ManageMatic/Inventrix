import { Menu, X, Bell, Calendar, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL } from "../../../config";

function EmployeeHeader({ setSidebarOpen, sidebarOpen, user, notifications = [], setNotifications }) {
  const [date, setDate] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);

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
        
        {/* Store Assignment Badge */}
        {user?.store_id && (
          <div className="employee-role-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} />
            Store Active
          </div>
        )}

        <div className="notif-wrapper">
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
                <div style={{ display: "flex", gap: "10px" }}>
                  {unreadCount > 0 && (
                    <button 
                      className="mark-all-btn"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                  <button className="close-notif-btn" onClick={() => setIsNotifOpen(false)}>
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="no-notifs">
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notif-item ${!notif.read ? 'unread' : ''}`}
                      onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                    >
                      <div className="notif-content">
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                      {!notif.read && <div className="notif-dot"></div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default EmployeeHeader;
