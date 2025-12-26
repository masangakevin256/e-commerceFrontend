import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";

function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    
    // Form states
    const [newAdmin, setNewAdmin] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        role: "admin",
        password: "",
        secretReg: ""
    });

    const [editAdmin, setEditAdmin] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        role: ""
    });


    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/admins/all`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setAdmins(res.data);
            setError("");
        } catch (err) {
            setError("Failed to fetch admins");
            console.error("Error fetching admins:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            const accessToken = localStorage.getItem("accessToken");
            await axios.post(`${BASE_URL}/admins`, newAdmin, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            setShowAddModal(false);
            setNewAdmin({
                name: "",
                email: "",
                phoneNumber: "",
                role: "admin",
                password: "",
                secretReg: ""
            });
            fetchAdmins();
            
            // Show success message
            setError("");
            setTimeout(() => {
                // You can add a toast notification here
            }, 100);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to add admin");
        }
    };

    const handleEditAdmin = async (e) => {
        e.preventDefault();
        try {
            const accessToken = localStorage.getItem("accessToken");
            await axios.put(`${BASE_URL}/admins/${selectedAdmin.admin_id}`, editAdmin, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            setShowEditModal(false);
            setSelectedAdmin(null);
            fetchAdmins();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update admin");
        }
    };

    const handleDeleteAdmin = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_URL}/admins/${selectedAdmin.admin_id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            setShowDeleteModal(false);
            setSelectedAdmin(null);
            fetchAdmins();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete admin");
        }
    };

    const openEditModal = (admin) => {
        setSelectedAdmin(admin);
        setEditAdmin({
            name: admin.name,
            email: admin.email,
            phoneNumber: admin.phoneNumber || "",
            role: admin.role || "admin"
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (admin) => {
        setSelectedAdmin(admin);
        setShowDeleteModal(true);
    };

    const filteredAdmins = admins.filter(admin => {
        // Search filter
        const matchesSearch = searchTerm === "" || 
            admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.admin_id.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Role filter
        const matchesRole = roleFilter === "all" || admin.role === roleFilter;
        
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role) => {
        switch(role) {
            case "super_admin":
                return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">Super Admin</span>;
            case "admin":
                return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">Admin</span>;
            case "moderator":
                return <span className="badge bg-success bg-opacity-10 text-success border border-success">Moderator</span>;
            default:
                return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">{role}</span>;
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case "active":
                return <span className="badge bg-success bg-opacity-10 text-success border border-success">Active</span>;
            case "pending":
                return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning">Pending</span>;
            default:
                return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">Inactive</span>;
        }
    };

    const getTotalAdmins = () => admins.length;
    const getSuperAdmins = () => admins.filter(a => a.role === "super_admin").length;
    const getRegularAdmins = () => admins.filter(a => a.role === "admin").length;
    const getActiveAdmins = () => admins.filter(a => a.verify_email === "active").length;

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading admin data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="fw-bold mb-1">Admin Management</h4>
                            <p className="text-muted mb-0">Manage system administrators and permissions</p>
                        </div>
                        <button 
                            className="btn btn-primary d-flex align-items-center"
                            onClick={() => setShowAddModal(true)}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Add New Admin
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Total Admins</h6>
                                    <h3 className="fw-bold mb-0">{getTotalAdmins()}</h3>
                                </div>
                                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-shield-check text-primary fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-3">
                                <small className="text-muted">System administrators</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Super Admins</h6>
                                    <h3 className="fw-bold mb-0">{getSuperAdmins()}</h3>
                                </div>
                                <div className="bg-danger bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-shield-shaded text-danger fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-3">
                                <small className="text-muted">Full system access</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Active Admins</h6>
                                    <h3 className="fw-bold mb-0">{getActiveAdmins()}</h3>
                                </div>
                                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-person-check text-success fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-3">
                                <small className="text-muted">Verified accounts</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Regular Admins</h6>
                                    <h3 className="fw-bold mb-0">{getRegularAdmins()}</h3>
                                </div>
                                <div className="bg-info bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-people text-info fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-3">
                                <small className="text-muted">Limited access</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="row mb-4">
                <div className="col">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0">
                                            <i className="bi bi-search"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search by name, email, or ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button 
                                                className="btn btn-outline-secondary"
                                                onClick={() => setSearchTerm("")}
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <select 
                                        className="form-select"
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="super_admin">Super Admin</option>
                                        <option value="admin">Admin</option>
                                        <option value="moderator">Moderator</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <button 
                                        className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
                                        onClick={fetchAdmins}
                                    >
                                        <i className="bi bi-arrow-clockwise me-2"></i>
                                        Refresh
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                </div>
            )}

            {/* Admins Table */}
            <div className="row">
                <div className="col">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="fw-bold mb-0">Administrators List</h6>
                                <span className="badge bg-light text-dark">
                                    {filteredAdmins.length} of {admins.length} admins
                                </span>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="py-3 px-4">Admin ID</th>
                                            <th className="py-3 px-4">Name</th>
                                            <th className="py-3 px-4">Email</th>
                                            <th className="py-3 px-4">Phone</th>
                                            <th className="py-3 px-4">Role</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Created</th>
                                            <th className="py-3 px-4 text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAdmins.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-5">
                                                    <div className="text-muted">
                                                        <i className="bi bi-shield-slash display-6 mb-3"></i>
                                                        <p className="mb-0">No administrators found</p>
                                                        {searchTerm && (
                                                            <small>Try adjusting your search or filters</small>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAdmins.map((admin) => (
                                                <tr key={admin.admin_id} className="border-top">
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                                 style={{ width: "36px", height: "36px" }}>
                                                                <i className="bi bi-shield-check text-muted"></i>
                                                            </div>
                                                            <div>
                                                                <small className="text-muted d-block">ID</small>
                                                                <span className="fw-bold">{admin.admin_id}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="fw-bold">{admin.name}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <i className="bi bi-envelope me-2 text-muted"></i>
                                                            <span>{admin.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <i className="bi bi-telephone me-2 text-muted"></i>
                                                            <span>{admin.phoneNumber || "Not set"}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {getRoleBadge(admin.role)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {getStatusBadge(admin.verify_email)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <small className="text-muted">
                                                            {new Date(admin.created_at).toLocaleDateString()}
                                                        </small>
                                                    </td>
                                                    <td className="px-4 py-3 text-end">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                                                onClick={() => openEditModal(admin)}
                                                                title="Edit Admin"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline-danger d-flex align-items-center"
                                                                onClick={() => openDeleteModal(admin)}
                                                                title="Delete Admin"
                                                                disabled={admin.role === "super_admin"}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {filteredAdmins.length > 0 && (
                            <div className="card-footer bg-white border-0 py-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                        Showing {filteredAdmins.length} of {admins.length} administrators
                                    </small>
                                    <div className="text-muted small">
                                        <i className="bi bi-info-circle me-1"></i>
                                        Super admins cannot be deleted
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="modal fade show" style={{display: "block", backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Add New Administrator</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowAddModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleAddAdmin}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Full Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newAdmin.name}
                                                onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                                                required
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={newAdmin.email}
                                                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                                                required
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={newAdmin.phoneNumber}
                                                onChange={(e) => setNewAdmin({...newAdmin, phoneNumber: e.target.value})}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Role</label>
                                            <select 
                                                className="form-select"
                                                value={newAdmin.role}
                                                onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="moderator">Moderator</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={newAdmin.password}
                                                onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                                                required
                                                placeholder="Enter password"
                                                minLength="6"
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Registration Secret</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={newAdmin.secretReg}
                                                onChange={(e) => setNewAdmin({...newAdmin, secretReg: e.target.value})}
                                                required
                                                placeholder="Enter registration secret key"
                                            />
                                            <small className="text-muted">
                                                Required for adding new administrators
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={() => setShowAddModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className="bi bi-person-plus me-2"></i>
                                        Add Administrator
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Admin Modal */}
            {showEditModal && selectedAdmin && (
                <div className="modal fade show" style={{display: "block", backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Edit Administrator</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowEditModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleEditAdmin}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Full Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editAdmin.name}
                                                onChange={(e) => setEditAdmin({...editAdmin, name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={editAdmin.email}
                                                disabled
                                            />
                                            <small className="text-muted">Email cannot be changed</small>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={editAdmin.phoneNumber}
                                                onChange={(e) => setEditAdmin({...editAdmin, phoneNumber: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Role</label>
                                            <select 
                                                className="form-select"
                                                value={editAdmin.role}
                                                onChange={(e) => setEditAdmin({...editAdmin, role: e.target.value})}
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="moderator">Moderator</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className="bi bi-save me-2"></i>
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedAdmin && (
                <div className="modal fade show" style={{display: "block", backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold text-danger">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    Delete Administrator
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowDeleteModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                                        <i className="bi bi-person-x text-danger fs-1"></i>
                                    </div>
                                    <h6 className="fw-bold mb-2">Are you sure you want to delete this administrator?</h6>
                                    <p className="text-muted mb-0">
                                        This action cannot be undone. The administrator account for 
                                        <strong> {selectedAdmin.name}</strong> will be permanently removed from the system.
                                    </p>
                                    <div className="alert alert-warning mt-3">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        <strong>Warning:</strong> This action will revoke all system access for this user.
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger"
                                    onClick={handleDeleteAdmin}
                                >
                                    <i className="bi bi-trash me-2"></i>
                                    Delete Administrator
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminManagement;