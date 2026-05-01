import "../../styles/ConfirmDialog.css";
import { X, Trash2 } from "lucide-react";

const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="confirm-header">
          <h3>{title || "Confirm Action"}</h3>
          <button className="close-btn" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="confirm-body">
          <Trash2 size={40} className="confirm-icon" />
          <p>{message || "Are you sure?"}</p>
        </div>

        {/* Actions */}
        <div className="confirm-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="delete-btn" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
