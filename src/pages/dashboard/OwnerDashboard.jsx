import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/dashboard/owner/Sidebar";
import DashboardHeader from "../../components/dashboard/owner/DashboardHeader";
import StatsGrid from "../../components/dashboard/owner/StatsGrid";
import StoreList from "../../components/dashboard/owner/StoreList";
import CreateStoreModal from "../../components/dashboard/owner/CreateStoreModal";
import AnalyticsChart from "../../components/dashboard/owner/AnalyticsChart";
import ProductsTable from "../../components/dashboard/store/ProductsTable";
import Employees from "../../components/dashboard/store/Employees";
import Reports from "../../components/dashboard/store/Reports";
import GenerateQR from "../../components/dashboard/store/GenerateQR";
import OwnerSettings from "../../components/dashboard/owner/OwnerSettings";
import "../../styles/OwnerDashboard.css";
import { API_URL } from "../../config";
import { io } from "socket.io-client";

const OwnerDashboard = () => {
  const [user, setUser] = useState({ name: "", role: "Store Owner" });
  const [stores, setStores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedStore, setSelectedStore] = useState("All");
  const [notifications, setNotifications] = useState([]);
  
  const [stats, setStats] = useState({ products: 0, employees: 0, revenue: "₹0" });
  const [chartData, setChartData] = useState([]);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOwnerData();
    fetchStores();
    fetchNotifications();
  }, []);

  // Fetch analytics whenever selectedStore changes
  useEffect(() => {
    fetchAnalytics(selectedStore);
  }, [selectedStore]);

  useEffect(() => {
    // Connect WebSocket
    const socket = io(API_URL);

    if (user?._id) {
      socket.emit("join-user", user._id);
    }

    // Listen for events
    socket.on("storeCreated", (newStore) => {
      setStores((prev) => [...prev, newStore]);
    });
    
    socket.on("storeUpdated", (updatedStore) => {
      setStores((prev) => prev.map(s => s._id === updatedStore._id ? updatedStore : s));
    });

    socket.on("storeDeleted", (deletedStoreId) => {
      setStores((prev) => prev.filter(s => s._id !== deletedStoreId));
    });

    socket.on("newNotification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  const fetchOwnerData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUser({ name: data.user.name, role: "Store Owner", _id: data.user._id });
    } catch (err) {
      console.error("Error fetching owner info:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stores/getMyStores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStores(data.data);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  const fetchAnalytics = async (storeId) => {
    try {
      const url = storeId === "All" 
        ? `${API_URL}/api/stores/analytics` 
        : `${API_URL}/api/stores/analytics?storeId=${storeId}`;
        
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setChartData(data.chartData);
        }
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <main className={`main-content ${!sidebarOpen ? "main-expanded" : ""}`}>
        <DashboardHeader
          user={user}
          onOpenModal={() => setShowModal(true)}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
          notifications={notifications}
          setNotifications={setNotifications}
          stores={stores}
          selectedStore={selectedStore}
          setSelectedStore={setSelectedStore}
        />
        
        {activeTab === "Dashboard" && (
          <>
            <StatsGrid stores={selectedStore === "All" ? stores : stores.filter(s => s._id === selectedStore)} stats={stats} />
            <AnalyticsChart data={chartData} />
            <StoreList stores={selectedStore === "All" ? stores : stores.filter(s => s._id === selectedStore)} />
          </>
        )}

        {activeTab === "Stores" && (
          <StoreList stores={selectedStore === "All" ? stores : stores.filter(s => s._id === selectedStore)} />
        )}

        {activeTab === "Products" && (
          <ProductsTable storeId={selectedStore} />
        )}

        {activeTab === "Employees" && (
          <Employees storeId={selectedStore} />
        )}

        {activeTab === "Reports" && (
          <Reports storeId={selectedStore} />
        )}

        {activeTab === "Generate QR" && (
          <GenerateQR storeId={selectedStore} />
        )}

        {activeTab === "Settings" && (
          <OwnerSettings storeId={selectedStore} />
        )}
        
        {activeTab === "Analytics" && (
          <div className="analytics-container">
            <AnalyticsChart data={chartData} />
          </div>
        )}
      </main>

      {/* Create Store Modal */}
      {showModal && (
        <CreateStoreModal
          onClose={() => setShowModal(false)}
          setStores={setStores}
          stores={stores}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
