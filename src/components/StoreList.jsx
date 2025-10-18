import { Store } from "lucide-react";

function StoreList({ stores }) {
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
            <div key={store._id} className="store-card">
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
