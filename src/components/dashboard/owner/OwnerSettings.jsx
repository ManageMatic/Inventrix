import { useState, useEffect } from "react";
import { User, Shield, Briefcase, Lock, Loader2, Store as StoreIcon } from "lucide-react";
import StoreDetails from "../../../pages/dashboard/StoreDetails";
import Toast from "../../common/Toast";
import { API_URL } from "../../../config";
import "../../../styles/StoreDetails.css";
import "../../../styles/OwnerSettings.css";

const OwnerSettings = ({ storeId }) => {
    const [owner, setOwner] = useState(null);
    const [stats, setStats] = useState({ storeCount: 0 });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Form states
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    // Password states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    // Preferences
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const showToast = (message, type = "info") => setToast({ message, type });

    useEffect(() => {
        if (storeId === "All") {
            fetchOwnerProfile();
        }
    }, [storeId]);

    const fetchOwnerProfile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Fetch owner profile
            const authRes = await fetch(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const authData = await authRes.json();

            if (authData.success) {
                setOwner(authData.user);
                setName(authData.user.name || "");
                setPhone(authData.user.phone || "");
            }

            // Fetch store count
            const storesRes = await fetch(`${API_URL}/api/stores/getMyStores`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const storesData = await storesRes.json();

            if (storesData.success) {
                setStats({ storeCount: storesData.data.length });
            }

        } catch (error) {
            console.error("Error fetching owner profile:", error);
            showToast("Failed to load profile", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) return showToast("Name is required", "error");

        setSavingProfile(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, phone })
            });
            const data = await res.json();

            if (data.success) {
                setOwner(data.user);
                showToast("Profile updated successfully!", "success");
            } else {
                showToast(data.message || "Failed to update profile", "error");
            }
        } catch (error) {
            showToast("Network error", "error");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword) return showToast("Current password required", "error");
        if (newPassword.length < 6) return showToast("New password must be at least 6 characters", "error");
        if (newPassword !== confirmPassword) return showToast("New passwords do not match", "error");

        setSavingPassword(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/auth/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();

            if (data.success) {
                showToast("Password changed successfully!", "success");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                showToast(data.message || "Failed to change password", "error");
            }
        } catch (error) {
            showToast("Network error", "error");
        } finally {
            setSavingPassword(false);
        }
    };

    // If specific store is selected, render existing StoreDetails
    if (storeId !== "All") {
        return <StoreDetails storeId={storeId} />;
    }

    if (loading) {
        return <div className="store-details-section"><p>Loading profile...</p></div>;
    }

    if (!owner) {
        return <div className="store-details-section"><p>Profile not found</p></div>;
    }

    const hasProfileChanges = name !== owner.name || phone !== (owner.phone || "");

    return (
        <div className="store-details-section owner-settings-wrapper">
            <div className="store-details-header">
                <h2><Shield size={24} /> Global Settings</h2>
            </div>

            <div className="store-details-content">

                {/* 1. Editable Owner Profile */}
                <div className="details-group">
                    <div className="owner-settings-group-header">
                        <h3><User size={18} /> Owner Profile</h3>
                        {hasProfileChanges && (
                            <button
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                                className="owner-settings-save-btn"
                            >
                                {savingProfile ? <Loader2 size={16} className="spinner" /> : null}
                                {savingProfile ? "Saving..." : "Save Changes"}
                            </button>
                        )}
                    </div>
                    <div className="details-grid">
                        <div className="detail-item">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="owner-settings-input"
                            />
                        </div>
                        <div className="detail-item">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Not set"
                                className="owner-settings-input"
                            />
                        </div>
                        <div className="detail-item">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={owner.email}
                                disabled
                                className="owner-settings-input"
                            />
                        </div>
                        <div className="detail-item">
                            <label>Account Role</label>
                            <div className="owner-settings-role-badge">
                                {owner.userType?.replace('_', ' ') || "Owner"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Change Password Security */}
                <div className="details-group">
                    <h3><Lock size={18} /> Security & Password</h3>
                    <form onSubmit={handleChangePassword} className="details-grid owner-settings-password-form">
                        <div className="detail-item full-width">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="owner-settings-input"
                            />
                        </div>
                        <div className="detail-item full-width">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                className="owner-settings-input"
                            />
                        </div>
                        <div className="detail-item full-width">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat new password"
                                className="owner-settings-input"
                            />
                        </div>
                        <div className="detail-item full-width" style={{ marginTop: '10px' }}>
                            <button
                                type="submit"
                                disabled={savingPassword || !currentPassword || !newPassword}
                                className="owner-settings-update-pwd-btn"
                            >
                                {savingPassword ? <Loader2 size={16} className="spinner" /> : null}
                                {savingPassword ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 3. Franchise & Preferences */}
                <div className="details-group">
                    <h3><Briefcase size={18} /> Franchise & Preferences</h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <label>Total Stores Owned</label>
                            <div className="owner-settings-store-count">
                                <StoreIcon size={20} color="#38bdf8" />
                                <span>{stats.storeCount}</span>
                            </div>
                        </div>
                        <div className="detail-item">
                            <label>Global Notifications</label>
                            <div
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                className={`owner-settings-toggle ${notificationsEnabled ? 'active' : ''}`}
                            >
                                <div className="owner-settings-toggle-knob" />
                            </div>
                        </div>
                        <div className="detail-item full-width" style={{ marginTop: '10px' }}>
                            <label>Account Status</label>
                            <span className="owner-settings-status-badge">
                                Active
                            </span>
                        </div>
                    </div>
                </div>

            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default OwnerSettings;
