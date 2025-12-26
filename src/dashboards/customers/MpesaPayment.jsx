import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";
const MpesaPayment = ({ orderId, total, onPaymentSuccess, onCancel, defaultPhone }) => {
    const [phone, setPhone] = useState(defaultPhone || "");

    useEffect(() => {
        if (defaultPhone) setPhone(defaultPhone);
    }, [defaultPhone]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("idle"); // idle, processing, waiting, success, failed
    const [error, setError] = useState("");
    const [timeLeft, setTimeLeft] = useState(60); // 60 seconds timeout for polling

    // Poll for payment status
    useEffect(() => {
        let interval;
        if (status === "waiting" && timeLeft > 0) {
            interval = setInterval(async () => {
                try {
                    const res = await axios.get(`${BASE_URL}/order/${orderId}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
                    });

                    if (res.data.order.status === "paid") {
                        setStatus("success");
                        clearInterval(interval);
                        setTimeout(() => onPaymentSuccess(), 2000);
                    } else if (res.data.order.status === "failed") {
                        setStatus("failed");
                        setError("Payment failed. Please try again.");
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
                setTimeLeft((prev) => prev - 3);
            }, 3000);
        } else if (timeLeft <= 0 && status === "waiting") {
            setStatus("failed");
            setError("Payment timed out. If you paid, please check your orders later.");
        }

        return () => clearInterval(interval);
    }, [status, timeLeft, orderId, onPaymentSuccess]);

    const handlePay = async (e) => {
        e.preventDefault();
        if (!phone) {
            setError("Please enter your M-Pesa phone number");
            return;
        }

        // Format phone: 2547XXXXXXXX
        let formattedPhone = phone.replace(/\D/g, "");
        if (formattedPhone.startsWith("0")) formattedPhone = "254" + formattedPhone.slice(1);
        if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) formattedPhone = "254" + formattedPhone;

        if (formattedPhone.length !== 12) {
            setError("Please enter a valid phone number (e.g., 0712345678)");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setStatus("processing");

             await axios.post(
                `${BASE_URL}/api/mpesa/stkpush`,
                { phone: formattedPhone, amount: Math.round(total), orderId },
                { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
                );



            setStatus("waiting");
            setLoading(false);
        } catch (err) {
            setLoading(false);
            setStatus("failed");
            setError(err.response?.data?.message || "Failed to initiate STK Push. Check your internet or phone number.");
        }
    };

    return (
        <div className="card border-0 shadow-sm overflow-hidden">
            <div className="card-header bg-success text-white py-3">
                <div className="d-flex align-items-center justify-content-between w-100">
                    <div className="d-flex align-items-center">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png"
                            alt="M-Pesa"
                            style={{ height: "30px", marginRight: "10px", filter: "brightness(0) invert(1)" }}
                        />
                        <h5 className="mb-0 fw-bold">Pay with M-Pesa</h5>
                    </div>
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        aria-label="Close"
                        onClick={onCancel}
                        disabled={loading && status === "processing"}
                    ></button>
                </div>
            </div>
            <div className="card-body p-4 text-center">
                {status === "idle" || status === "failed" || status === "processing" ? (
                    <>
                        <div className="mb-4">
                            <p className="text-muted">Enter your M-Pesa registered phone number to receive a payment prompt on your phone.</p>
                            <div className="h4 fw-bold text-success mb-2">Total: KES {total.toFixed(2)}</div>
                        </div>

                        <form onSubmit={handlePay}>
                            <div className="mb-3">
                                <div className="input-group input-group-lg">
                                    <span className="input-group-text bg-light border-end-0">
                                        <i className="bi bi-phone text-success"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 text-dark bg-white"
                                        placeholder="07XXXXXXXX"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        disabled={loading}
                                        style={{ paddingLeft: '10px' }}
                                    />
                                </div>
                                {error && <div className="text-danger small mt-2">{error}</div>}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success btn-lg w-100 py-3 fw-bold mb-3"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                ) : (
                                    <i className="bi bi-shield-lock-fill me-2"></i>
                                )}
                                Pay Now
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-secondary w-100 py-2 fw-semibold"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                Cancel and try another method
                            </button>
                        </form>
                    </>
                ) : status === "waiting" ? (
                    <div className="py-4">
                        <div className="spinner-grow text-success mb-4" role="status" style={{ width: "3rem", height: "3rem" }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h5 className="fw-bold text-success mb-2">Check your phone!</h5>
                        <p className="text-muted mb-4">A payment prompt has been sent to <strong>{phone.startsWith('0') ? '254' + phone.slice(1) : phone}</strong>. Please enter your M-Pesa PIN to complete the transaction.</p>
                        <div className="progress mb-2" style={{ height: "5px" }}>
                            <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{ width: `${(timeLeft / 60) * 100}%` }}
                            ></div>
                        </div>
                        <small className="text-muted">Waiting for confirmation... ({timeLeft}s)</small>
                    </div>
                ) : (
                    <div className="py-4 animated fadeIn">
                        <div className="mb-4">
                            <i className="bi bi-check-circle-fill text-success display-1"></i>
                        </div>
                        <h4 className="fw-bold text-success mb-2">Payment Successful!</h4>
                        <p className="text-muted">Thank you! Your order is being processed.</p>
                    </div>
                )}
            </div>
            <div className="card-footer bg-light border-top-0 py-3 text-center">
                <small className="text-muted">
                    <i className="bi bi-shield-check text-success me-1"></i>
                    Secure payment powered by Safaricom Daraja
                </small>
            </div>
        </div>
    );
};

export default MpesaPayment;
