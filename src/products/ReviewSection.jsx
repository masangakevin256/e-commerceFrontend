import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../tokens/BASE_URL.jsx";

const ReviewSection = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [myReview, setMyReview] = useState({ rating: 5, comment: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const BASE_URL = "http://localhost:3500";

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/reviews/${productId}`);
            setReviews(res.data);
        } catch (err) {
            console.error("Error fetching reviews:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const accessToken = localStorage.getItem("accessToken");
            await axios.post(`${BASE_URL}/reviews`, {
                productId,
                rating: myReview.rating,
                comment: myReview.comment,
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            setMessage("Review submitted!");
            setMyReview({ rating: 5, comment: "" });
            fetchReviews();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <i
                key={i}
                className={`bi ${i < rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'} me-1`}
            ></i>
        ));
    };

    return (
        <div className="mt-5">
            <h4 className="fw-bold mb-4">Customer Reviews ({reviews.length})</h4>

            <div className="row g-4">
                {/* Posting Section */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 bg-light">
                        <h5 className="fw-bold mb-3">Add a Review</h5>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Your Rating</label>
                                <div className="d-flex gap-2">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            className={`btn btn-sm ${myReview.rating >= num ? 'btn-warning' : 'btn-outline-secondary'}`}
                                            onClick={() => setMyReview({ ...myReview, rating: num })}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Comment</label>
                                <textarea
                                    className="form-control border-0 bg-white"
                                    rows="3"
                                    placeholder="Share your experience..."
                                    value={myReview.comment}
                                    onChange={(e) => setMyReview({ ...myReview, comment: e.target.value })}
                                ></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                {loading ? "Submitting..." : "Submit Review"}
                            </button>
                        </form>
                        {message && <div className="text-success small mt-2">{message}</div>}
                        {error && <div className="text-danger small mt-2">{error}</div>}
                    </div>
                </div>

                {/* Display Section */}
                <div className="col-lg-8">
                    {reviews.length === 0 ? (
                        <div className="text-center py-5 text-muted bg-light rounded shadow-sm">
                            <i className="bi bi-chat-left-dots display-4 mb-2"></i>
                            <p>No reviews yet. Be the first to review!</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {reviews.map((r) => (
                                <div key={r.id} className="card border-0 shadow-sm p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "40px", height: "40px" }}>
                                                <span className="fw-bold text-primary">{r.customer_name?.[0]}</span>
                                            </div>
                                            <div>
                                                <h6 className="fw-bold mb-0">{r.customer_name}</h6>
                                                <div className="small">{renderStars(r.rating)}</div>
                                            </div>
                                        </div>
                                        <small className="text-muted">{new Date(r.created_at).toLocaleDateString()}</small>
                                    </div>
                                    <p className="mb-0 text-muted">{r.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewSection;
