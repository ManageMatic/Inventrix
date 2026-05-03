import { useState } from "react";
import "../../../styles/StoreHeader.css";
import { ArrowLeft } from "lucide-react";
import ConfirmDialog from "../../common/ConfirmDialog";
import EditStoreModal from "./EditStoreModal";
import Toast from "../../common/Toast";
import { API_URL } from "../../../config";

const StoreHeader = ({ store, loading, error, onBack, onUpdate }) => {
  const [showEdit, setShowEdit] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const token = localStorage.getItem("token");

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stores/${store._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: "Store deleted successfully", type: "success" });
        setTimeout(() => {
          onBack(); // go back to owner dashboard
        }, 1000);
      } else {
        setToast({ message: data.message || "Failed to delete store", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setShowConfirm(false);
    }
  };
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
        <button className="action-btn" onClick={() => setShowEdit(true)}>Edit</button>
        <button className="action-btn danger" onClick={() => setShowConfirm(true)}>Delete</button>
      </div>

      {showEdit && (
        <EditStoreModal 
          store={store} 
          onClose={() => setShowEdit(false)} 
          onUpdate={() => {
            setShowEdit(false);
            if (onUpdate) onUpdate();
          }} 
        />
      )}

      {showConfirm && (
        <ConfirmDialog
          title="Delete Store"
          message={`Are you sure you want to delete ${store?.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default StoreHeader;
