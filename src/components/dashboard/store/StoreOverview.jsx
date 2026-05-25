import "../../../styles/StoreOverview.css";
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

      {/* 📈 Sales Chart + 🧾 Recent Sales — side by side */}
      <div className="chart-sales-row">
        <SalesChart storeId={storeId} />
        <RecentSales />
      </div>
    </div>
  );

};

export default StoreOverview;
