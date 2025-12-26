import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");


  useEffect(() => {
    fetchAllReviews();
    fetchProducts();
  }, []);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      const res = await axios.get(`${BASE_URL}/reviews/admin/all`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setReviews(res.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const res = await axios.get(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setProducts(res.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      await axios.delete(`${BASE_URL}/reviews/admin/${reviewId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Remove from state
      setReviews(reviews.filter(review => review.id !== reviewId));
      alert("Review deleted successfully");
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="d-flex">
        {[...Array(5)].map((_, i) => (
          <i
            key={i}
            className={`bi ${i < rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'} me-1`}
          ></i>
        ))}
        <span className="ms-2 fw-bold">{rating}/5</span>
      </div>
    );
  };

  const filteredReviews = reviews.filter(review => {
    if (selectedProduct !== "all" && review.product_id != selectedProduct) return false;
    if (selectedRating !== "all" && review.rating != selectedRating) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0">Customer Reviews</h4>
          <p className="text-muted mb-0">Manage product ratings and feedback</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={fetchAllReviews}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {reviews.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary bg-opacity-10 border-0">
              <div className="card-body text-center">
                <h3 className="fw-bold text-primary">{reviews.length}</h3>
                <p className="small mb-0">Total Reviews</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success bg-opacity-10 border-0">
              <div className="card-body text-center">
                <h3 className="fw-bold text-success">
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : "0.0"}
                </h3>
                <p className="small mb-0">Avg. Rating</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning bg-opacity-10 border-0">
              <div className="card-body text-center">
                <h3 className="fw-bold text-warning">
                  {reviews.filter(r => r.rating === 5).length}
                </h3>
                <p className="small mb-0">5-Star Reviews</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info bg-opacity-10 border-0">
              <div className="card-body text-center">
                <h3 className="fw-bold text-info">
                  {new Set(reviews.map(r => r.customer_id)).size}
                </h3>
                <p className="small mb-0">Unique Customers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label small fw-bold">Filter by Product</label>
          <select 
            className="form-select" 
            value={selectedProduct} 
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="all">All Products</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-bold">Filter by Rating</label>
          <select 
            className="form-select" 
            value={selectedRating} 
            onChange={(e) => setSelectedRating(e.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        {filteredReviews.length === 0 ? (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-chat-heart display-1 text-muted mb-3"></i>
                <h5 className="fw-bold">No Reviews Found</h5>
                <p className="text-muted">
                  {reviews.length === 0 
                    ? "No customer reviews yet. Reviews will appear here when customers rate products." 
                    : "No reviews match your filters."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="col-lg-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center">
                      {review.profile_pic ? (
                        <img 
                          src={`${BASE_URL}/uploads/profiles/${review.profile_pic}`}
                          className="rounded-circle me-3"
                          style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                          alt={review.customer_name}
                        />
                      ) : (
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                          style={{ width: '45px', height: '45px' }}>
                          <i className="bi bi-person text-muted fs-5"></i>
                        </div>
                      )}
                      <div>
                        <h6 className="fw-bold mb-0">{review.customer_name}</h6>
                        <small className="text-muted">{review.customer_email}</small>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteReview(review.id)}
                      title="Delete Review"
                      disabled={loading}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold mb-1">{review.product_name}</h6>
                        <small className="text-muted">KES {review.product_price?.toLocaleString() || "N/A"}</small>
                      </div>
                      <div className="text-end">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="card-text">
                      {review.comment || <span className="text-muted fst-italic">No comment provided</span>}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-top d-flex justify-content-between">
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                    <small className="text-muted">
                      Product ID: {review.product_id}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Products with most reviews */}
      {reviews.length > 0 && (
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body">
            <h6 className="fw-bold mb-3">Top Reviewed Products</h6>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Reviews</th>
                    <th>Avg. Rating</th>
                    <th>5-Star</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    reviews.reduce((acc, review) => {
                      if (!acc[review.product_id]) {
                        acc[review.product_id] = {
                          name: review.product_name,
                          reviews: [],
                          total: 0,
                          sum: 0
                        };
                      }
                      acc[review.product_id].reviews.push(review);
                      acc[review.product_id].total++;
                      acc[review.product_id].sum += review.rating;
                      return acc;
                    }, {})
                  )
                    .sort(([, a], [, b]) => b.total - a.total)
                    .slice(0, 5)
                    .map(([productId, data]) => (
                      <tr key={productId}>
                        <td className="fw-bold">{data.name}</td>
                        <td>
                          <span className="badge bg-primary">{data.total} reviews</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-2">{(data.sum / data.total).toFixed(1)}</span>
                            {renderStars(Math.round(data.sum / data.total))}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-warning">
                            {data.reviews.filter(r => r.rating === 5).length}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;