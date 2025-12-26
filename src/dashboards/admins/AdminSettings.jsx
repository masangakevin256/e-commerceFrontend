import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { BASE_URL } from "../../tokens/BASE_URL";

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState("account");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Admin data state
    const [adminData, setAdminData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        role: "",
        permissions: []
    });

    // Security state
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // Preferences state
    const [preferences, setPreferences] = useState({
        theme: localStorage.getItem("theme") || "light",
        notifications: {
            newOrders: true,
            lowStock: true,
            customerReviews: false,
            systemUpdates: true,
            emailNotifications: true
        }
    });


    useEffect(() => {
        fetchAdminData();
        // Apply theme globally
        applyTheme(preferences.theme);
    }, []);

    const fetchAdminData = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/admins`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setAdminData({
                name: res.data.name || "",
                email: res.data.email || "",
                phoneNumber: res.data.phoneNumber ||  res.data.phonenumber || "",
                role: res.data.role || "Administrator",
                permissions: res.data.permissions || []
            });
        } catch (err) {
            console.error("Error fetching admin data:", err);
            setError("Failed to load admin profile");
        }
    };

    const applyTheme = (theme) => {
        // Store theme preference
        localStorage.setItem("theme", theme);
        
        // Apply to html element
        document.documentElement.setAttribute("data-bs-theme", theme);
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", theme === "dark" ? "#212529" : "#ffffff");
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage("");
            setError("");

            const accessToken = localStorage.getItem("accessToken");
            const decoded = jwtDecode(accessToken);
            const admin = decoded.userInfo;
            
            const admin_id = admin.admin_id;
            await axios.put(`${BASE_URL}/admins/${admin_id}`, adminData, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            setMessage("Profile updated successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("Passwords do not match");
            setTimeout(() => setError(""), 3000);
            return;
        }

        if (passwords.newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            setTimeout(() => setError(""), 3000);
            return;
        }

        try {
            setLoading(true);
            setMessage("");
            setError("");
            const accessToken = localStorage.getItem("accessToken");
            const decoded = jwtDecode(accessToken);
            const admin = decoded.userInfo;
            const admin_id = admin.admin_id;
        
            await axios.put(`${BASE_URL}/admins/${admin_id}`, {
                password: passwords.currentPassword,
                newPassword: passwords.newPassword
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            setMessage("Password changed successfully!");
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to change password");
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleThemeChange = (newTheme) => {
        setPreferences({ ...preferences, theme: newTheme });
        applyTheme(newTheme);
        setMessage(`Theme changed to ${newTheme}`);
        setTimeout(() => setMessage(""), 3000);
    };

    const handleNotificationToggle = (key) => {
        setPreferences({
            ...preferences,
            notifications: {
                ...preferences.notifications,
                [key]: !preferences.notifications[key]
            }
        });
        setMessage("Notification preferences updated");
        setTimeout(() => setMessage(""), 3000);
    };

    const handleLogoutAllDevices = async () => {
        if (!window.confirm("This will log you out from all devices. Continue?")) return;

        try {
            setLoading(true);
            const accessToken = localStorage.getItem("accessToken");
            await axios.post(`${BASE_URL}/admins/logout-all`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            localStorage.removeItem("accessToken");
            localStorage.removeItem("theme");
            window.location.href = "/";
        } catch (err) {
            setError("Failed to log out from all devices");
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleClearCache = () => {
        localStorage.removeItem("dashboardCache");
        setMessage("Cache cleared successfully!");
        setTimeout(() => setMessage(""), 3000);
    };

    const handleSavePreferences = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            await axios.put(`${BASE_URL}/admins/preferences`, 
                { preferences }, 
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setMessage("Preferences saved successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError("Failed to save preferences");
            setTimeout(() => setError(""), 3000);
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="mb-4">
                <h2 className="fw-bold mb-2">Admin Settings</h2>
                <p className="text-muted mb-0">Manage your account, security, and preferences</p>
            </div>

            {/* Alerts */}
            {message && (
                <div className="alert alert-success alert-dismissible fade show mb-4 border-0 shadow-sm" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {message}
                    <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
                </div>
            )}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-4 border-0 shadow-sm" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                </div>
            )}

            <div className="row g-4">
                {/* Tabs Sidebar */}
                <div className="col-lg-3 col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-bottom py-3">
                            <h6 className="fw-bold mb-0">Settings</h6>
                        </div>
                        <div className="list-group list-group-flush rounded-0">
                            <button
                                className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center ${activeTab === 'account' ? 'active bg-primary text-white' : ''}`}
                                onClick={() => setActiveTab('account')}
                            >
                                <i className="bi bi-person-circle fs-5 me-3"></i>
                                <div>
                                    <div className="fw-bold">Account</div>
                                    <small className={`${activeTab === 'account' ? 'text-white-50' : 'text-muted'}`}>
                                        Profile & Role
                                    </small>
                                </div>
                            </button>
                            <button
                                className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center ${activeTab === 'security' ? 'active bg-primary text-white' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                <i className="bi bi-shield-lock fs-5 me-3"></i>
                                <div>
                                    <div className="fw-bold">Security</div>
                                    <small className={`${activeTab === 'security' ? 'text-white-50' : 'text-muted'}`}>
                                        Password & Sessions
                                    </small>
                                </div>
                            </button>
                            <button
                                className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center ${activeTab === 'preferences' ? 'active bg-primary text-white' : ''}`}
                                onClick={() => setActiveTab('preferences')}
                            >
                                <i className="bi bi-gear fs-5 me-3"></i>
                                <div>
                                    <div className="fw-bold">Preferences</div>
                                    <small className={`${activeTab === 'preferences' ? 'text-white-50' : 'text-muted'}`}>
                                        Theme & Notifications
                                    </small>
                                </div>
                            </button>
                            <button
                                className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center ${activeTab === 'sessions' ? 'active bg-primary text-white' : ''}`}
                                onClick={() => setActiveTab('sessions')}
                            >
                                <i className="bi bi-device-ssd fs-5 me-3"></i>
                                <div>
                                    <div className="fw-bold">Devices</div>
                                    <small className={`${activeTab === 'sessions' ? 'text-white-50' : 'text-muted'}`}>
                                        Active Sessions
                                    </small>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="col-lg-9 col-md-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4 p-md-5">
                            
                            {/* Account Settings */}
                            {activeTab === "account" && (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h4 className="fw-bold mb-0">Account Information</h4>
                                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">
                                            {adminData.role}
                                        </span>
                                    </div>
                                    
                                    <form onSubmit={handleProfileUpdate}>
                                        <div className="row g-4">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-bold mb-2">Full Name</label>
                                                    <div className="input-group input-group-lg">
                                                        <span className="input-group-text bg-light border-end-0">
                                                            <i className="bi bi-person"></i>
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={adminData.name}
                                                            onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                                                            required
                                                            placeholder="Enter your full name"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-bold mb-2">Email Address</label>
                                                    <div className="input-group input-group-lg">
                                                        <span className="input-group-text bg-light border-end-0">
                                                            <i className="bi bi-envelope"></i>
                                                        </span>
                                                        <input
                                                            type="email"
                                                            className="form-control"
                                                            value={adminData.email}
                                                            disabled
                                                            title="Contact super admin to change email"
                                                        />
                                                    </div>
                                                    <small className="text-muted">Email cannot be changed</small>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-bold mb-2">Phone Number</label>
                                                    <div className="input-group input-group-lg">
                                                        <span className="input-group-text bg-light border-end-0">
                                                            <i className="bi bi-telephone"></i>
                                                        </span>
                                                        <input
                                                            type="tel"
                                                            className="form-control"
                                                            value={adminData.phoneNumber}
                                                            onChange={(e) => setAdminData({ ...adminData, phoneNumber: e.target.value })}
                                                            placeholder="Enter phone number"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-bold mb-2">Role</label>
                                                    <div className="input-group input-group-lg">
                                                        <span className="input-group-text bg-light border-end-0">
                                                            <i className="bi bi-person-badge"></i>
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={adminData.role}
                                                            disabled
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="mb-4">
                                                    <label className="form-label fw-bold mb-2">Permissions</label>
                                                    <div className="p-3 bg-light rounded">
                                                        <div className="row g-2">
                                                            {adminData.permissions.length > 0 ? (
                                                                adminData.permissions.map((permission, index) => (
                                                                    <div key={index} className="col-auto">
                                                                        <span className="badge bg-success bg-opacity-10 text-success border border-success p-2">
                                                                            <i className="bi bi-check-circle me-1"></i>
                                                                            {permission}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-muted">
                                                                    <i className="bi bi-info-circle me-2"></i>
                                                                    No specific permissions assigned
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                                            <button type="button" className="btn btn-outline-secondary">
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    "Save Changes"
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Security Settings */}
                            {activeTab === "security" && (
                                <div>
                                    <h4 className="fw-bold mb-4">Security Settings</h4>
                                    
                                    <div className="row g-4">
                                        <div className="col-12">
                                            <div className="card border-0 bg-light mb-4">
                                                <div className="card-body">
                                                    <h6 className="fw-bold mb-3">Change Password</h6>
                                                    <form onSubmit={handlePasswordUpdate}>
                                                        <div className="row g-3">
                                                            <div className="col-12">
                                                                <label className="form-label fw-bold">Current Password</label>
                                                                <div className="input-group">
                                                                    <span className="input-group-text bg-white border-end-0">
                                                                        <i className="bi bi-key"></i>
                                                                    </span>
                                                                    <input
                                                                        type="password"
                                                                        className="form-control"
                                                                        required
                                                                        value={passwords.currentPassword}
                                                                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                                                        placeholder="Enter current password"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <label className="form-label fw-bold">New Password</label>
                                                                <div className="input-group">
                                                                    <span className="input-group-text bg-white border-end-0">
                                                                        <i className="bi bi-key-fill"></i>
                                                                    </span>
                                                                    <input
                                                                        type="password"
                                                                        className="form-control"
                                                                        required
                                                                        value={passwords.newPassword}
                                                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                                                        placeholder="Enter new password"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <label className="form-label fw-bold">Confirm Password</label>
                                                                <div className="input-group">
                                                                    <span className="input-group-text bg-white border-end-0">
                                                                        <i className="bi bi-key-fill"></i>
                                                                    </span>
                                                                    <input
                                                                        type="password"
                                                                        className="form-control"
                                                                        required
                                                                        value={passwords.confirmPassword}
                                                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                                                        placeholder="Confirm new password"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                                                            <button type="button" className="btn btn-outline-secondary" 
                                                                    onClick={() => setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" })}>
                                                                Clear
                                                            </button>
                                                            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                                                Update Password
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preferences */}
                            {activeTab === "preferences" && (
                                <div>
                                    <h4 className="fw-bold mb-4">Preferences</h4>
                                    
                                    {/* Theme Selection */}
                                    <div className="mb-5">
                                        <h6 className="fw-bold mb-3">Theme Settings</h6>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div
                                                    className={`card h-100 cursor-pointer p-4 text-center ${preferences.theme === 'light' ? 'border-primary border-2' : 'border'}`}
                                                    onClick={() => handleThemeChange('light')}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <div className="bg-light rounded-3 p-3 mb-3">
                                                        <i className="bi bi-sun fs-1 text-warning"></i>
                                                    </div>
                                                    <h6 className="fw-bold mb-2">Light Mode</h6>
                                                    <p className="text-muted small mb-0">Clean and bright interface</p>
                                                    {preferences.theme === 'light' && (
                                                        <div className="mt-3">
                                                            <span className="badge bg-primary">Active</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div
                                                    className={`card h-100 cursor-pointer p-4 text-center ${preferences.theme === 'dark' ? 'border-primary border-2' : 'border'}`}
                                                    onClick={() => handleThemeChange('dark')}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <div className="bg-dark rounded-3 p-3 mb-3">
                                                        <i className="bi bi-moon-stars fs-1 text-light"></i>
                                                    </div>
                                                    <h6 className="fw-bold mb-2">Dark Mode</h6>
                                                    <p className="text-muted small mb-0">Easy on the eyes</p>
                                                    {preferences.theme === 'dark' && (
                                                        <div className="mt-3">
                                                            <span className="badge bg-primary">Active</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notifications */}
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3">Notification Preferences</h6>
                                        <div className="card border-0 bg-light">
                                            <div className="card-body">
                                                <div className="form-check form-switch mb-4">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={preferences.notifications.emailNotifications}
                                                        onChange={() => handleNotificationToggle('emailNotifications')}
                                                        id="emailNotifications"
                                                    />
                                                    <label className="form-check-label fw-bold d-block" htmlFor="emailNotifications">
                                                        Email Notifications
                                                    </label>
                                                    <small className="text-muted">Receive important updates via email</small>
                                                </div>
                                                
                                                <h6 className="fw-bold mb-3 small text-muted text-uppercase">Dashboard Notifications</h6>
                                                
                                                <div className="form-check form-switch mb-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={preferences.notifications.newOrders}
                                                        onChange={() => handleNotificationToggle('newOrders')}
                                                        id="newOrders"
                                                    />
                                                    <label className="form-check-label" htmlFor="newOrders">
                                                        New Orders
                                                    </label>
                                                </div>
                                                <div className="form-check form-switch mb-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={preferences.notifications.lowStock}
                                                        onChange={() => handleNotificationToggle('lowStock')}
                                                        id="lowStock"
                                                    />
                                                    <label className="form-check-label" htmlFor="lowStock">
                                                        Low Stock Alerts
                                                    </label>
                                                </div>
                                                <div className="form-check form-switch mb-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={preferences.notifications.customerReviews}
                                                        onChange={() => handleNotificationToggle('customerReviews')}
                                                        id="customerReviews"
                                                    />
                                                    <label className="form-check-label" htmlFor="customerReviews">
                                                        Customer Reviews
                                                    </label>
                                                </div>
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={preferences.notifications.systemUpdates}
                                                        onChange={() => handleNotificationToggle('systemUpdates')}
                                                        id="systemUpdates"
                                                    />
                                                    <label className="form-check-label" htmlFor="systemUpdates">
                                                        System Updates
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end gap-3 mt-4">
                                        <button className="btn btn-outline-secondary" onClick={handleClearCache}>
                                            <i className="bi bi-trash me-2"></i>
                                            Clear Cache
                                        </button>
                                        <button className="btn btn-primary" onClick={handleSavePreferences}>
                                            <i className="bi bi-save me-2"></i>
                                            Save Preferences
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Sessions */}
                            {activeTab === "sessions" && (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div>
                                            <h4 className="fw-bold mb-1">Active Sessions</h4>
                                            <p className="text-muted mb-0">Manage your logged-in devices</p>
                                        </div>
                                        <button
                                            onClick={handleLogoutAllDevices}
                                            className="btn btn-outline-danger"
                                            disabled={loading}
                                        >
                                            <i className="bi bi-power me-2"></i>
                                            Logout All Devices
                                        </button>
                                    </div>
                                    
                                    <div className="card border-0 bg-light">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center p-4 border-bottom">
                                                <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i className="bi bi-laptop text-primary fs-4"></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold mb-1">Current Device</div>
                                                    <div className="text-muted small mb-1">
                                                        {navigator.userAgent.includes('Mac') ? 'Mac' : 
                                                         navigator.userAgent.includes('Windows') ? 'Windows' : 
                                                         navigator.userAgent.includes('Linux') ? 'Linux' : 'Unknown OS'}
                                                         • 
                                                        {navigator.userAgent.includes('Chrome') ? ' Chrome' : 
                                                         navigator.userAgent.includes('Firefox') ? ' Firefox' : 
                                                         navigator.userAgent.includes('Safari') ? ' Safari' : ' Unknown Browser'}
                                                    </div>
                                                    <div className="text-muted small">
                                                        IP: 127.0.0.1 • Location: Localhost
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="badge bg-success mb-2">Active Now</div>
                                                    <div className="text-muted small">Current Session</div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-center py-5">
                                                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                                                    <i className="bi bi-shield-check text-primary fs-2"></i>
                                                </div>
                                                <h6 className="fw-bold mb-2">Account Security</h6>
                                                <p className="text-muted mb-4 mx-auto" style={{ maxWidth: "500px" }}>
                                                    You're currently logged in on this device. Logging out all other devices will 
                                                    invalidate all active sessions except this one.
                                                </p>
                                                <div className="alert alert-warning border-0 mx-auto" style={{ maxWidth: "500px" }}>
                                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                                    <strong>Warning:</strong> Logging out all devices will require you to log in again on other devices.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;