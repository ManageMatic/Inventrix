import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StoreHeader from "./StoreHeader";
import StoreNav from "./StoreNav";
import StoreOverview from "./StoreOverview";
import ProductsTable from "./ProductsTable";
import ComingSoon from "./ComingSoon";
import "../../styles/StoreDashboard.css";

const StoreDashboard = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!storeId) return;
    fetchStoreDetails();
  }, [storeId]);

  const fetchStoreDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      {activeTab === "products" && <ProductsTable storeId={store._id} />}
    </div>
  );
};

export default StoreDashboard;
