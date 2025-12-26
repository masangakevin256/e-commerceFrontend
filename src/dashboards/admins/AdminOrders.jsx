import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/order`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        }
      });
      setOrders(res.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      await axios.put(
        `${BASE_URL}/order/update/${orderId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          }
        }
      );
      fetchOrders();
    } catch (err) {
      alert("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const statusColors = {
    pending: "warning",
    paid: "info",
    shipped: "primary",
    delivered: "success",
    cancelled: "danger"
  };

  const statusIcons = {
    pending: "bi-hourglass",
    paid: "bi-credit-card",
    shipped: "bi-truck",
    delivered: "bi-check-circle",
    cancelled: "bi-x-circle"
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        order.customer_name?.toLowerCase().includes(term) ||
        order.id?.toString().includes(term) ||
        order.customer_id?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0)
  };

  if (loading) return (
    <div className="container-fluid py-5">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading orders...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-3 px-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold text-primary mb-2">
                <i className="bi bi-cart-check me-2"></i>
                Order Management
              </h2>
              <p className="text-muted mb-0">View and manage customer orders</p>
            </div>
            <div className="d-flex align-items-center">
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 me-3">
                <i className="bi bi-cart me-1"></i>
                {stats.total} Orders
              </span>
              <button className="btn btn-primary d-flex align-items-center" onClick={fetchOrders}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card border-0 bg-primary bg-opacity-10 shadow-sm">
            <div className="card-body text-center p-3">
              <div className="h4 fw-bold text-primary mb-1">{stats.total}</div>
              <div className="small text-muted">Total Orders</div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card border-0 bg-warning bg-opacity-10 shadow-sm">
            <div className="card-body text-center p-3">
              <div className="h4 fw-bold text-warning mb-1">{stats.pending}</div>
              <div className="small text-muted">Pending</div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card border-0 bg-info bg-opacity-10 shadow-sm">
            <div className="card-body text-center p-3">
              <div className="h4 fw-bold text-info mb-1">{stats.paid}</div>
              <div className="small text-muted">Paid</div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card border-0 bg-primary bg-opacity-10 shadow-sm">
            <div className="card-body text-center p-3">
              <div className="h4 fw-bold text-primary mb-1">{stats.shipped}</div>
              <div className="small text-muted">Shipped</div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card border-0 bg-success bg-opacity-10 shadow-sm">
            <div className="card-body text-center p-3">
              <div className="h4 fw-bold text-success mb-1">{stats.delivered}</div>
              <div className="small text-muted">Delivered</div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card border-0 bg-success bg-opacity-10 shadow-sm">
            <div className="card-body text-center p-3">
              <div className="h4 fw-bold text-success mb-1">
                KES {stats.revenue.toLocaleString()}
              </div>
              <div className="small text-muted">Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="row g-3">
                <div className="col-lg-4 col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search by order ID, customer name..."
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
                    {Object.keys(statusColors).map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-5 col-md-12">
                  <div className="d-flex flex-wrap gap-2">
                    <span className="small text-muted align-self-center me-2">Quick Filters:</span>
                    {Object.keys(statusColors).map(status => (
                      <button
                        key={status}
                        className={`btn btn-sm ${statusFilter === status ? 'btn-' + statusColors[status] : 'btn-outline-' + statusColors[status]}`}
                        onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                      >
                        <i className={`bi ${statusIcons[status]} me-1`}></i>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {statusFilter === status && (
                          <span className="badge bg-white text-dark ms-1">
                            {orders.filter(o => o.status === status).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">ORDER ID</th>
                      <th>CUSTOMER</th>
                      <th>DATE</th>
                      <th>TOTAL</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div className="py-4">
                            <i className="bi bi-cart-x display-1 text-muted mb-3"></i>
                            <h5 className="fw-bold text-primary mb-2">No orders found</h5>
                            <p className="text-muted">
                              {searchTerm || statusFilter !== "all"
                                ? "Try adjusting your search or filter criteria."
                                : "No orders have been placed yet."}
                            </p>
                            {(searchTerm || statusFilter !== "all") && (
                              <button 
                                className="btn btn-primary mt-2"
                                onClick={() => {
                                  setSearchTerm("");
                                  setStatusFilter("all");
                                }}
                              >
                                <i className="bi bi-x-circle me-2"></i>
                                Clear Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover-highlight">
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                                <i className="bi bi-receipt text-primary"></i>
                              </div>
                              <div>
                                <div className="fw-bold">#{order.id}</div>
                                <small className="text-muted">ID: {order.id}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="fw-medium">{order.customer_name}</div>
                            <small className="text-muted">{order.customer_id}</small>
                          </td>
                          <td>
                            <div>{new Date(order.created_at).toLocaleDateString()}</div>
                            <small className="text-muted">
                              {new Date(order.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </small>
                          </td>
                          <td>
                            <div className="fw-bold text-primary">
                              KES {Number(order.total).toLocaleString()}
                            </div>
                          </td>
                          <td>
                            <span className={`badge bg-${statusColors[order.status] || "secondary"} d-inline-flex align-items-center`}>
                              <i className={`bi ${statusIcons[order.status]} me-1`}></i>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-outline-primary btn-sm d-flex align-items-center"
                                onClick={() => viewOrderDetails(order)}
                                title="View Details"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <select
                                className="form-select form-select-sm"
                                value={order.status}
                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                disabled={updatingStatus === order.id}
                                style={{ width: "140px" }}
                              >
                                {Object.keys(statusColors).map(status => (
                                  <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </option>
                                ))}
                              </select>
                              {updatingStatus === order.id && (
                                <div className="d-flex align-items-center">
                                  <div className="spinner-border spinner-border-sm text-primary"></div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {filteredOrders.length > 0 && (
        <div className="row mt-3">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center text-muted small">
              <div>
                Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
              </div>
              <div>
                Total Revenue: <strong className="text-success">KES {stats.revenue.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-receipt me-2"></i>
                  Order #{selectedOrder.id} Details
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowOrderModal(false)}
                ></button>
              </div>
              <div className="modal-body p-0">
                <div className="p-4">
                  {/* Order Summary */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6 className="fw-bold text-muted mb-3">Customer Information</h6>
                      <div className="card border-0 bg-light">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="bi bi-person text-primary fs-5"></i>
                            </div>
                            <div>
                              <div className="fw-bold">{selectedOrder.customer_name}</div>
                              <div className="small text-muted">Customer ID: {selectedOrder.customer_id}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold text-muted mb-3">Order Information</h6>
                      <div className="card border-0 bg-light">
                        <div className="card-body">
                          <div className="row">
                            <div className="col-6">
                              <div className="small text-muted">Order Date</div>
                              <div className="fw-bold">
                                {new Date(selectedOrder.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="small text-muted">Status</div>
                              <span className={`badge bg-${statusColors[selectedOrder.status] || "secondary"}`}>
                                {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-muted mb-3">Order Items</h6>
                    <div className="card border-0">
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="bg-light">
                              <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* This would need actual order items data */}
                              <tr>
                                <td colSpan="4" className="text-center py-3 text-muted">
                                  Order items data not available in current API response
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="row">
                    <div className="col-md-6"></div>
                    <div className="col-md-6">
                      <div className="card border-0 bg-primary bg-opacity-5">
                        <div className="card-body">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Subtotal</span>
                            <span className="fw-bold">KES {Number(selectedOrder.total).toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Shipping</span>
                            <span className="fw-bold">KES 0.00</span>
                          </div>
                          <div className="d-flex justify-content-between mb-3 border-top pt-3">
                            <span className="fw-bold">Total Amount</span>
                            <span className="h5 fw-bold text-primary">
                              KES {Number(selectedOrder.total).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={() => setShowOrderModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    // Implement print or other actions
                    alert("Print functionality would be implemented here");
                  }}
                >
                  <i className="bi bi-printer me-2"></i>
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;