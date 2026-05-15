import { useState } from "react";
import { User, Mail, Phone, Shield, Lock, Save, TrendingUp, DollarSign, ShoppingBag, Clock } from "lucide-react";
import { API_URL } from "../../../config";
import Toast from "../../common/Toast";
import "../../../styles/EmployeeProfile.css";

const EmployeeProfile = ({ employee, onUpdate }) => {
    const [activeTab, setActiveTab] = useState("general");
    const [formData, setFormData] = useState({
        name: employee?.name || "",
        phone: employee?.phone || ""
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const token = localStorage.getItem("token");

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/employees/profile/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: "Profile updated successfully!", type: "success" });
                if (onUpdate) onUpdate();
            } else {
                setToast({ message: data.message, type: "error" });
            }
        } catch (err) {
            setToast({ message: "Network error", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return setToast({ message: "New passwords do not match", type: "error" });
        }
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/employees/profile/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: "Password updated successfully!", type: "success" });
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                setToast({ message: data.message, type: "error" });
            }
        } catch (err) {
            setToast({ message: "Network error", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="employee-profile-container">
            {/* Performance Stats Header */}
            <div className="emp-profile-stats-grid">
                <div className="emp-stat-card">
                    <div className="emp-stat-icon sales"><ShoppingBag size={20} /></div>
                    <div className="emp-stat-info">
                        <p>Total Sales</p>
                        <h3>{employee?.performance?.salesCount || 0}</h3>
                    </div>
                </div>
                <div className="emp-stat-card">
                    <div className="emp-stat-icon revenue"><DollarSign size={20} /></div>
                    <div className="emp-stat-info">
                        <p>Total Revenue</p>
                        <h3>₹{employee?.performance?.totalRevenue?.toLocaleString('en-IN') || 0}</h3>
                    </div>
                </div>
                <div className="emp-stat-card">
                    <div className="emp-stat-icon time"><Clock size={20} /></div>
                    <div className="emp-stat-info">
                        <p>Last Activity</p>
                        <h3>{employee?.schedule?.lastClockIn ? new Date(employee.schedule.lastClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}</h3>
                    </div>
                </div>
            </div>

            <div className="emp-profile-main-layout">
                {/* Sidebar Links */}
                <div className="emp-profile-nav-aside">
                    <button
                        className={`emp-profile-nav-btn ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <User size={18} />
                        <span>General Info</span>
                    </button>
                    <button
                        className={`emp-profile-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <Shield size={18} />
                        <span>Security</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="profile-content-card">
                    {activeTab === 'general' ? (
                        <div className="profile-section">
                            <div className="section-header">
                                <h2>General Information</h2>
                                <p>Manage your account details and contact information.</p>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="profile-form">
                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <div className="input-with-icon">
                                            <User size={18} />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Employee ID</label>
                                        <div className="input-with-icon disabled">
                                            <Lock size={18} />
                                            <input type="text" value={employee?.employee_id} disabled />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <div className="input-with-icon disabled">
                                            <Mail size={18} />
                                            <input type="email" value={employee?.email} disabled />
                                        </div>
                                        <p className="field-note">Email cannot be changed manually.</p>
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <div className="input-with-icon">
                                            <Phone size={18} />
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>Role</label>
                                        <div className="role-display-badge">
                                            {employee?.role?.name || "Staff"}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Assigned Store</label>
                                        <div className="store-display-info">
                                            {employee?.store_id?.name || "Global"}
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="save-profile-btn" disabled={loading}>
                                    <Save size={18} />
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="profile-section">
                            <div className="section-header">
                                <h2>Security & Privacy</h2>
                                <p>Update your password to keep your account secure.</p>
                            </div>

                            <form onSubmit={handlePasswordChange} className="profile-form">
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} />
                                        <input
                                            type="password"
                                            placeholder="Enter current password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <div className="input-with-icon">
                                            <Lock size={18} />
                                            <input
                                                type="password"
                                                placeholder="Min. 8 characters"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <div className="input-with-icon">
                                            <Lock size={18} />
                                            <input
                                                type="password"
                                                placeholder="Repeat new password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="save-profile-btn secondary" disabled={loading}>
                                    <Lock size={18} />
                                    {loading ? "Updating..." : "Update Password"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default EmployeeProfile;
