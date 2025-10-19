import { ArrowLeft } from "lucide-react";

const StoreHeader = ({ store, loading, error, onBack }) => {
  let content;

  if (loading) {
    content = <h1>Loading store...</h1>;
  } else if (error) {
    content = <h1>{error}</h1>;
  } else if (store) {
    content = (
      <>
        <h1>{store.name}</h1>
        <p>{store.location || "No location set"}</p>
      </>
    );
  } else {
    content = <h1>Store not found</h1>;
  }

  return (
    <div className="store-header">
      <div className="header-left">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={22} />
        </button>
        <div className="store-info">{content}</div>
      </div>
      <div className="store-actions">
        <button className="action-btn">Edit</button>
        <button className="action-btn danger">Delete</button>
      </div>
    </div>
  );
};

export default StoreHeader;
