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
      
      // FIX: Ensure we're setting an array, even if the response is different
      const data = res.data;
      let reviewsArray = [];
      
      if (Array.isArray(data)) {
        reviewsArray = data;
      } else if (data && Array.isArray(data.reviews)) {
        reviewsArray = data.reviews;
      } else if (data && data.data && Array.isArray(data.data)) {
        reviewsArray = data.data;
      } else if (data && typeof data === 'object') {
        // If it's an object, try to extract an array from it
        const values = Object.values(data);
        if (values.length > 0 && Array.isArray(values[0])) {
          reviewsArray = values[0];
        }
      }
      
      setReviews(reviewsArray);
      setError("");
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews");
      setReviews([]); // Ensure reviews is always an array
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
      
      // FIX: Ensure we're setting an array
      const data = res.data;
      let productsArray = [];
      
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products;
      } else if (data && data.data && Array.isArray(data.data)) {
        productsArray = data.data;
      }
      
      setProducts(productsArray);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]); // Ensure products is always an array
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
      
      // Remove from state - ensure we're working with an array
      setReviews(prevReviews => {
        if (!Array.isArray(prevReviews)) return [];
        return prevReviews.filter(review => review.id !== reviewId);
      });
      
      alert("Review deleted successfully");
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    // Ensure rating is a number
    const numericRating = Number(rating) || 0;
    return (
      <div className="d-flex">
        {[...Array(5)].map((_, i) => (
          <i
            key={i}
            className={`bi ${i < numericRating ? 'bi-star-fill text-warning' : 'bi-star text-muted'} me-1`}
          ></i>
        ))}
        <span className="ms-2 fw-bold">{numericRating}/5</span>
      </div>
    );
  };

  // FIX: Add safety check for filteredReviews calculation
  const filteredReviews = Array.isArray(reviews) ? reviews.filter(review => {
    if (!review) return false; // Skip null/undefined reviews
    
    const reviewProductId = review.product_id;
    const reviewRating = Number(review.rating) || 0;
    
    if (selectedProduct !== "all" && reviewProductId != selectedProduct) return false;
    if (selectedRating !== "all" && reviewRating != selectedRating) return false;
    return true;
  }) : [];

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

      {/* Stats Summary - Add Array.isArray check */}
      {Array.isArray(reviews) && reviews.length > 0 && (
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
                    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
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
                  {reviews.filter(r => (Number(r.rating) || 0) === 5).length}
                </h3>
                <p className="small mb-0">5-Star Reviews</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info bg-opacity-10 border-0">
              <div className="card-body text-center">
                <h3 className="fw-bold text-info">
                  {new Set(reviews.map(r => r.customer_id).filter(id => id != null)).size}
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
            {Array.isArray(products) && products.map(product => (
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
        {/* FIX: Add Array.isArray check before mapping */}
        {!Array.isArray(filteredReviews) || filteredReviews.length === 0 ? (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-chat-heart display-1 text-muted mb-3"></i>
                <h5 className="fw-bold">No Reviews Found</h5>
                <p className="text-muted">
                  {!Array.isArray(reviews) || reviews.length === 0 
                    ? "No customer reviews yet. Reviews will appear here when customers rate products." 
                    : "No reviews match your filters."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          filteredReviews.map((review) => {
            // Add safety checks for review properties
            if (!review) return null;
            
            const reviewId = review.id || review._id || Math.random();
            const customerName = review.customer_name || 'Customer';
            const customerEmail = review.customer_email || '';
            const productName = review.product_name || 'Product';
            const productPrice = review.product_price || 0;
            const rating = Number(review.rating) || 0;
            const comment = review.comment || '';
            const profilePic = review.profile_pic || '';
            const createdAt = review.created_at || new Date().toISOString();
            
            return (
              <div key={reviewId} className="col-lg-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center">
                        {profilePic ? (
                          <img 
                            src={`${BASE_URL}/uploads/profiles/${profilePic}`}
                            className="rounded-circle me-3"
                            style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                            alt={customerName}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div class="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                                     style="width: 45px; height: 45px">
                                  <i class="bi bi-person text-muted fs-5"></i>
                                </div>`;
                            }}
                          />
                        ) : (
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                            style={{ width: '45px', height: '45px' }}>
                            <i className="bi bi-person text-muted fs-5"></i>
                          </div>
                        )}
                        <div>
                          <h6 className="fw-bold mb-0">{customerName}</h6>
                          <small className="text-muted">{customerEmail}</small>
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
                          <h6 className="fw-bold mb-1">{productName}</h6>
                          <small className="text-muted">KES {productPrice.toLocaleString() || "N/A"}</small>
                        </div>
                        <div className="text-end">
                          {renderStars(rating)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="card-text">
                        {comment || <span className="text-muted fst-italic">No comment provided</span>}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-top d-flex justify-content-between">
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(createdAt).toLocaleDateString('en-US', {
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
            );
          })
        )}
      </div>

      {/* Products with most reviews - Add Array.isArray check */}
      {Array.isArray(reviews) && reviews.length > 0 && (
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
                  {(() => {
                    try {
                      const productMap = reviews.reduce((acc, review) => {
                        if (!review || !review.product_id) return acc;
                        
                        const productId = review.product_id;
                        if (!acc[productId]) {
                          acc[productId] = {
                            name: review.product_name || `Product ${productId}`,
                            reviews: [],
                            total: 0,
                            sum: 0
                          };
                        }
                        acc[productId].reviews.push(review);
                        acc[productId].total++;
                        acc[productId].sum += Number(review.rating) || 0;
                        return acc;
                      }, {});
                      
                      return Object.entries(productMap)
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
                                {data.reviews.filter(r => (Number(r.rating) || 0) === 5).length}
                              </span>
                            </td>
                          </tr>
                        ));
                    } catch (err) {
                      console.error("Error processing top products:", err);
                      return (
                        <tr>
                          <td colSpan="4" className="text-center text-muted">
                            Error displaying top products
                          </td>
                        </tr>
                      );
                    }
                  })()}
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