import React, { useState, useEffect } from "react";
// EDITED: Use axiosPrivate
import { axiosPrivate } from "../../api/axios";
import { BASE_URL } from "../../tokens/BASE_URL";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [orderDetails, setOrderDetails] = useState({});
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            // EDITED: axiosPrivate
            const res = await axiosPrivate.get(`${BASE_URL}/order`);
            // The backend returns { orders: [...] }
            setOrders(res.data || []);
            setError("");
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Failed to load your orders. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (id) => {
        if (orderDetails[id]) return; // Already fetched

        try {
            // EDITED: axiosPrivate
            const res = await axiosPrivate.get(`${BASE_URL}/order/${id}`);
            setOrderDetails(prev => ({
                ...prev,
                [id]: res.data // Backend returns { order, items }
            }));
        } catch (err) {
            console.error("Error fetching order details:", err);
        }
    };

    const toggleOrder = (id) => {
        if (expandedOrderId === id) {
            setExpandedOrderId(null);
        } else {
            setExpandedOrderId(id);
            fetchOrderDetails(id);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case "pending": return "bg-warning text-dark";
            case "paid": return "bg-success";
            case "shipped": return "bg-info text-white";
            case "cancelled": return "bg-danger";
            default: return "bg-secondary";
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-KE", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Fetching your orders...</p>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 fw-bold text-primary">Your Orders</h1>
                <button className="btn btn-outline-primary btn-sm" onClick={fetchOrders}>
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                </div>
            )}

            {orders.length === 0 ? (
                <div className="card shadow-sm border-0 text-center py-5">
                    <div className="card-body">
                        <i className="bi bi-bag-x display-1 text-muted mb-3"></i>
                        <h3>No orders found</h3>
                        <p className="text-muted">You haven't placed any orders yet.</p>
                    </div>
                </div>
            ) : (
                <div className="row">
                    <div className="col-12">
                        <div className="card shadow-sm border-0 overflow-hidden">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Order ID</th>
                                            <th>Date</th>
                                            <th>Total Amount</th>
                                            <th>Status</th>
                                            <th className="text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <React.Fragment key={order.id}>
                                                <tr
                                                    onClick={() => toggleOrder(order.id)}
                                                    style={{ cursor: "pointer" }}
                                                    className={expandedOrderId === order.id ? "table-light" : ""}
                                                >
                                                    <td className="ps-4">
                                                        <span className="fw-bold text-primary">#{String(order.id).padStart(5, '0')}</span>
                                                    </td>
                                                    <td>{formatDate(order.created_at)}</td>
                                                    <td>
                                                        <span className="fw-semibold">KES {Number(order.total).toFixed(2)}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge rounded-pill ${getStatusBadgeClass(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <button className="btn btn-sm btn-outline-secondary">
                                                            <i className={`bi bi-chevron-${expandedOrderId === order.id ? 'up' : 'down'}`}></i> Details
                                                        </button>
                                                    </td>
                                                </tr>

                                                {expandedOrderId === order.id && (
                                                    <tr>
                                                        <td colSpan="5" className="p-0 border-0">
                                                            <div className="bg-light p-4 border-top border-bottom">
                                                                <h6 className="fw-bold mb-3">Order Items</h6>
                                                                {!orderDetails[order.id] ? (
                                                                    <div className="text-center py-3">
                                                                        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="row g-3">
                                                                        {orderDetails[order.id].items?.map((item, idx) => (
                                                                            <div key={idx} className="col-12">
                                                                                <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
                                                                                    <div className="d-flex align-items-center">
                                                                                        <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                                                                            <i className="bi bi-box text-primary"></i>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="mb-0 fw-bold">{item.name}</p>
                                                                                            <small className="text-muted">Quantity: {item.quantity}</small>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="fw-semibold text-primary">KES {(Number(item.price) * item.quantity).toFixed(2)}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        <div className="col-12 mb-4">
                                                                            <div className="card shadow-sm border-0">
                                                                                <div className="card-body">
                                                                                    <h6 className="fw-bold mb-4">Order Status Timeline</h6>
                                                                                    <div className="d-flex justify-content-between position-relative mb-5 mt-4 px-3">
                                                                                        {/* Horizontal Line background */}
                                                                                        <div className="position-absolute top-50 start-0 end-0 translate-middle-y bg-light" style={{ height: "4px", zIndex: 0 }}></div>
                                                                                        {/* Active Line */}
                                                                                        <div
                                                                                            className="position-absolute top-50 start-0 translate-middle-y bg-primary"
                                                                                            style={{
                                                                                                height: "4px",
                                                                                                zIndex: 1,
                                                                                                width: order.status === 'delivered' ? '100%' : order.status === 'shipped' ? '66%' : order.status === 'paid' ? '33%' : '0%',
                                                                                                transition: "width 0.5s ease"
                                                                                            }}
                                                                                        ></div>

                                                                                        {['Pending', 'Paid', 'Shipped', 'Delivered'].map((step, sIdx) => {
                                                                                            const isCompleted =
                                                                                                (order.status === 'delivered') ||
                                                                                                (order.status === 'shipped' && sIdx <= 2) ||
                                                                                                (order.status === 'paid' && sIdx <= 1) ||
                                                                                                (order.status === 'pending' && sIdx === 0);

                                                                                            const isActive = order.status.toLowerCase() === step.toLowerCase();

                                                                                            return (
                                                                                                <div key={step} className="text-center" style={{ zIndex: 2, width: "20%" }}>
                                                                                                    <div
                                                                                                        className={`rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center shadow-sm ${isCompleted ? 'bg-primary text-white' : 'bg-white text-muted border border-2'}`}
                                                                                                        style={{ width: "35px", height: "35px" }}
                                                                                                    >
                                                                                                        <i className={`bi ${isCompleted ? 'bi-check' : 'bi-circle'}`}></i>
                                                                                                    </div>
                                                                                                    <div className={`very-small fw-bold ${isActive ? 'text-primary' : 'text-muted'}`} style={{ fontSize: "0.7rem" }}>{step}</div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-12 mt-2">
                                                                            <div className="card border-0 shadow-sm">
                                                                                <div className="card-body">
                                                                                    <div className="d-flex justify-content-between mb-2">
                                                                                        <span className="text-muted">Payment status:</span>
                                                                                        <span className={`fw-bold ${order.status === 'paid' ? 'text-success' : 'text-warning'}`}>{order.status === 'paid' ? 'Completed' : 'Pending'}</span>
                                                                                    </div>
                                                                                    <div className="d-flex justify-content-between">
                                                                                        <span className="text-muted">Order ID:</span>
                                                                                        <span className="text-muted">#{order.id}</span>
                                                                                    </div>
                                                                                    <div className="mt-4 pt-3 border-top text-center">
                                                                                        <button
                                                                                            className="btn btn-sm btn-outline-primary"
                                                                                            onClick={() => {
                                                                                                window.print();
                                                                                            }}
                                                                                        >
                                                                                            <i className="bi bi-printer me-1"></i> Print Receipt
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Orders;
