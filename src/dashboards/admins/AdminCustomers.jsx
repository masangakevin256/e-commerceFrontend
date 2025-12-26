import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";

function AdminCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortField, setSortField] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/customers`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCustomers(res.data);
        } catch (err) {
            setError("Failed to fetch customers");
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        // Search filter
        const matchesSearch = searchTerm === "" || 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.phoneNumber && customer.phoneNumber.includes(searchTerm));
        
        // Status filter
        const matchesStatus = statusFilter === "all" || 
            (statusFilter === "active" && customer.verify_email === "active") ||
            (statusFilter === "pending" && customer.verify_email === "pending") ||
            (statusFilter === "inactive" && (!customer.verify_email || customer.verify_email !== "active"));
        
        return matchesSearch && matchesStatus;
    });

    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        if (sortField === "created_at") {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }
        
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const viewCustomerDetails = (customer) => {
        setSelectedCustomer(customer);
        setShowDetailsModal(true);
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

    const getTotalCustomers = () => customers.length;
    const getActiveCustomers = () => customers.filter(c => c.verify_email === "active").length;
    const getPendingCustomers = () => customers.filter(c => c.verify_email === "pending").length;
    const getTotalLoyaltyPoints = () => customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading customers...</p>
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
                            <h4 className="fw-bold mb-1">Customer Management</h4>
                            <p className="text-muted mb-0">Manage and monitor all registered customers</p>
                        </div>
                        <button className="btn btn-primary d-flex align-items-center" onClick={fetchCustomers}>
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Refresh
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
                                    <h6 className="text-muted mb-2">Total Customers</h6>
                                    <h3 className="fw-bold mb-0">{getTotalCustomers()}</h3>
                                </div>
                                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-people-fill text-primary fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-success small">
                                    <i className="bi bi-arrow-up me-1"></i>
                                    All registered users
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Active Customers</h6>
                                    <h3 className="fw-bold mb-0">{getActiveCustomers()}</h3>
                                </div>
                                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-check-circle-fill text-success fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-success small">
                                    <i className="bi bi-check-circle me-1"></i>
                                    Verified accounts
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Pending Verification</h6>
                                    <h3 className="fw-bold mb-0">{getPendingCustomers()}</h3>
                                </div>
                                <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-clock-fill text-warning fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-warning small">
                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                    Need verification
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Total Loyalty Points</h6>
                                    <h3 className="fw-bold mb-0">{getTotalLoyaltyPoints()}</h3>
                                </div>
                                <div className="bg-info bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-gem text-info fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-info small">
                                    <i className="bi bi-coin me-1"></i>
                                    Across all customers
                                </span>
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
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active Only</option>
                                        <option value="pending">Pending Only</option>
                                        <option value="inactive">Inactive Only</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select 
                                        className="form-select"
                                        value={sortField}
                                        onChange={(e) => setSortField(e.target.value)}
                                    >
                                        <option value="created_at">Sort by: Newest</option>
                                        <option value="name">Sort by: Name A-Z</option>
                                        <option value="loyalty_points">Sort by: Loyalty Points</option>
                                    </select>
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

            {/* Customers Table */}
            <div className="row">
                <div className="col">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="fw-bold mb-0">Customer Directory</h6>
                                <span className="badge bg-light text-dark">
                                    {sortedCustomers.length} of {customers.length} customers
                                </span>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th 
                                                className="py-3 px-4"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => handleSort("customer_id")}
                                            >
                                                <div className="d-flex align-items-center">
                                                    Customer ID
                                                    {sortField === "customer_id" && (
                                                        <i className={`bi bi-chevron-${sortOrder === "asc" ? "up" : "down"} ms-1`}></i>
                                                    )}
                                                </div>
                                            </th>
                                            <th 
                                                className="py-3 px-4"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => handleSort("name")}
                                            >
                                                <div className="d-flex align-items-center">
                                                    Name
                                                    {sortField === "name" && (
                                                        <i className={`bi bi-chevron-${sortOrder === "asc" ? "up" : "down"} ms-1`}></i>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="py-3 px-4">Email</th>
                                            <th className="py-3 px-4">Phone</th>
                                            <th 
                                                className="py-3 px-4"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => handleSort("loyalty_points")}
                                            >
                                                <div className="d-flex align-items-center">
                                                    Loyalty Points
                                                    {sortField === "loyalty_points" && (
                                                        <i className={`bi bi-chevron-${sortOrder === "asc" ? "up" : "down"} ms-1`}></i>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedCustomers.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-5">
                                                    <div className="text-muted">
                                                        <i className="bi bi-people display-6 mb-3"></i>
                                                        <p className="mb-0">No customers found</p>
                                                        {searchTerm && (
                                                            <small>Try adjusting your search or filters</small>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedCustomers.map((customer) => (
                                                <tr key={customer.customer_id} className="border-top">
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                                 style={{ width: "36px", height: "36px" }}>
                                                                <i className="bi bi-person text-muted"></i>
                                                            </div>
                                                            <div>
                                                                <small className="text-muted d-block">ID</small>
                                                                <span className="fw-bold">{customer.customer_id}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="fw-bold">{customer.name}</div>
                                                        <small className="text-muted">
                                                            <i className="bi bi-calendar3 me-1"></i>
                                                            {new Date(customer.created_at).toLocaleDateString()}
                                                        </small>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <i className="bi bi-envelope me-2 text-muted"></i>
                                                            <span>{customer.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <i className="bi bi-telephone me-2 text-muted"></i>
                                                            <span>{customer.phoneNumber || "Not provided"}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-info bg-opacity-10 rounded p-2 me-3">
                                                                <i className="bi bi-gem text-info"></i>
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold">{customer.loyalty_points || 0}</div>
                                                                <small className="text-muted">points</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {getStatusBadge(customer.verify_email)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex gap-2">
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                                                onClick={() => viewCustomerDetails(customer)}
                                                                title="View Details"
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline-success d-flex align-items-center"
                                                                title="Edit Customer"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline-danger d-flex align-items-center"
                                                                title="Delete Customer"
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
                        {sortedCustomers.length > 0 && (
                            <div className="card-footer bg-white border-0 py-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                        Showing {sortedCustomers.length} of {customers.length} customers
                                    </small>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-sm btn-outline-secondary">
                                            <i className="bi bi-download me-1"></i>
                                            Export CSV
                                        </button>
                                        <button className="btn btn-sm btn-primary">
                                            <i className="bi bi-plus-circle me-1"></i>
                                            Add Customer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Customer Details Modal */}
            {selectedCustomer && showDetailsModal && (
                <div className="modal fade show" style={{display: "block", backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Customer Details</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowDetailsModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-4 text-center mb-4">
                                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                             style={{ width: "100px", height: "100px" }}>
                                            {selectedCustomer.profile_pic ? (
                                                <img 
                                                    src={`${BASE_URL}/uploads/${selectedCustomer.profile_pic}`} 
                                                    alt={selectedCustomer.name}
                                                    className="rounded-circle w-100 h-100"
                                                />
                                            ) : (
                                                <i className="bi bi-person text-muted fs-1"></i>
                                            )}
                                        </div>
                                        <h6 className="fw-bold mb-1">{selectedCustomer.name}</h6>
                                        <small className="text-muted">{selectedCustomer.customer_id}</small>
                                        <div className="mt-3">
                                            {getStatusBadge(selectedCustomer.verify_email)}
                                        </div>
                                    </div>
                                    <div className="col-md-8">
                                        <div className="row g-3">
                                            <div className="col-6">
                                                <label className="form-label text-muted small mb-1">Email Address</label>
                                                <div className="fw-bold">{selectedCustomer.email}</div>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-muted small mb-1">Phone Number</label>
                                                <div className="fw-bold">{selectedCustomer.phoneNumber || "Not provided"}</div>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-muted small mb-1">Loyalty Points</label>
                                                <div className="fw-bold">
                                                    <i className="bi bi-gem text-info me-1"></i>
                                                    {selectedCustomer.loyalty_points || 0} points
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-muted small mb-1">Theme Preference</label>
                                                <div className="fw-bold text-capitalize">
                                                    {selectedCustomer.theme_preference || "Light"}
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label text-muted small mb-1">Address</label>
                                                <div className="fw-bold">
                                                    {selectedCustomer.address || "No address provided"}
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-muted small mb-1">Member Since</label>
                                                <div className="fw-bold">
                                                    {new Date(selectedCustomer.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-muted small mb-1">Referral Code</label>
                                                <div className="fw-bold">
                                                    {selectedCustomer.referral_code ? (
                                                        <span className="badge bg-info bg-opacity-10 text-info border border-info">
                                                            {selectedCustomer.referral_code}
                                                        </span>
                                                    ) : "None"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setShowDetailsModal(false)}
                                >
                                    Close
                                </button>
                                <button type="button" className="btn btn-primary">
                                    <i className="bi bi-pencil me-1"></i>
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminCustomers;