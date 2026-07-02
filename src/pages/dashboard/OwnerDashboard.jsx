import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
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
import SupplierManagement from "../../components/dashboard/owner/SupplierManagement";
import "../../styles/BaseDashboard.css";
import "../../styles/OwnerDashboard.css";
import { API_URL, SOCKET_URL } from "../../config";
import { io } from "socket.io-client";

// Create socket outside component so it is never re-created on re-renders
const socket = io(SOCKET_URL);

const OwnerDashboard = () => {
  const [user, setUser] = useState({ name: "", role: "Store Owner" });
  const [stores, setStores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [activeTab, setActiveTab] = useState(localStorage.getItem("ownerActiveTab") || "Dashboard");

  useEffect(() => {
    localStorage.setItem("ownerActiveTab", activeTab);
  }, [activeTab]);
  const [selectedStore, setSelectedStore] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [stats, setStats] = useState({ products: 0, sales: 0, employees: 0, revenue: "₹0", cost: "₹0", profit: "₹0" });
  const [chartData, setChartData] = useState([]);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);

  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userType && userType !== "store_owner") {
    if (userType === "employee") return <Navigate to="/EmployeeDashboard" replace />;
    if (userType === "supplier") return <Navigate to="/SupplierDashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchOwnerData();
    fetchStores();
    fetchNotifications();
  }, [refreshKey]);

  // Fetch analytics whenever selectedStore or stores list changes
  useEffect(() => {
    fetchAnalytics(selectedStore);
    fetchAdvancedAnalytics(selectedStore);
  }, [selectedStore, stores]);

  const fetchAdvancedAnalytics = async (storeId) => {
    try {
      const res = await fetch(`${API_URL}/api/sales/analytics/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAdvancedAnalytics(data.data);
    } catch (err) {
      console.error("Error fetching advanced analytics:", err);
    }
  };

  // Join personal user room as soon as user._id is known
  useEffect(() => {
    if (user?._id) {
      socket.emit("join-user", user._id);
    }
  }, [user?._id]);

  // Register store and notification socket listeners once on mount
  useEffect(() => {
    const handleStoreCreated = (newStore) => setStores((prev) => [...prev, newStore]);
    const handleStoreUpdated = (updatedStore) => setStores((prev) => prev.map(s => s._id === updatedStore._id ? updatedStore : s));
    const handleStoreDeleted = (deletedStoreId) => setStores((prev) => prev.filter(s => s._id !== deletedStoreId));
    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setRefreshKey((prev) => prev + 1);
    };

    socket.on("storeCreated", handleStoreCreated);
    socket.on("storeUpdated", handleStoreUpdated);
    socket.on("storeDeleted", handleStoreDeleted);
    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("storeCreated", handleStoreCreated);
      socket.off("storeUpdated", handleStoreUpdated);
      socket.off("storeDeleted", handleStoreDeleted);
      socket.off("newNotification", handleNewNotification);
    };
  }, []);

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
    localStorage.removeItem("userType");
    localStorage.removeItem("ownerActiveTab");
    localStorage.removeItem("storeActiveTab");
    navigate("/login");
  };

  return (
    <div className="dashboard-container owner-theme">
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
            <AnalyticsChart data={chartData} advancedData={advancedAnalytics} />
            <StoreList stores={selectedStore === "All" ? stores : stores.filter(s => s._id === selectedStore)} />
          </>
        )}

        {activeTab === "Stores" && (
          <StoreList stores={selectedStore === "All" ? stores : stores.filter(s => s._id === selectedStore)} />
        )}

        {activeTab === "Products" && (
          <ProductsTable storeId={selectedStore} refreshSignal={refreshKey} key={refreshKey} />
        )}

        {activeTab === "Employees" && (
          <Employees storeId={selectedStore} key={refreshKey} />
        )}

        {activeTab === "Suppliers" && (
          <SupplierManagement storeId={selectedStore} key={refreshKey} />
        )}

        {activeTab === "Reports" && (
          <Reports storeId={selectedStore} key={refreshKey} />
        )}

        {activeTab === "Generate QR" && (
          <GenerateQR storeId={selectedStore} key={refreshKey} />
        )}

        {activeTab === "Settings" && (
          <OwnerSettings storeId={selectedStore} />
        )}

        {activeTab === "Analytics" && (
          <div className="analytics-container">
            <AnalyticsChart data={chartData} advancedData={advancedAnalytics} />
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
