import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";
const Settings = () => {
    const [activeTab, setActiveTab] = useState("account");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Full user object including ID
    const [fullUser, setFullUser] = useState(null);

    // Account state
    const [userData, setUserData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        address: "",
        phonenumber: "",
    });

    // Security state
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // Preferences state
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    // Addresses state
    const [addresses, setAddresses] = useState([]);
    const [newAddress, setNewAddress] = useState({ label: "Home", full_address: "", is_default: false });



    useEffect(() => {
        fetchUserData();
        fetchAddresses();
        // Set initial theme
        const savedTheme = localStorage.getItem("theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    const fetchUserData = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/customers`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
            setFullUser(data);
            setUserData({
                name: data.name || "",
                email: data.email || "",
                phoneNumber: data.phoneNumber || data.phonenumber || "",
                address: data.address || ""
            });
        } catch (err) {
            console.error("Error fetching user data:", err);
            setError("Failed to load account details");
        }
    };

    const fetchAddresses = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/addresses`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setAddresses(res.data);
        } catch (err) {
            console.error("Error fetching addresses:", err);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const accessToken = localStorage.getItem("accessToken");
            await axios.post(`${BASE_URL}/addresses`, newAddress, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setNewAddress({ label: "Home", full_address: "", is_default: false });
            fetchAddresses();
            setMessage("Address added successfully!");
        } catch (err) {
            setError("Failed to add address");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAddress = async (id) => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_URL}/addresses/${id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchAddresses();
        } catch (err) {
            setError("Failed to delete address");
        }
    };

    const handleAccountUpdate = async (e) => {
        e.preventDefault();
        if (!fullUser?.customer_id) {
            setError("User identification missing. Please refresh.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");
            setError("");

            const accessToken = localStorage.getItem("accessToken");
            await axios.put(`${BASE_URL}/customers/${fullUser.customer_id}`, userData, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            setMessage("Account updated successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update account");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!fullUser?.customer_id) {
            setError("User identification missing. Please refresh.");
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            setMessage("");
            setError("");

            const accessToken = localStorage.getItem("accessToken");
            await axios.put(`${BASE_URL}/customers/${fullUser.customer_id}`, {
                password: passwords.currentPassword,
                newPassword: passwords.newPassword
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            setMessage("Password changed successfully!");
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        setMessage(`Theme changed to ${newTheme}`);
    };

    const handleDeleteAccount = async () => {
        if (!fullUser?.customer_id) return;
        if (!window.confirm("Are you SURE you want to delete your account? This action is permanent and cannot be undone.")) return;

        try {
            setLoading(true);
            const accessToken = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_URL}/customers/${fullUser.customer_id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            localStorage.removeItem("accessToken");
            window.location.href = "/";
        } catch (err) {
            setError("Failed to delete account. Please contact support.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <div className="mb-4">
                <h2 className="fw-bold text-primary mb-1">Account Settings</h2>
                <p className="text-muted">Manage your profile, security, and preferences</p>
            </div>

            <div className="row g-4">
                {/* Tabs Sidebar */}
                <div className="col-md-3">
                    <div className="list-group list-group-flush shadow-sm rounded border-0 bg-white sticky-top" style={{ top: "20px" }}>
                        <button
                            className={`list-group-item list-group-item-action py-3 border-0 ${activeTab === 'account' ? 'active bg-primary text-white' : ''}`}
                            onClick={() => setActiveTab('account')}
                        >
                            <i className="bi bi-person-gear me-3"></i> My Profile
                        </button>
                        <button
                            className={`list-group-item list-group-item-action py-3 border-0 ${activeTab === 'security' ? 'active bg-primary text-white' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <i className="bi bi-shield-lock me-3"></i> Security
                        </button>
                        <button
                            className={`list-group-item list-group-item-action py-3 border-0 ${activeTab === 'preferences' ? 'active bg-primary text-white' : ''}`}
                            onClick={() => setActiveTab('preferences')}
                        >
                            <i className="bi bi-palette me-3"></i> Preferences
                        </button>
                        <button
                            className={`list-group-item list-group-item-action py-3 border-0 ${activeTab === 'addresses' ? 'active bg-primary text-white' : ''}`}
                            onClick={() => setActiveTab('addresses')}
                        >
                            <i className="bi bi-geo-alt me-3"></i> Address Book
                        </button>
                        <button
                            className="list-group-item list-group-item-action py-3 border-0 text-danger"
                            onClick={() => setActiveTab('danger')}
                        >
                            <i className="bi bi-exclamation-triangle me-3"></i> Danger Zone
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="col-md-9">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="card-body p-4 p-md-5">
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

                            {/* Section: Account */}
                            {activeTab === "account" && (
                                <form onSubmit={handleAccountUpdate}>
                                    <h4 className="fw-bold mb-4">Profile Information</h4>
                                    <div className="row g-3">
                                        <div className="col-md-6 text-start">
                                            <label className="form-label small fw-bold text-muted">Full Name</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={userData.name}
                                                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 text-start">
                                            <label className="form-label small fw-bold text-muted">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={userData.email}
                                                disabled
                                                title="Email cannot be changed"
                                            />
                                        </div>
                                        <div className="col-md-6 text-start">
                                            <label className="form-label small fw-bold text-muted">Phone Number</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={userData.phoneNumber}
                                                onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12 text-start">
                                            <label className="form-label small fw-bold text-muted">Delivery Address</label>
                                            <textarea
                                                className="form-control form-control-lg bg-light border-0"
                                                rows="3"
                                                value={userData.address}
                                                onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="mt-5 text-end">
                                        <button type="submit" className="btn btn-primary px-5 py-2" disabled={loading}>
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Section: Security */}
                            {activeTab === "security" && (
                                <form onSubmit={handlePasswordUpdate}>
                                    <h4 className="fw-bold mb-4">Change Password</h4>
                                    <div className="row g-3">
                                        <div className="col-12 text-start">
                                            <label className="form-label small fw-bold text-muted">Current Password</label>
                                            <input
                                                type="password"
                                                className="form-control form-control-lg bg-light border-0"
                                                required
                                                value={passwords.currentPassword}
                                                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 text-start">
                                            <label className="form-label small fw-bold text-muted">New Password</label>
                                            <input
                                                type="password"
                                                className="form-control form-control-lg bg-light border-0"
                                                required
                                                value={passwords.newPassword}
                                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 text-start">
                                            <label className="form-label small fw-bold text-muted">Confirm New Password</label>
                                            <input
                                                type="password"
                                                className="form-control form-control-lg bg-light border-0"
                                                required
                                                value={passwords.confirmPassword}
                                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-5 text-end">
                                        <button type="submit" className="btn btn-primary px-5 py-2" disabled={loading}>
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Section: Preferences */}
                            {activeTab === "preferences" && (
                                <div>
                                    <h4 className="fw-bold mb-4">App Preferences</h4>
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3 small text-muted text-uppercase">Appearance</h6>
                                        <div className="row g-3">
                                            <div className="col-sm-6">
                                                <div
                                                    className={`card border-2 cursor-pointer p-3 text-center ${theme === 'light' ? 'border-primary' : 'border-light'}`}
                                                    onClick={() => handleThemeChange('light')}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <i className="bi bi-sun fs-2 mb-2 text-warning"></i>
                                                    <span className="fw-bold">Light Mode</span>
                                                </div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div
                                                    className={`card border-2 cursor-pointer p-3 text-center ${theme === 'dark' ? 'border-primary' : 'border-light'}`}
                                                    onClick={() => handleThemeChange('dark')}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <i className="bi bi-moon-stars fs-2 mb-2 text-primary"></i>
                                                    <span className="fw-bold">Dark Mode</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="alert alert-info border-0 shadow-sm mt-4">
                                        <i className="bi bi-info-circle-fill me-2"></i>
                                        Settings here are saved automatically to your device.
                                    </div>

                                    <div className="mt-5 pt-4 border-top">
                                        <h6 className="fw-bold mb-3 small text-muted text-uppercase">Referral Program</h6>
                                        <div className="card bg-primary bg-opacity-10 border-0 p-4 rounded-4">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="fw-bold text-primary mb-1 text-start">Invite Friends, Earn Coins!</h5>
                                                    <p className="text-muted small mb-0 text-start">Share your code and get 10 KU Coins for every new signup.</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="bg-white px-3 py-2 rounded shadow-sm fw-bold text-primary mb-2">
                                                        {fullUser?.referral_code || "GEN-CODE"}
                                                    </div>
                                                    <button 
                                                        className="btn btn-sm btn-primary w-100"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(fullUser?.referral_code);
                                                            setMessage("Referral code copied!");
                                                        }}
                                                    >
                                                        Copy Code
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section: Addresses */}
                            {activeTab === "addresses" && (
                                <div>
                                    <h4 className="fw-bold mb-4">Address Book</h4>

                                    {/* Add New Address Form */}
                                    <div className="card bg-light border-0 mb-4">
                                        <div className="card-body">
                                            <h6 className="fw-bold mb-3 small text-muted text-uppercase">Add New Address</h6>
                                            <form onSubmit={handleAddAddress}>
                                                <div className="row g-3">
                                                    <div className="col-md-4">
                                                        <select
                                                            className="form-select border-0 bg-white"
                                                            value={newAddress.label}
                                                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                                        >
                                                            <option value="Home">Home</option>
                                                            <option value="Office">Office</option>
                                                            <option value="Hostel">Hostel</option>
                                                            <option value="Department">Department</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input
                                                            type="text"
                                                            className="form-control border-0 bg-white"
                                                            placeholder="Full delivery address..."
                                                            required
                                                            value={newAddress.full_address}
                                                            onChange={(e) => setNewAddress({ ...newAddress, full_address: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-12 d-flex justify-content-between align-items-center">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="defaultCheck"
                                                                checked={newAddress.is_default}
                                                                onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                                                            />
                                                            <label className="form-check-label small" htmlFor="defaultCheck">
                                                                Set as default
                                                            </label>
                                                        </div>
                                                        <button type="submit" className="btn btn-primary btn-sm px-4" disabled={loading}>
                                                            {loading ? "Adding..." : "Add Address"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>

                                    {/* Address List */}
                                    <div className="row g-3">
                                        {addresses.length === 0 ? (
                                            <div className="col-12 text-center py-4 text-muted">
                                                <i className="bi bi-geo-alt display-6 d-block mb-2"></i>
                                                <p>No addresses saved yet.</p>
                                            </div>
                                        ) : (
                                            addresses.map((addr) => (
                                                <div key={addr.id} className="col-md-6">
                                                    <div className="card border h-100 position-relative shadow-sm">
                                                        <div className="card-body">
                                                            <div className="d-flex justify-content-between mb-2">
                                                                <span className={`badge ${addr.is_default ? 'bg-primary' : 'bg-secondary'}`}>
                                                                    {addr.label} {addr.is_default && "(Default)"}
                                                                </span>
                                                                <button
                                                                    className="btn btn-sm text-danger p-0"
                                                                    onClick={() => handleDeleteAddress(addr.id)}
                                                                    title="Delete Address"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                            <p className="card-text small mb-0">{addr.full_address}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Section: Danger Zone */}
                            {activeTab === "danger" && (
                                <div className="text-center py-4">
                                    <div className="mb-4">
                                        <i className="bi bi-trash-fill text-danger display-1"></i>
                                    </div>
                                    <h4 className="fw-bold text-danger mb-3">Permanent Account Deletion</h4>
                                    <p className="text-muted mb-5 mx-auto" style={{ maxWidth: "500px" }}>
                                        Processing this deletion will remove all your order history, profile data, and saved addresses. This action is irreversible.
                                    </p>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="btn btn-outline-danger btn-lg px-5"
                                        disabled={loading}
                                    >
                                        Delete My Account
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Settings;
