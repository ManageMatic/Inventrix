import { Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

function StoreList({ stores }) {
  const navigate = useNavigate();
  return (
    <div className="stores-section">
      <h2>My Stores</h2>
      {stores.length === 0 ? (
        <div className="empty-state">
          <Store size={48} />
          <p>No stores yet. Create your first store!</p>
        </div>
      ) : (
        <div className="stores-grid">
          {stores.map((store) => (
            <div
              key={store._id}
              className="store-card"
              onClick={() => navigate(`/store/${store._id}`)}
              style={{ cursor: "pointer" }}
            >
              <h3>{store.name}</h3>
              <p>📍 {store.location}</p>
              <p>📞 {store.contact?.phone}</p>
              <p>📧 {store.contact?.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StoreList;
