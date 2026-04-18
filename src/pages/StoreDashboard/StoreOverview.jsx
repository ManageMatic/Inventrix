import StoreStats from "./StoreStats";
import RecentSales from "./RecentSales";
import SalesChart from "./SalesChart";

const StoreOverview = ({ storeId }) => {
  if (!storeId) {
    return (
      <div className="store-overview">
        <p>Loading store overview...</p>
      </div>
    );
  }

  return (
    <div className="store-overview">
      {/* 📊 Store Stats Section */}
      <StoreStats storeId={storeId} />

      {/* 📈 Sales Chart */}
      <SalesChart storeId={storeId} />

      {/* 🧾 Recent Sales */}
      <RecentSales />
    </div>
  );
};

export default StoreOverview;
