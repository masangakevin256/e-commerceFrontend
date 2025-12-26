import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductCard from "../../products/product-card";
import { BASE_URL } from "../../tokens/BASE_URL";
function Wishlist({ updateCartCount, showMessage, showError }) {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewProduct, setViewProduct] = useState(null);
    const [addingToCart, setAddingToCart] = useState(null);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${BASE_URL}/wishlist`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            setWishlistItems(res.data || []);
            setError("");
        } catch (err) {
            console.error("Error fetching wishlist:", err);
            setError("Failed to load wishlist. Please try again later.");
            if (showError) showError("Failed to load wishlist.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (productId) => {
        try {
            await axios.delete(`${BASE_URL}/wishlist/${productId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            setWishlistItems(prev => prev.filter(item => item.id !== productId));
            if (showMessage) {
                showMessage("Item removed from wishlist.");
            }
        } catch (err) {
            console.error("Error removing from wishlist:", err);
            if (showError) {
                showError("Failed to remove item from wishlist.");
            }
        }
    };

    const handleAddToCart = async (id, productName) => {
        try {
            setAddingToCart(id);
            await axios.post(`${BASE_URL}/cart`, {
                product_id: id,
                quantity: 1
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });

            if (showMessage) {
                showMessage(`${productName} added to cart!`);
            }
            if (updateCartCount) updateCartCount();
        } catch (err) {
            console.error("Error adding to cart:", err);
            if (showError) {
                showError(err.response?.data?.message || "Failed to add product to cart.");
            }
        } finally {
            setAddingToCart(null);
        }
    };

    if (loading && wishlistItems.length === 0) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading your wishlist...</p>
            </div>
        );
    }

    if (viewProduct) {
        const item = wishlistItems.find(p => p.id === viewProduct);
        return (
            <div className="container py-4">
                <button
                    className="btn btn-outline-secondary mb-4"
                    onClick={() => setViewProduct(null)}
                >
                    <i className="bi bi-arrow-left me-2"></i> Back to Wishlist
                </button>

                {item ? (
                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <div className="card shadow border-0 overflow-hidden">
                                <div className="row g-0">
                                    <div className="col-md-6 bg-light d-flex align-items-center justify-content-center p-4">
                                        <div className="position-relative" style={{ maxWidth: "500px" }}>
                                            <img
                                                src={item.image || "/product.jpg"}
                                                className="img-fluid rounded"
                                                alt={item.name}
                                                style={{ maxHeight: "400px", objectFit: "contain" }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card-body p-4 p-lg-5">
                                            <div className="mb-3">
                                                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                                                    {item.category_name || "Uncategorized"}
                                                </span>
                                            </div>
                                            <h1 className="card-title fw-bold mb-3">{item.name}</h1>
                                            <h2 className="text-primary fw-bold mb-4">KES {Number(item.price).toFixed(2)}</h2>
                                            <p className="text-muted mb-4">{item.description}</p>
                                            <div className="d-flex gap-3">
                                                <button
                                                    className="btn btn-primary btn-lg px-5 flex-grow-1"
                                                    onClick={() => handleAddToCart(item.id, item.name)}
                                                    disabled={item.stock <= 0 || addingToCart === item.id}
                                                >
                                                    {addingToCart === item.id ? "Adding..." : "Add to Cart"}
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger btn-lg"
                                                    onClick={() => handleRemoveFromWishlist(item.id)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="alert alert-warning">Product details not available.</div>
                )}
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 fw-bold text-primary">My Wishlist</h1>
                <span className="badge bg-primary rounded-pill fs-6">
                    {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
                </span>
            </div>

            {wishlistItems.length === 0 ? (
                <div className="card shadow-sm border-0 text-center py-5">
                    <div className="card-body">
                        <i className="bi bi-heart display-1 text-muted mb-3"></i>
                        <h3>Your wishlist is empty</h3>
                        <p className="text-muted">Save items you like to see them here.</p>
                    </div>
                </div>
            ) : (
                <div className="row g-4">
                    {wishlistItems.map((product) => (
                        <div key={product.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                            <ProductCard
                                product={product}
                                updateCartCount={updateCartCount}
                                onAddToCart={() => handleAddToCart(product.id, product.name)}
                                onViewProduct={() => setViewProduct(product.id)}
                                onWishlistToggle={() => handleRemoveFromWishlist(product.id)}
                                isInitiallyWishlisted={true}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Wishlist;
