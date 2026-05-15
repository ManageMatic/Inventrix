import { Store, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function StoreList({ stores }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStores = stores.filter(store => 
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    store.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="stores-section">
      <div className="section-header">
        <div className="header-left">
          <h2>My Stores</h2>
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search stores..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredStores.length === 0 ? (
        <div className="empty-state">
          <Store size={48} />
          <p>{searchQuery ? "No stores match your search." : "No stores yet. Create your first store!"}</p>
        </div>
      ) : (
        <div className="stores-grid">
          {filteredStores.map((store) => (
            <div
              key={store._id}
              className="store-card"
              onClick={() => navigate(`/store/${store._id}`)}
              style={{ cursor: "pointer" }}
            >
              <h3>{store.name}</h3>
              <p>📍 {store.location}</p>
              <div className="store-card-contact">
                <p>📞 {store.contact?.phone}</p>
                <p>📧 {store.contact?.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StoreList;
