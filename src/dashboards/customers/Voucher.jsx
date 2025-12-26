import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";

const Voucher = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${BASE_URL}/vouchers`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                });
                setVouchers(res.data);
            } catch (err) {
                setError("Failed to load vouchers");
            } finally {
                setLoading(false);
            }
        };
        fetchVouchers();
    }, []);

    return (
        <div className="container py-4">
            <div className="mb-4">
                <h2 className="fw-bold text-primary mb-1">My Vouchers</h2>
                <p className="text-muted">Available discounts and offers for you</p>
            </div>

            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}

            {!loading && vouchers.length === 0 && !error && (
                <div className="card border-0 shadow-sm text-center py-5">
                    <div className="card-body">
                        <i className="bi bi-ticket-perforated display-1 text-muted mb-3"></i>
                        <h4 className="fw-bold">No vouchers available</h4>
                        <p className="text-muted">Check back later for exciting offers!</p>
                    </div>
                </div>
            )}

            <div className="row g-4">
                {vouchers.map((voucher) => (
                    <div key={voucher.id} className="col-md-6 col-lg-4">
                        <div className="card h-100 border-0 shadow-sm overflow-hidden position-relative voucher-card">
                            <div className="card-body p-0">
                                <div className="d-flex h-100">
                                    {/* Left Side: Discount Info */}
                                    <div className="bg-primary text-white d-flex flex-column justify-content-center align-items-center p-3" style={{ width: "35%", minHeight: "130px" }}>
                                        <h3 className="fw-bold mb-0">
                                            {voucher.discount_type === 'percentage' ? `${Math.round(voucher.discount_value)}%` : `KES ${Math.round(voucher.discount_value)}`}
                                        </h3>
                                        <small className="text-uppercase" style={{ fontSize: "0.7rem" }}>OFF</small>
                                    </div>

                                    {/* Right Side: Details */}
                                    <div className="p-3 bg-white" style={{ width: "65%" }}>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <span className="badge bg-light text-primary border border-primary-subtle px-2 py-1">
                                                {voucher.code}
                                            </span>
                                            <button
                                                className="btn btn-sm btn-link p-0 text-primary text-decoration-none"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(voucher.code);
                                                    alert("Code copied!");
                                                }}
                                            >
                                                <i className="bi bi-copy"></i>
                                            </button>
                                        </div>
                                        <p className="small text-muted mb-2">
                                            {voucher.min_spend ? `Min. spend KES ${voucher.min_spend}` : 'No minimum spend'}
                                        </p>
                                        <div className="d-flex align-items-center mt-auto">
                                            <i className="bi bi-clock-history small text-danger me-1"></i>
                                            <small className="text-danger fw-semibold" style={{ fontSize: "0.75rem" }}>
                                                Exp: {new Date(voucher.expiry_date).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative notches for ticket look */}
                            <div className="position-absolute translate-middle" style={{ top: "0", left: "35%", width: "20px", height: "20px", borderRadius: "50%", background: "#f8f9fa" }}></div>
                            <div className="position-absolute translate-middle" style={{ bottom: "-20px", left: "35%", width: "20px", height: "20px", borderRadius: "50%", background: "#f8f9fa" }}></div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        .voucher-card {
          transition: transform 0.2s;
        }
        .voucher-card:hover {
          transform: translateY(-5px);
        }
      `}</style>
        </div>
    );
};

export default Voucher;
