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
  const [authError, setAuthError] = useState(false);

  // Function to refresh token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      const response = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      
      localStorage.setItem("accessToken", response.data.accessToken);
      return response.data.accessToken;
    } catch (err) {
      console.error("Token refresh failed:", err);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setAuthError(true);
      return null;
    }
  };

  // Axios interceptor for handling token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const newToken = await refreshAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };
  };

  useEffect(() => {
    fetchAllReviews();
    fetchProducts();
  }, []);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      setError("");
      setAuthError(false);
      
      // First check if we have a token
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setAuthError(true);
        setError("Please log in to view reviews");
        setLoading(false);
        return;
      }

      // Try different possible endpoints if needed
      let endpoint = `${BASE_URL}/reviews`;
      
      // Try admin-specific endpoint first
      try {
        const res = await axios.get(`${BASE_URL}/admin/reviews`, getAuthHeaders());
        setReviews(Array.isArray(res.data) ? res.data : []);
      } catch (adminErr) {
        console.log("Admin endpoint failed, trying regular reviews...");
        
        // Try regular reviews endpoint
        try {
          const res = await axios.get(`${BASE_URL}/reviews`, getAuthHeaders());
          const data = res.data;
          
          // Handle different response formats
          if (Array.isArray(data)) {
            setReviews(data);
          } else if (data && Array.isArray(data.reviews)) {
            setReviews(data.reviews);
          } else if (data && data.data && Array.isArray(data.data)) {
            setReviews(data.data);
          } else {
            setReviews([]);
          }
        } catch (regularErr) {
          // If all endpoints fail, show appropriate error
          if (regularErr.response?.status === 401) {
            setAuthError(true);
            setError("Authentication failed. Please log in again.");
          } else {
            setError("Failed to load reviews. Please try again.");
          }
          setReviews([]);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      if (err.response?.status === 401) {
        setAuthError(true);
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to load reviews. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;

      let res;
      // Try different product endpoints
      try {
        res = await axios.get(`${BASE_URL}/products`, getAuthHeaders());
      } catch (err) {
        // Try public endpoint if authenticated fails
        res = await axios.get(`${BASE_URL}/products/public`);
      }
      
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
      // Don't fail the whole component if products fail
      setProducts([]);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        alert("Please log in to delete reviews");
        return;
      }

      // Try different delete endpoints
      let success = false;
      const endpoints = [
        `${BASE_URL}/admin/reviews/${reviewId}`,
        `${BASE_URL}/reviews/admin/${reviewId}`,
        `${BASE_URL}/reviews/${reviewId}`
      ];

      for (const endpoint of endpoints) {
        try {
          await axios.delete(endpoint, getAuthHeaders());
          success = true;
          break;
        } catch (err) {
          console.log(`Delete failed on ${endpoint}:`, err.message);
          continue;
        }
      }

      if (success) {
        // Remove from state
        setReviews(prev => prev.filter(review => review.id !== reviewId));
        alert("Review deleted successfully");
      } else {
        alert("Failed to delete review. You may not have permission.");
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
      } else {
        alert("Failed to delete review. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const numericRating = Number(rating) || 0;
    return (
      <div className="d-flex align-items-center">
        {[...Array(5)].map((_, i) => (
          <i
            key={i}
            className={`bi ${
              i < numericRating ? 'bi-star-fill text-warning' : 'bi-star text-muted'
            } me-1`}
          ></i>
        ))}
        <span className="ms-2 fw-bold">{numericRating}/5</span>
      </div>
    );
  };

  const getSafeValue = (obj, path, defaultValue = "") => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }
    
    return result !== undefined ? result : defaultValue;
  };

  const filteredReviews = reviews.filter(review => {
    const reviewProductId = getSafeValue(review, 'product_id', '');
    const reviewRating = getSafeValue(review, 'rating', 0);
    
    if (selectedProduct !== "all" && reviewProductId != selectedProduct) return false;
    if (selectedRating !== "all" && reviewRating != selectedRating) return false;
    return true;
  });

  if (authError) {
    return (
      <div className="container-fluid p-3">
        <div className="card border-danger">
          <div className="card-body text-center py-5">
            <i className="bi bi-shield-exclamation display-1 text-danger mb-3"></i>
            <h4 className="fw-bold">Authentication Required</h4>
            <p className="text-muted mb-4">
              Please log in to access the reviews section.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-fluid p-3">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
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
          <button 
            className="btn btn-outline-primary" 
            onClick={fetchAllReviews}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {reviews.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary bg-opacity-10 border-primary border">
              <div className="card-body text-center">
                <h3 className="fw-bold text-primary">{reviews.length}</h3>
                <p className="small mb-0">Total Reviews</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success bg-opacity-10 border-success border">
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
            <div className="card bg-warning bg-opacity-10 border-warning border">
              <div className="card-body text-center">
                <h3 className="fw-bold text-warning">
                  {reviews.filter(r => (Number(r.rating) || 0) === 5).length}
                </h3>
                <p className="small mb-0">5-Star Reviews</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info bg-opacity-10 border-info border">
              <div className="card-body text-center">
                <h3 className="fw-bold text-info">
                  {new Set(reviews.map(r => r.customer_id || r.user_id || '')).size}
                </h3>
                <p className="small mb-0">Unique Customers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3 mb-md-0">
          <label className="form-label small fw-bold">Filter by Product</label>
          <select 
            className="form-select" 
            value={selectedProduct} 
            onChange={(e) => setSelectedProduct(e.target.value)}
            disabled={loading}
          >
            <option value="all">All Products</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name || product.title || `Product ${product.id}`}
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
            disabled={loading}
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
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Reviews Grid */}
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
                {reviews.length === 0 && (
                  <button 
                    className="btn btn-primary mt-2"
                    onClick={fetchAllReviews}
                  >
                    Check Again
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const customerName = getSafeValue(review, 'customer_name', 
                          getSafeValue(review, 'user_name', 'Customer'));
            const customerEmail = getSafeValue(review, 'customer_email', 
                           getSafeValue(review, 'user_email', ''));
            const productName = getSafeValue(review, 'product_name', 
                          getSafeValue(review, 'product.title', 'Product'));
            const productPrice = getSafeValue(review, 'product_price', 
                           getSafeValue(review, 'product.price', 0));
            const rating = Number(getSafeValue(review, 'rating', 0));
            const comment = getSafeValue(review, 'comment', 
                          getSafeValue(review, 'review_text', ''));
            const profilePic = getSafeValue(review, 'profile_pic', '');
            const createdAt = getSafeValue(review, 'created_at', 
                           getSafeValue(review, 'createdAt', new Date().toISOString()));

            return (
              <div key={review.id || review._id} className="col-lg-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center">
                        {profilePic ? (
                          <img 
                            src={`${BASE_URL}${profilePic.startsWith('/') ? '' : '/'}${profilePic}`}
                            className="rounded-circle me-3"
                            style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                            alt={customerName}
                            onError={(e) => {
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
                          {customerEmail && (
                            <small className="text-muted">{customerEmail}</small>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteReview(review.id || review._id)}
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
                          {productPrice > 0 && (
                            <small className="text-muted">KES {productPrice.toLocaleString()}</small>
                          )}
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
                        ID: {review.id || review._id}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Top Products Summary */}
      {reviews.length > 0 && (
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-trophy me-2"></i>
              Top Reviewed Products
            </h6>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
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
                      const productId = getSafeValue(review, 'product_id', 'unknown');
                      const productName = getSafeValue(review, 'product_name', 
                                        getSafeValue(review, 'product.name', `Product ${productId}`));
                      const rating = Number(getSafeValue(review, 'rating', 0));
                      
                      if (!acc[productId]) {
                        acc[productId] = {
                          name: productName,
                          reviews: [],
                          total: 0,
                          sum: 0,
                          fiveStar: 0
                        };
                      }
                      acc[productId].reviews.push(review);
                      acc[productId].total++;
                      acc[productId].sum += rating;
                      if (rating === 5) acc[productId].fiveStar++;
                      
                      return acc;
                    }, {})
                  )
                    .sort(([, a], [, b]) => b.total - a.total)
                    .slice(0, 5)
                    .map(([productId, data]) => (
                      <tr key={productId}>
                        <td className="fw-bold">{data.name}</td>
                        <td>
                          <span className="badge bg-primary">{data.total}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-2">
                              {(data.sum / data.total).toFixed(1)}
                            </span>
                            {renderStars(Math.round(data.sum / data.total))}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-warning">
                            {data.fiveStar}
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