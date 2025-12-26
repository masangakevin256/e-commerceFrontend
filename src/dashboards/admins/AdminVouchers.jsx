import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";

function AdminVouchers() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [voucherToDelete, setVoucherToDelete] = useState(null);
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        min_spend: "",
        expiry_date: "",
        usage_limit: "",
        description: "",
        status: "active"
    });

    

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/vouchers`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setVouchers(res.data);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load vouchers");
        } finally {
            setLoading(false);
        }
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, code: code });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const accessToken = localStorage.getItem("accessToken");
            
            if (editingVoucher) {
                // Update voucher
                await axios.put(`${BASE_URL}/vouchers/${editingVoucher.id}`, formData, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setMessage(`Voucher "${formData.code}" updated successfully!`);
            } else {
                // Create new voucher
                await axios.post(`${BASE_URL}/vouchers`, formData, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setMessage(`Voucher "${formData.code}" created successfully!`);
            }
            
            setShowCreateModal(false);
            resetForm();
            fetchVouchers();
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Operation failed. Please try again.");
        }
    };

    const resetForm = () => {
        setEditingVoucher(null);
        setFormData({
            code: "",
            discount_type: "percentage",
            discount_value: "",
            min_spend: "",
            expiry_date: "",
            usage_limit: "",
            description: "",
            status: "active"
        });
    };

    const handleEdit = (voucher) => {
        setEditingVoucher(voucher);
        setFormData({
            code: voucher.code,
            discount_type: voucher.discount_type,
            discount_value: voucher.discount_value,
            min_spend: voucher.min_spend || "",
            expiry_date: voucher.expiry_date.split('T')[0],
            usage_limit: voucher.usage_limit || "",
            description: voucher.description || "",
            status: voucher.status
        });
        setShowCreateModal(true);
    };

    const confirmDelete = (voucher) => {
        setVoucherToDelete(voucher);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!voucherToDelete) return;
        
        try {
            const accessToken = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_URL}/vouchers/${voucherToDelete.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setMessage(`Voucher "${voucherToDelete.code}" deleted successfully!`);
            setShowDeleteModal(false);
            setVoucherToDelete(null);
            fetchVouchers();
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError("Failed to delete voucher");
            setShowDeleteModal(false);
        }
    };

    const toggleStatus = async (voucher) => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const newStatus = voucher.status === 'active' ? 'inactive' : 'active';
            await axios.patch(`${BASE_URL}/vouchers/${voucher.id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setMessage(`Voucher ${voucher.code} ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
            fetchVouchers();
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError("Failed to update voucher status");
        }
    };

    const filteredVouchers = vouchers.filter(voucher => {
        const matchesSearch = voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (voucher.description && voucher.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "all" || voucher.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const config = {
            active: { color: 'success', icon: 'check-circle' },
            inactive: { color: 'secondary', icon: 'x-circle' },
            expired: { color: 'danger', icon: 'clock' }
        };
        const cfg = config[status] || { color: 'secondary', icon: 'question-circle' };
        return (
            <span className={`badge bg-${cfg.color} bg-opacity-10 text-${cfg.color}`}>
                <i className={`bi bi-${cfg.icon} me-1`}></i>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const isExpired = (expiryDate) => {
        return new Date(expiryDate) < new Date();
    };

    const getExpiryStatus = (voucher) => {
        const expiryDate = new Date(voucher.expiry_date);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { text: 'Expired', color: 'danger' };
        if (diffDays <= 7) return { text: `Expires in ${diffDays} days`, color: 'warning' };
        return { text: expiryDate.toLocaleDateString('en-KE'), color: 'success' };
    };

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="fw-bold text-primary mb-2">
                                <i className="bi bi-ticket-perforated me-2"></i>
                                Voucher Management
                            </h2>
                            <p className="text-muted mb-0">
                                Create and manage discount vouchers for your customers
                            </p>
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 me-3">
                                <i className="bi bi-tags me-1"></i>
                                {vouchers.length} Total Vouchers
                            </span>
                            <button 
                                className="btn btn-primary d-flex align-items-center"
                                onClick={() => { resetForm(); setShowCreateModal(true); }}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                Create Voucher
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {message && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
                            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                            <div className="flex-grow-1">{message}</div>
                            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                            <div className="flex-grow-1">{error}</div>
                            <button type="button" className="btn-close" onClick={() => setError("")}></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-3">
                            <div className="row g-3 align-items-center">
                                <div className="col-lg-5 col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0">
                                            <i className="bi bi-search"></i>
                                        </span>
                                        <input 
                                            type="text" 
                                            className="form-control border-start-0"
                                            placeholder="Search vouchers by code or description..."
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
                                
                                <div className="col-lg-3 col-md-6">
                                    <select 
                                        className="form-select"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>
                                
                                <div className="col-lg-4 col-md-12">
                                    <div className="text-muted small">
                                        Showing <strong>{filteredVouchers.length}</strong> of <strong>{vouchers.length}</strong> vouchers
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vouchers Grid */}
            <div className="row">
                {loading ? (
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-3 text-muted">Loading vouchers...</p>
                            </div>
                        </div>
                    </div>
                ) : filteredVouchers.length === 0 ? (
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5">
                                <i className="bi bi-ticket-perforated display-1 text-muted mb-4"></i>
                                <h5 className="fw-bold text-primary mb-3">No vouchers found</h5>
                                <p className="text-muted">
                                    {searchTerm || statusFilter !== "all" 
                                        ? "Try adjusting your search or filter criteria."
                                        : "No vouchers available. Start by creating your first voucher!"}
                                </p>
                                <button 
                                    className="btn btn-primary mt-3"
                                    onClick={() => { resetForm(); setShowCreateModal(true); }}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Create First Voucher
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    filteredVouchers.map(voucher => (
                        <div key={voucher.id} className="col-xl-4 col-lg-6 col-md-6 mb-4">
                            <div className={`card border-0 shadow-sm h-100 ${isExpired(voucher.expiry_date) ? 'border-danger' : ''}`}>
                                <div className="card-body p-4">
                                    {/* Header */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h5 className="fw-bold text-primary mb-1">{voucher.code}</h5>
                                            <div className="d-flex align-items-center gap-2">
                                                {getStatusBadge(voucher.status)}
                                                {isExpired(voucher.expiry_date) && (
                                                    <span className="badge bg-danger bg-opacity-10 text-danger">
                                                        <i className="bi bi-clock me-1"></i>
                                                        Expired
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="dropdown">
                                            <button className="btn btn-sm btn-light border" type="button" data-bs-toggle="dropdown">
                                                <i className="bi bi-three-dots"></i>
                                            </button>
                                            <ul className="dropdown-menu dropdown-menu-end">
                                                <li>
                                                    <button className="dropdown-item" onClick={() => handleEdit(voucher)}>
                                                        <i className="bi bi-pencil me-2"></i>
                                                        Edit
                                                    </button>
                                                </li>
                                                <li>
                                                    <button className="dropdown-item" onClick={() => toggleStatus(voucher)}>
                                                        <i className={`bi bi-${voucher.status === 'active' ? 'pause-circle' : 'play-circle'} me-2`}></i>
                                                        {voucher.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </li>
                                                <li><hr className="dropdown-divider" /></li>
                                                <li>
                                                    <button className="dropdown-item text-danger" onClick={() => confirmDelete(voucher)}>
                                                        <i className="bi bi-trash me-2"></i>
                                                        Delete
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    {/* Description */}
                                    {voucher.description && (
                                        <p className="text-muted small mb-3">{voucher.description}</p>
                                    )}
                                    
                                    {/* Discount Details */}
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <div className="bg-light rounded p-2 text-center">
                                                <div className="fw-bold text-primary fs-4">
                                                    {voucher.discount_value}
                                                    {voucher.discount_type === 'percentage' ? '%' : ' KES'}
                                                </div>
                                                <small className="text-muted">Discount</small>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="bg-light rounded p-2 text-center">
                                                <div className="fw-bold fs-4">
                                                    {voucher.min_spend ? `KES ${voucher.min_spend}` : 'None'}
                                                </div>
                                                <small className="text-muted">Min. Spend</small>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Footer */}
                                    <div className="border-top pt-3">
                                        <div className="row">
                                            <div className="col-6">
                                                <small className="text-muted d-block">Expires</small>
                                                <span className={`fw-bold text-${getExpiryStatus(voucher).color}`}>
                                                    {getExpiryStatus(voucher).text}
                                                </span>
                                            </div>
                                            <div className="col-6 text-end">
                                                <small className="text-muted d-block">Usage Limit</small>
                                                <span className="fw-bold">
                                                    {voucher.usage_limit || 'Unlimited'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Voucher Modal */}
            {showCreateModal && (
                <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-primary text-white">
                                <h4 className="modal-title fw-bold">
                                    <i className={`bi ${editingVoucher ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                                    {editingVoucher ? "Edit Voucher" : "Create New Voucher"}
                                </h4>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        {/* Code */}
                                        <div className="col-md-8">
                                            <label className="form-label fw-semibold">
                                                Voucher Code *
                                            </label>
                                            <div className="input-group">
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-lg"
                                                    placeholder="SUMMER25"
                                                    value={formData.code}
                                                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                                    required
                                                />
                                                <button 
                                                    type="button"
                                                    className="btn btn-outline-primary"
                                                    onClick={generateCode}
                                                >
                                                    <i className="bi bi-shuffle me-1"></i>
                                                    Generate
                                                </button>
                                            </div>
                                            <small className="text-muted">Enter a unique code or generate one automatically</small>
                                        </div>
                                        
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">
                                                Status *
                                            </label>
                                            <select 
                                                className="form-select form-control-lg"
                                                value={formData.status}
                                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                        
                                        {/* Discount Details */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Discount Type *
                                            </label>
                                            <select 
                                                className="form-select"
                                                value={formData.discount_type}
                                                onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed Amount (KES)</option>
                                            </select>
                                        </div>
                                        
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Discount Value *
                                            </label>
                                            <div className="input-group">
                                                <input 
                                                    type="number" 
                                                    className="form-control"
                                                    placeholder={formData.discount_type === 'percentage' ? '25' : '1000'}
                                                    value={formData.discount_value}
                                                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                                                    required
                                                    min="0"
                                                    max={formData.discount_type === 'percentage' ? '100' : '100000'}
                                                />
                                                <span className="input-group-text">
                                                    {formData.discount_type === 'percentage' ? '%' : 'KES'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Additional Details */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Minimum Spend (KES)
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text">KES</span>
                                                <input 
                                                    type="number" 
                                                    className="form-control"
                                                    placeholder="0"
                                                    value={formData.min_spend}
                                                    onChange={(e) => setFormData({...formData, min_spend: e.target.value})}
                                                    min="0"
                                                />
                                            </div>
                                            <small className="text-muted">Leave empty for no minimum</small>
                                        </div>
                                        
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Usage Limit
                                            </label>
                                            <input 
                                                type="number" 
                                                className="form-control"
                                                placeholder="Unlimited"
                                                value={formData.usage_limit}
                                                onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                                                min="1"
                                            />
                                            <small className="text-muted">Maximum number of times this voucher can be used</small>
                                        </div>
                                        
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Expiry Date *
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control"
                                                value={formData.expiry_date}
                                                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Description (Optional)
                                            </label>
                                            <textarea 
                                                className="form-control"
                                                rows="2"
                                                placeholder="E.g., Summer sale discount for all customers"
                                                value={formData.description}
                                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="modal-footer border-0 p-4">
                                    <button 
                                        type="button" 
                                        className="btn btn-lg btn-outline-secondary px-4"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-lg btn-primary px-4"
                                    >
                                        <i className={`bi ${editingVoucher ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                                        {editingVoucher ? "Update Voucher" : "Create Voucher"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && voucherToDelete && (
                <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold text-danger">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    Delete Voucher
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <div className="mb-3">
                                        <i className="bi bi-trash display-1 text-danger"></i>
                                    </div>
                                    <h5 className="fw-bold mb-3">Delete "{voucherToDelete.code}"?</h5>
                                    <p className="text-muted">
                                        This action cannot be undone. This voucher will be permanently removed and any customer using this code will no longer get the discount.
                                    </p>
                                    <div className="alert alert-warning mt-3">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        <strong>Warning:</strong> Deleting active vouchers may affect ongoing promotions.
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger"
                                    onClick={handleDelete}
                                >
                                    <i className="bi bi-trash me-2"></i>
                                    Yes, Delete Voucher
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminVouchers;