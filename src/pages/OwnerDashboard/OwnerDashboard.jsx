import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import StatsGrid from "./StatsGrid";
import StoreList from "./StoreList";
import CreateStoreModal from "./CreateStoreModal";
import AnalyticsChart from "./AnalyticsChart";
import "../../styles/OwnerDashboard.css";

const OwnerDashboard = () => {
  const [user, setUser] = useState({ name: "", role: "Store Owner" });
  const [stores, setStores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOwnerData();
    fetchStores();
  }, []);

  const fetchOwnerData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUser({ name: data.user.name, role: "Store Owner" });
    } catch (err) {
      console.error("Error fetching owner info:", err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/stores/getMyStores", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStores(data.data);
    } catch (err) {
      console.error("Error fetching stores:", err);
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
      />

      {/* Main Content */}
      <main className={`main-content ${!sidebarOpen ? "main-expanded" : ""}`}>
        <DashboardHeader
          user={user}
          onOpenModal={() => setShowModal(true)}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
        />
        <StatsGrid stores={stores} />
        <AnalyticsChart />
        <StoreList stores={stores} />
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
