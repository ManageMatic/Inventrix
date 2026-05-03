import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Clock } from "lucide-react";
import Toast from "../../common/Toast";
import ConfirmDialog from "../../common/ConfirmDialog";
import "../../../styles/Employees.css";
import { API_URL } from "../../../config";

const Employees = ({ storeId }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, id: null });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
    password: ""
  });
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEmployees();
  }, [storeId]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/employees/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      showToast("Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "info") => setToast({ message, type });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `${API_URL}/api/employees/${editingId}`
        : `${API_URL}/api/employees/${storeId}`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingId ? "Employee updated" : "Employee added", "success");
        setShowModal(false);
        fetchEmployees();
      } else {
        showToast(data.message || "Operation failed", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleEdit = (employee) => {
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      status: employee.status,
      password: ""
    });
    setEditingId(employee._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast("Employee deleted", "success");
        fetchEmployees();
      } else {
        showToast("Failed to delete", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setConfirmDialog({ show: false, id: null });
    }
  };

  const handleClockInOut = async (id, isClockedIn) => {
    try {
      const action = isClockedIn ? "clock-out" : "clock-in";
      const res = await fetch(`${API_URL}/api/employees/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Clocked ${isClockedIn ? "out" : "in"} successfully`, "success");
        fetchEmployees();
      } else {
        showToast(data.message || `Failed to clock ${isClockedIn ? "out" : "in"}`, "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  return (
    <div className="employees-tab">
      <div className="employees-header">
        <h2>Staff Management</h2>
        <button
          className="add-employee-btn"
          onClick={() => {
            setFormData({ name: "", email: "", phone: "", status: "active", password: "" });
            setEditingId(null);
            setShowModal(true);
          }}
        >Add Employee
        </button>
      </div>

      <div className="employees-table-container">
        <table className="employees-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact Info</th>
              <th>Status</th>
              <th>Performance</th>
              <th>Schedule</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: "center" }}>Loading employees...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center" }}>No employees found.</td></tr>
            ) : (
              employees.map(emp => (
                <tr key={emp._id}>
                  <td>
                    <strong>{emp.name}</strong><br />
                    <small>{emp.employee_id}</small>
                  </td>
                  <td>
                    {emp.email}<br />
                    {emp.phone}
                  </td>
                  <td>
                    <span className={`status-badge status-${emp.status}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    Sales: {emp.performance?.salesCount || 0}<br />
                    Rating: {emp.performance?.rating || "N/A"}
                  </td>
                  <td>
                    {emp.schedule?.clockedIn ? (
                      <span style={{ color: "#4ade80" }}>Clocked In</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Clocked Out</span>
                    )}
                  </td>
                  <td>
                    <div className="employee-actions">
                      <button className="actions-btn clock" title={emp.schedule?.clockedIn ? "Clock Out" : "Clock In"} onClick={() => handleClockInOut(emp._id, emp.schedule?.clockedIn)}>
                        <Clock size={18} />
                      </button>
                      <button className="actions-btn edit" onClick={() => handleEdit(emp)}>
                        <Edit size={18} />
                      </button>
                      <button className="actions-btn delete" onClick={() => setConfirmDialog({ show: true, id: emp._id })}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="employee-modal-overlay">
          <div className="employee-modal">
            <h3>{editingId ? "Edit Employee" : "Add Employee"}</h3>
            <form onSubmit={handleSubmit}>
              <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
              <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} required />
              {!editingId && (
                <input type="password" name="password" placeholder="Temporary Password" value={formData.password} onChange={handleInputChange} required />
              )}
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <div className="modal-actions">
                <button type="button" className="modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="modal-btn save">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog.show && (
        <ConfirmDialog
          title="Delete Employee"
          message="Are you sure you want to remove this employee? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDialog.id)}
          onCancel={() => setConfirmDialog({ show: false, id: null })}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Employees;
