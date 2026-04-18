import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import StoreHeader from "./StoreHeader";
import StoreNav from "./StoreNav";
import StoreOverview from "./StoreOverview";
import ProductsTable from "./ProductsTable";
import SalesTable from "./SalesTable";
import GenerateQR from "./GenerateQR";
import "../../styles/StoreDashboard.css";

// ── Create socket ONCE outside component (prevents reconnecting on re-renders) ──
const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");

const StoreDashboard = ({ cart, setCart, setCartOpen }) => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  // ── Fetch store details on mount ─────────────────────────────
  useEffect(() => {
    if (!storeId) return;
    fetchStoreDetails();

    // Join store room
    socket.emit("join-store", storeId);

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
      socket.off("product-scanned", handleScan);
    };
  }, [storeId]);
  // ─────────────────────────────────────────────────────────────

  const fetchStoreDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stores/${storeId}`,
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

  return (
    <div className="store-dashboard">
      <StoreHeader
        store={store}
        loading={loading}
        error={error}
        onBack={() => navigate("/OwnerDashboard")}
      />

      <StoreNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "overview" && <StoreOverview storeId={storeId} />}

      {/* ── Guard: only render when store is loaded (prevents store._id crash) ── */}
      {activeTab === "products" && store && (
        <ProductsTable storeId={store._id} />
      )}

      {activeTab === "sales" && <SalesTable cart={cart} setCart={setCart} />}

      {activeTab === "generateQR" && store && (
        <GenerateQR storeId={store._id} />
      )}
    </div>
  );
};

export default StoreDashboard;
