import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import StoreHeader from "../../components/dashboard/store/StoreHeader";
import StoreNav from "../../components/dashboard/store/StoreNav";
import StoreOverview from "../../components/dashboard/store/StoreOverview";
import ProductsTable from "../../components/dashboard/store/ProductsTable";
import SalesTable from "../../components/dashboard/store/SalesTable";
import GenerateQR from "../../components/dashboard/store/GenerateQR";
import StoreDetails from "./StoreDetails";
import Insights from "../../components/dashboard/store/Insights";
import Employees from "../../components/dashboard/store/Employees";
import "../../styles/StoreDashboard.css";
import { API_URL, SOCKET_URL } from "../../config";

// ── Create socket ONCE outside component (prevents reconnecting on re-renders) ──
const socket = io(SOCKET_URL);

const StoreDashboard = ({ cart, setCart, setCartOpen, dashboardRefresh }) => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const token = localStorage.getItem("token");

  // ── Fetch store details on mount ─────────────────────────────
  useEffect(() => {
    if (!storeId) return;
    fetchStoreDetails();

    const joinRoom = () => {
      socket.emit("join-store", storeId);
    };

    // Join room if already connected, or when it connects/reconnects
    if (socket.connected) {
      joinRoom();
    }
    socket.on("connect", joinRoom);

    const handleScan = (product) => {
      setCart((prev) => {
        const existing = prev.find((p) => p._id === product._id);

        if (existing) {
          return prev.map((p) =>
            p._id === product._id ? { ...p, qty: p.qty + 1 } : p,
          );
        }

        return [...prev, { ...product, qty: 1 }];
      });

      setCartOpen(true); // 🔥 THIS IS MAIN MAGIC
    };

    socket.on("product-scanned", handleScan);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("product-scanned", handleScan);
    };
  }, [storeId]);
  // ─────────────────────────────────────────────────────────────

  const fetchStoreDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/stores/${storeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to fetch store");
        setStore(null);
      } else {
        setStore(data.data);
      }
    } catch (err) {
      setError("Network error");
      setStore(null);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle refresh for all dashboard data ──────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger re-fetch by changing the key
    setRefreshKey((prev) => prev + 1);

    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    if (dashboardRefresh > 0) {
      handleRefresh();
    }
  }, [dashboardRefresh]);

  return (
    <div className="store-dashboard">
      <StoreHeader
        store={store}
        loading={loading}
        error={error}
        onBack={() => navigate("/OwnerDashboard")}
        onUpdate={fetchStoreDetails}
      />

      <StoreNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {activeTab === "overview" && <StoreOverview key={refreshKey} storeId={storeId} />}

      {/* ── Guard: only render when store is loaded (prevents store._id crash) ── */}
      {activeTab === "products" && store && (
        <ProductsTable storeId={store._id} refreshSignal={dashboardRefresh} />
      )}

      {activeTab === "sales" && <SalesTable cart={cart} setCart={setCart} />}

      {activeTab === "generateQR" && store && (
        <GenerateQR storeId={store._id} />
      )}

      {activeTab === "insights" && store && (
        <Insights storeId={store._id} />
      )}

      {activeTab === "employees" && store && (
        <Employees storeId={store._id} />
      )}

      {activeTab === "settings" && store && (
        <StoreDetails storeId={store._id} />
      )}
    </div>
  );
};

export default StoreDashboard;
