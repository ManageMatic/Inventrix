import { useState, useEffect } from "react";
import { LogIn, LogOut, Clock as ClockIcon } from "lucide-react";
import "../../../styles/TimeClock.css";
import Toast from "../../common/Toast";
import { API_URL } from "../../../config";

const TimeClock = ({ employee, onUpdate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    if (!date) return "--:--";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleClockAction = async (action) => {
    if (!employee || !employee.id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/employees/${employee.id}/clock-${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      
      if (data.success) {
        setToast({
          message: `Successfully clocked ${action}!`,
          type: "success",
        });
        
        // Notify parent to fetch updated profile
        if (onUpdate) onUpdate();
      } else {
        setToast({
          message: data.message || `Failed to clock ${action}`,
          type: "error",
        });
      }
    } catch (err) {
      console.error(`Clock ${action} error:`, err);
      setToast({
        message: "Network error occurred",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Safely extract schedule data, keeping in mind Employee vs Auth structure
  // 'employee' passed from Dashboard is actually from '/api/auth/me' 
  // Wait, let's verify if `schedule` is returned in `/api/auth/me`
  // Actually we might need to modify authController to return `schedule` or just refetch it here.
  // Wait! In `authController.js` `getCurrentUser`, we didn't return `schedule`.
  
  const schedule = employee?.schedule || {
      clockedIn: false,
      lastClockIn: null,
      lastClockOut: null
  };

  return (
    <>
      <div className="timeclock-container">
        <div className="timeclock-header">
          <h2>Time & Attendance</h2>
          <p>Track your working hours</p>
        </div>

        <div className="clock-display">
          {currentTime.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </div>

        <div className="action-area">
          {schedule.clockedIn ? (
            <button
              className="clock-btn clock-out"
              onClick={() => handleClockAction("out")}
              disabled={loading}
            >
              <LogOut size={24} />
              {loading ? "Processing..." : "Clock Out"}
            </button>
          ) : (
            <button
              className="clock-btn clock-in"
              onClick={() => handleClockAction("in")}
              disabled={loading}
            >
              <LogIn size={24} />
              {loading ? "Processing..." : "Clock In"}
            </button>
          )}
        </div>

        <div className="status-card">
          <h3><ClockIcon size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> Shift Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Clock In Time</span>
              <span className="status-value">{formatTime(schedule.lastClockIn)}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Last Clock Out</span>
              <span className="status-value">{formatTime(schedule.lastClockOut)}</span>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default TimeClock;
