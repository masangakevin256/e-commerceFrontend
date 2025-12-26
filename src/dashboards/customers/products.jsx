import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";

function Products({ showMessage, showError = () => { }, updateCartCount = () => { }, searchTerm = "", setSearchTerm = () => { } }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewProduct, setViewProduct] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [categories, setCategories] = useState([]);
    const [addingToCart, setAddingToCart] = useState(null);
    const [localSearch, setLocalSearch] = useState(searchTerm);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const [wishlistedIds, setWishlistedIds] = useState([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [productReviews, setProductReviews] = useState({});
    const [reviewStats, setReviewStats] = useState({});
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pageSize] = useState(100); // Load 100 products per page

    // Recently Viewed Logic
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
        setRecentlyViewed(saved);
    }, []);

    useEffect(() => {
        if (viewProduct) {
            let saved = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
            saved = saved.filter(id => id !== viewProduct);
            saved.unshift(viewProduct);
            saved = saved.slice(0, 5);
            localStorage.setItem("recentlyViewed", JSON.stringify(saved));
            setRecentlyViewed(saved);
            
            // Find and set selected product
            const product = products.find(p => p.id === viewProduct);
            setSelectedProduct(product);
        }
    }, [viewProduct, products]);

    // Sync local state with prop
    useEffect(() => {
        setLocalSearch(searchTerm || "");
    }, [searchTerm]);

    // Scroll handler
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollToTop(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Fetch products with pagination
    const fetchProducts = async (page = 1, append = false) => {
        try {
            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            
            const token = localStorage.getItem("accessToken");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Build query parameters
            const params = new URLSearchParams({
                page: page,
                limit: pageSize
            });

            // Add category filter if selected
            if (selectedCategory && selectedCategory !== "all") {
                params.append('category_id', selectedCategory);
            }

            // Add search term if provided
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            // Fetch products
            const [prodRes, wishRes] = await Promise.all([
                axios.get(`${BASE_URL}/products?${params}`, { headers }),
                token ? axios.get(`${BASE_URL}/wishlist/status`, { headers }) : Promise.resolve({ data: [] })
            ]);

            if (prodRes.data.success) {
                if (append) {
                    // Append new products to existing ones
                    setProducts(prev => [...prev, ...prodRes.data.products]);
                } else {
                    // Replace products with new ones
                    setProducts(prodRes.data.products);
                }
                
                // Update pagination info
                setCurrentPage(prodRes.data.pagination.currentPage);
                setTotalPages(prodRes.data.pagination.totalPages);
                setTotalProducts(prodRes.data.pagination.totalProducts);
                setHasNextPage(prodRes.data.pagination.hasNextPage);
                setHasPrevPage(prodRes.data.pagination.hasPrevPage);
                
                setWishlistedIds(wishRes.data || []);
                setError(null);

                // Extract categories from all products (you might want a separate categories endpoint)
                if (!append && prodRes.data.products.length > 0) {
                    const uniqueCategories = ["all", ...new Set(prodRes.data.products.map(p => p.category_name || "Uncategorized"))];
                    setCategories(uniqueCategories);
                }

                // Fetch review stats for loaded products
                fetchReviewStatsForProducts(prodRes.data.products);
            } else {
                throw new Error(prodRes.data.message || "Failed to load products");
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Failed to load products. Please try again.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Fetch review stats for products
    const fetchReviewStatsForProducts = async (productsList) => {
        const stats = {};
        const batchSize = 10; // Process in batches to avoid too many requests
        
        for (let i = 0; i < productsList.length; i += batchSize) {
            const batch = productsList.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (product) => {
                try {
                    const res = await axios.get(`${BASE_URL}/reviews/${product.id}`);
                    const reviews = res.data || [];
                    return {
                        id: product.id,
                        average: reviews.length > 0 ? 
                            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0",
                        count: reviews.length
                    };
                } catch (err) {
                    return {
                        id: product.id,
                        average: "0.0",
                        count: 0
                    };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(result => {
                stats[result.id] = { average: result.average, count: result.count };
            });
            
            // Update state after each batch
            setReviewStats(prev => ({ ...prev, ...stats }));
            
            // Small delay between batches to avoid overwhelming the server
            if (i + batchSize < productsList.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    };

    // Load more products
    const loadMoreProducts = () => {
        if (hasNextPage && !loadingMore) {
            fetchProducts(currentPage + 1, true);
        }
    };

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            fetchProducts(page, false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Fetch reviews for specific product
    const fetchProductReviews = async (productId) => {
        try {
            const token = localStorage.getItem("accessToken");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`${BASE_URL}/reviews/${productId}`, { headers });
            setProductReviews(prev => ({
                ...prev,
                [productId]: res.data || []
            }));
            return res.data || [];
        } catch (err) {
            console.error("Error fetching reviews:", err);
            return [];
        }
    };

    // Toggle wishlist
    const toggleWishlist = async (productId) => {
        if (wishlistLoading) return;
        
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showError("Please login to manage wishlist");
            return;
        }

        try {
            setWishlistLoading(true);
            const isWishlisted = wishlistedIds.includes(productId);
            
            if (isWishlisted) {
                await axios.delete(`${BASE_URL}/wishlist/${productId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWishlistedIds(prev => prev.filter(id => id !== productId));
            } else {
                await axios.post(`${BASE_URL}/wishlist`, { product_id: productId }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWishlistedIds(prev => [...prev, productId]);
            }
        } catch (err) {
            console.error("Wishlist error:", err);
            showError("Failed to update wishlist");
        } finally {
            setWishlistLoading(false);
        }
    };

    // Handle search change with debounce
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setLocalSearch(value);
        if (setSearchTerm) setSearchTerm(value);
    };

    // Add to cart
    const addToCart = async (id, productName) => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showError("Please login to add items to cart");
            return;
        }

        try {
            setAddingToCart(id);
            await axios.post(`${BASE_URL}/cart`, {
                product_id: id,
                quantity: 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showMessage(`${productName} added to cart!`);
            if (updateCartCount) updateCartCount();
        } catch (error) {
            console.error("Error adding to cart:", error);
            showError(error.response?.data?.message || "Failed to add to cart");
        } finally {
            setAddingToCart(null);
        }
    };

    // Render stars
    const renderStars = (rating) => {
        return (
            <div className="d-flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <i
                        key={star}
                        className={`bi ${star <= Math.round(rating || 0) ? 'bi-star-fill text-warning' : 'bi-star text-muted'} me-1`}
                        style={{ fontSize: "12px" }}
                    ></i>
                ))}
                <small className="ms-1 fw-bold">{parseFloat(rating || 0).toFixed(1)}</small>
            </div>
        );
    };

    // Initial fetch
    useEffect(() => {
        fetchProducts();
    }, []);

    // Refetch when filters change
    useEffect(() => {
        if (!loading) {
            fetchProducts(1, false);
        }
    }, [selectedCategory, searchTerm]);

    // Product Detail View
    if (viewProduct && selectedProduct) {
        return (
            <div className="container py-4">
                <button className="btn btn-outline-secondary mb-4" onClick={() => setViewProduct(null)}>
                    <i className="bi bi-arrow-left me-2"></i> Back to Products
                </button>

                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        {/* Product Details */}
                        <div className="card shadow border-0 overflow-hidden mb-4">
                            <div className="row g-0">
                                <div className="col-md-6 bg-light d-flex align-items-center justify-content-center p-4">
                                    <div className="position-relative" style={{ maxWidth: "500px" }}>
                                        <img
                                            src={selectedProduct.image || "/product.jpg"}
                                            className="img-fluid rounded"
                                            alt={selectedProduct.name}
                                            style={{ maxHeight: "400px", objectFit: "contain" }}
                                        />
                                        {selectedProduct.discount && (
                                            <span className="position-absolute top-0 start-0 badge bg-danger fs-6 m-2">
                                                -{selectedProduct.discount}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card-body p-4 p-lg-5">
                                        <div className="mb-3">
                                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                                                {selectedProduct.category_name || "Uncategorized"}
                                            </span>
                                            <span className={`badge ${selectedProduct.stock > 0 ? 'bg-success' : 'bg-danger'} ms-2`}>
                                                {selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </div>

                                        <h1 className="card-title fw-bold mb-3">{selectedProduct.name}</h1>

                                        <div className="mb-4">
                                            <h2 className="text-primary fw-bold">
                                                KES {Number(selectedProduct.price).toFixed(2)}
                                                {selectedProduct.originalPrice && (
                                                    <small className="text-muted text-decoration-line-through ms-2 fs-6">
                                                        KES {Number(selectedProduct.originalPrice).toFixed(2)}
                                                    </small>
                                                )}
                                            </h2>
                                            {/* Rating display */}
                                            <div className="d-flex align-items-center mt-2">
                                                {renderStars(reviewStats[selectedProduct.id]?.average || 0)}
                                                <small className="text-muted ms-2">
                                                    ({reviewStats[selectedProduct.id]?.count || 0} reviews)
                                                </small>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h5 className="fw-bold mb-2">Description</h5>
                                            <p className="text-muted" style={{ lineHeight: "1.6" }}>
                                                {selectedProduct.description || "No description available."}
                                            </p>
                                        </div>

                                        <div className="d-flex gap-3 mb-4">
                                            <button
                                                className="btn btn-primary btn-lg px-5 flex-grow-1"
                                                onClick={() => addToCart(selectedProduct.id, selectedProduct.name)}
                                                disabled={selectedProduct.stock <= 0 || addingToCart === selectedProduct.id}
                                            >
                                                {addingToCart === selectedProduct.id ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-cart-plus me-2"></i>
                                                        Add to Cart
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className={`btn btn-lg ${wishlistedIds.includes(selectedProduct.id) ? 'btn-danger' : 'btn-outline-danger'}`}
                                                onClick={() => toggleWishlist(selectedProduct.id)}
                                                disabled={wishlistLoading}
                                            >
                                                <i className={`bi bi-heart${wishlistedIds.includes(selectedProduct.id) ? '-fill' : ''}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <ReviewsTab productId={selectedProduct.id} showMessage={showMessage} showError={showError} />
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading && products.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-50">
                <div className="text-center">
                    <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 fs-5 text-muted">Loading products...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && products.length === 0) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                        <div>
                            <h5 className="alert-heading">Unable to Load Products</h5>
                            <p className="mb-0">{error}</p>
                        </div>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    <div className="mt-3">
                        <button className="btn btn-outline-primary" onClick={() => fetchProducts(1)}>
                            <i className="bi bi-arrow-clockwise me-2"></i> Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No results
    if (products.length === 0 && !loading) {
        return (
            <div className="container py-5">
                <div className="text-center py-5">
                    <i className="bi bi-search display-1 text-muted mb-4"></i>
                    <h3 className="fw-bold text-primary mb-3">No products found</h3>
                    <p className="text-muted fs-5 mb-4">
                        {searchTerm || selectedCategory !== "all"
                            ? "Try adjusting your search or filter criteria."
                            : "No products are currently available. Check back later!"
                        }
                    </p>
                    {(searchTerm || selectedCategory !== "all") && (
                        <button className="btn btn-primary" onClick={() => {
                            if (setSearchTerm) setSearchTerm("");
                            setSelectedCategory("all");
                        }}>
                            <i className="bi bi-x-circle me-2"></i> Clear Filters
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Group products by category for current page
    const groupedProducts = products.reduce((groups, product) => {
        const category = product.category_name || "Uncategorized";
        if (!groups[category]) groups[category] = [];
        groups[category].push(product);
        return groups;
    }, {});

    return (
        <div className="container-fluid py-3 px-4">
            {/* Header */}
            <div className="row mb-3 align-items-center">
                <div className="col-md-6">
                    <h1 className="fw-bold text-primary h3 mb-0">
                        <i className="bi bi-grid-3x3-gap me-2"></i> Products
                    </h1>
                    <p className="text-muted small mb-0 mt-1">
                        Showing {products.length} of {totalProducts} products (Page {currentPage} of {totalPages})
                    </p>
                </div>
                <div className="col-md-6">
                    <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white text-muted border-end-0">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search products..."
                            value={localSearch}
                            onChange={handleSearchChange}
                        />
                        {searchTerm && (
                            <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearchTerm("")}>
                                <i className="bi bi-x"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-3">
                <div className="d-flex flex-wrap gap-1">
                    {categories.map(category => (
                        <button
                            key={category}
                            className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-outline-primary'} rounded-pill px-3 py-1`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category === "all" ? "All" : category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                <div key={category} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h4 className="fw-bold text-primary h5 mb-0">
                            <i className="bi bi-tag me-1"></i> {category}
                        </h4>
                        <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-1">
                            {categoryProducts.length} items
                        </span>
                    </div>

                    <div className="row g-3">
                        {categoryProducts.map(product => (
                            <div className="col-xxl-2 col-xl-3 col-lg-4 col-md-4 col-sm-6" key={product.id}>
                                <div className="card h-100 border shadow-sm hover-shadow transition">
                                    <div className="card-body p-3 d-flex flex-column">
                                        {/* Product Image */}
                                        <div className="text-center mb-3 position-relative" style={{ height: "140px" }}>
                                            <img
                                                src={product.image || "/product.jpg"}
                                                className="img-fluid h-100"
                                                alt={product.name}
                                                style={{ objectFit: "cover", maxWidth: "100%" }}
                                            />
                                            <button
                                                className={`btn btn-sm rounded-circle position-absolute top-0 start-0 m-2 shadow-sm ${wishlistedIds.includes(product.id) ? 'btn-danger' : 'btn-light'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(product.id);
                                                }}
                                                disabled={wishlistLoading}
                                            >
                                                <i className={`bi bi-heart${wishlistedIds.includes(product.id) ? '-fill' : ''}`}></i>
                                            </button>
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-grow-1">
                                            <h6 className="card-title fw-bold mb-2 text-truncate">{product.name}</h6>
                                            
                                            {/* Rating */}
                                            <div className="mb-2">
                                                {renderStars(reviewStats[product.id]?.average || 0)}
                                                <small className="text-muted ms-2">
                                                    ({reviewStats[product.id]?.count || 0})
                                                </small>
                                            </div>

                                            {/* Stock Status */}
                                            <div className="mb-2">
                                                <small className={`fw-semibold ${product.stock > 10 ? 'text-success' : product.stock > 0 ? 'text-warning' : 'text-danger'}`}>
                                                    {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
                                                </small>
                                            </div>

                                            {/* Price */}
                                            <div className="mb-3">
                                                <h6 className="text-primary fw-bold mb-0">KES {Number(product.price).toFixed(2)}</h6>
                                                {product.originalPrice && (
                                                    <small className="text-muted text-decoration-line-through">
                                                        KES {Number(product.originalPrice).toFixed(2)}
                                                    </small>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-primary btn-sm flex-grow-1"
                                                onClick={() => addToCart(product.id, product.name)}
                                                disabled={product.stock <= 0 || addingToCart === product.id}
                                            >
                                                {addingToCart === product.id ? (
                                                    <span className="spinner-border spinner-border-sm"></span>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-cart-plus me-1"></i> Add
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => setViewProduct(product.id)}
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Pagination Controls */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <small className="text-muted">
                                Page {currentPage} of {totalPages} • {totalProducts} total products
                            </small>
                        </div>
                        
                        <div className="d-flex gap-2">
                            {/* Previous Page Button */}
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={!hasPrevPage || loadingMore}
                            >
                                <i className="bi bi-chevron-left"></i> Previous
                            </button>
                            
                            {/* Page Numbers */}
                            <div className="btn-group">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => handlePageChange(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {/* Next Page Button */}
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!hasNextPage || loadingMore}
                            >
                                Next <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Load More Button (Alternative to pagination) */}
            {hasNextPage && (
                <div className="text-center mt-4">
                    <button
                        className="btn btn-primary"
                        onClick={loadMoreProducts}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Loading More Products...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-plus-circle me-2"></i>
                                Load More Products ({totalProducts - products.length} remaining)
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Loading More Indicator */}
            {loadingMore && (
                <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading more products...</span>
                    </div>
                    <p className="text-muted mt-2">Loading more products...</p>
                </div>
            )}

            {/* Scroll to Top */}
            {showScrollToTop && (
                <button className="btn btn-primary rounded-circle position-fixed shadow-lg" onClick={scrollToTop}
                    style={{ bottom: "30px", right: "30px", width: "50px", height: "50px", zIndex: 1000 }}>
                    <i className="bi bi-arrow-up fs-4"></i>
                </button>
            )}
        </div>
    );
}

// Reviews Tab Component (unchanged from your original code)
function ReviewsTab({ productId, showMessage, showError }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [userReview, setUserReview] = useState(null);

    useEffect(() => {
        fetchReviews();
        checkUserReview();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("accessToken");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`${BASE_URL}/reviews/${productId}`, { headers });
            setReviews(res.data || []);
        } catch (err) {
            console.error("Error fetching reviews:", err);
            showError("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    const checkUserReview = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        try {
            // Get current user ID from token
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.userInfo?.customer_id || payload.customer_id;
            
            // Find user's review
            const res = await axios.get(`${BASE_URL}/reviews/${productId}`);
            const userRev = res.data.find(r => r.customer_id === userId);
            
            if (userRev) {
                setUserReview(userRev);
                setRating(userRev.rating);
                setComment(userRev.comment || "");
            }
        } catch (err) {
            console.error("Error checking user review:", err);
        }
    };

    const submitReview = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showError("Please login to submit a review");
            return;
        }

        if (rating === 0) {
            showError("Please select a rating");
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`${BASE_URL}/reviews`, {
                productId: productId,
                rating: rating,
                comment: comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showMessage(userReview ? "Review updated!" : "Review submitted!");
            fetchReviews(); // Refresh reviews
            checkUserReview(); // Check for user's review
            if (!userReview) {
                setRating(0);
                setComment("");
            }
        } catch (err) {
            console.error("Error submitting review:", err);
            showError(err.response?.data?.message || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteReview = async (reviewId) => {
        if (!window.confirm("Delete this review?")) return;

        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_URL}/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            showMessage("Review deleted");
            fetchReviews();
            if (userReview?.id === reviewId) {
                setUserReview(null);
                setRating(0);
                setComment("");
            }
        } catch (err) {
            console.error("Error deleting review:", err);
            showError("Failed to delete review");
        }
    };

    const renderStars = (ratingValue, interactive = false, onClick = null) => (
        <div className="d-flex">
            {[1, 2, 3, 4, 5].map(star => (
                interactive ? (
                    <button key={star} className="btn p-0" onClick={() => onClick(star)}>
                        <i className={`bi ${star <= ratingValue ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-4`}></i>
                    </button>
                ) : (
                    <i key={star} className={`bi ${star <= ratingValue ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}></i>
                )
            ))}
        </div>
    );

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-body">
                <h4 className="fw-bold mb-4">Customer Reviews</h4>

                {/* Review Stats */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="text-center p-3 bg-light rounded">
                            <h2 className="fw-bold text-primary">{averageRating}</h2>
                            {renderStars(parseFloat(averageRating))}
                            <p className="text-muted mb-0">{reviews.length} reviews</p>
                        </div>
                    </div>
                    <div className="col-md-8">
                        <h6 className="fw-bold mb-3">Rating Distribution</h6>
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = reviews.filter(r => r.rating === star).length;
                            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            return (
                                <div key={star} className="d-flex align-items-center mb-2">
                                    <small className="me-2" style={{ width: "30px" }}>{star} ★</small>
                                    <div className="progress flex-grow-1" style={{ height: "8px" }}>
                                        <div className="progress-bar bg-warning" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <small className="text-muted ms-2" style={{ width: "40px" }}>{count}</small>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Add Review Form */}
                <div className="card border mb-4">
                    <div className="card-body">
                        <h5 className="fw-bold mb-3">{userReview ? "Update Your Review" : "Write a Review"}</h5>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Rating</label>
                            <div className="d-flex align-items-center">
                                {renderStars(rating, true, setRating)}
                                <span className="ms-2 fw-bold">{rating}/5</span>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Comment</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience..."
                            ></textarea>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={submitReview}
                            disabled={submitting || rating === 0}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Submitting...
                                </>
                            ) : userReview ? (
                                "Update Review"
                            ) : (
                                "Submit Review"
                            )}
                        </button>
                    </div>
                </div>

                {/* Reviews List */}
                <h5 className="fw-bold mb-3">All Reviews ({reviews.length})</h5>
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary"></div>
                        <p className="mt-2 text-muted">Loading reviews...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-4">
                        <i className="bi bi-chat-heart display-1 text-muted mb-3"></i>
                        <p className="text-muted">No reviews yet. Be the first to review!</p>
                    </div>
                ) : (
                    <div className="row">
                        {reviews.map(review => (
                            <div key={review.id} className="col-12 mb-3">
                                <div className="card border-0 bg-light">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="d-flex align-items-center">
                                                {review.profile_pic ? (
                                                    <img 
                                                        src={`${BASE_URL}/uploads/profiles/${review.profile_pic}`}
                                                        className="rounded-circle me-3"
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                        alt={review.customer_name}
                                                    />
                                                ) : (
                                                    <div className="rounded-circle bg-white d-flex align-items-center justify-content-center me-3"
                                                        style={{ width: '40px', height: '40px' }}>
                                                        <i className="bi bi-person text-muted"></i>
                                                    </div>
                                                )}
                                                <div>
                                                    <h6 className="fw-bold mb-0">{review.customer_name}</h6>
                                                    <div className="d-flex align-items-center">
                                                        {renderStars(review.rating)}
                                                        <small className="text-muted ms-2">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                            {userReview?.id === review.id && (
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => deleteReview(review.id)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                        <p className="mb-0">{review.comment || "No comment provided"}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Products;