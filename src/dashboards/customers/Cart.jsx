import React, { useEffect, useState } from "react";
// EDITED: Use axiosPrivate for authenticated requests
import { axiosPrivate } from "../../api/axios";
import CartCard from "../../products/cartCard";
import { Link, useNavigate } from "react-router-dom";
import MpesaPayment from "./MpesaPayment";
import { BASE_URL } from "../../tokens/BASE_URL";

function Cart({ updateCartCount, customerPhone }) {
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const [navigateToProducts, setNavigateToProducts] = useState(false);

  // Voucher state
  const [promoCode, setPromoCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    const shipping = subtotal > 1000 ? 0 : 150; // Free shipping over 1000
    const tax = subtotal * 0.16; // 16% VAT
    const totalItems = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalBeforeDiscount = subtotal + shipping + tax;
    const total = Math.max(0, totalBeforeDiscount - discount);

    return { subtotal, shipping, tax, total, totalItems, discount };
  };

  const { subtotal, shipping, tax, total, totalItems } = calculateTotals();

  useEffect(() => {
    async function fetchCart() {
      try {
        setLoading(true);
        // EDITED: use axiosPrivate, remove headers (interceptor handles it)
        const res = await axiosPrivate.get(`/cart`);
        setCartItems(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load cart items");
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, []);

  async function handleUpdateQuantity(id, quantity) {
    try {
      setUpdatingId(id);
      // EDITED: use axiosPrivate
      await axiosPrivate.put(
        `/cart/${id}`,
        { quantity }
      );
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
      if (updateCartCount) updateCartCount();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  }
  function handleNavigate() {
    navigate("/products");
  }

  async function handleDelete(id) {
    try {
      setDeletingId(id);
      // EDITED: use axiosPrivate
      await axiosPrivate.delete(`/cart/${id}`);
      setCartItems((prev) => prev.filter((item) => item.id !== id));
      if (updateCartCount) updateCartCount();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  }

  const clearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cart?")) return;

    try {
      setLoading(true);
      // EDITED: use axiosPrivate
      await axiosPrivate.delete(`/cart/clear`);
      setCartItems([]);
      if (updateCartCount) updateCartCount();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };


  const [checkoutOrder, setCheckoutOrder] = useState(null);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    try {
      setLoading(true);
      // EDITED: use axiosPrivate
      const res = await axiosPrivate.post(`/checkout`, {
        voucherCode: appliedVoucher?.code
      });

      // Instead of alert, we set the order details to show the M-Pesa payment UI
      setCheckoutOrder({
        id: res.data.order_id,
        total: res.data.total
      });

      // We don't clear cart items here yet, we wait for payment or we can clear them 
      // since the order is "pending" in the DB now. 
      // Actually, checkout in backend ALREADY clears the cart. 
      setCartItems([]);
      if (updateCartCount) updateCartCount();
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!promoCode) return;
    try {
      setLoading(true);
      setVoucherError("");
      setVoucherSuccess("");

      console.log("Applying voucher:", promoCode, "for subtotal:", subtotal);

      // EDITED: use axiosPrivate
      const res = await axiosPrivate.post(`/vouchers/validate`, {
        code: promoCode.trim(),
        cartTotal: subtotal
      });

      console.log("Voucher apply response:", res.data);

      setAppliedVoucher(res.data.voucher);
      setDiscount(res.data.discount);
      setVoucherSuccess(res.data.message || "Voucher applied!");
    } catch (err) {
      console.error("Voucher apply error:", err);
      setVoucherError(err.response?.data?.message || "Failed to apply voucher");
    } finally {
      setLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setPromoCode("");
    setVoucherError("");
    setVoucherSuccess("");
  };

  return (
    <div className="container py-4">
      {/* M-Pesa Payment Overlay */}
      {checkoutOrder && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div style={{ width: "100%", maxWidth: "500px", padding: "20px" }}>
            <MpesaPayment
              orderId={checkoutOrder.id}
              total={checkoutOrder.total}
              defaultPhone={customerPhone}
              onPaymentSuccess={() => {
                setCheckoutOrder(null);
                // The order count will update automatically via callback polling in component
              }}
              onCancel={() => setCheckoutOrder(null)}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-1">Shopping Cart</h2>
          <p className="text-muted mb-0">
            {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>
        <div>
          <Link to="/customer/dashboard" className="btn btn-outline-primary me-2">
            <i className="bi bi-arrow-left me-1"></i> Continue Shopping
          </Link>
          {cartItems.length > 0 && (
            <button className="btn btn-outline-danger" onClick={clearCart} disabled={loading}>
              <i className="bi bi-trash me-1"></i> Clear Cart
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {/* Loading State */}
      {loading && cartItems.length === 0 && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading your cart...</p>
        </div>
      )}

      {cartItems.length === 0 && !loading ? (
        /* Empty Cart State */
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div className="mb-4">
              <i className="bi bi-cart-x display-1 text-muted"></i>
            </div>
            <h3 className="h4 fw-bold text-primary mb-3">Your cart is empty</h3>
            <p className="text-muted mb-4">
              Looks like you haven't added any products to your cart yet.
            </p>
            <button className="btn btn-primary btn-lg">
              <i className="bi bi-bag me-2"></i> Start Shopping
            </button>
          </div>
        </div>
      ) : (
        <div className="row">
          {/* Cart Items */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="fw-bold mb-0">Cart Items</h5>
              </div>
              <div className="card-body p-0">
                {cartItems.map((item) => (
                  <CartCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onDelete={handleDelete}
                    isUpdating={updatingId === item.id}
                    isDeleting={deletingId === item.id}
                  />
                ))}
              </div>
            </div>

            {/* Shipping Notice */}
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <i className="bi bi-truck fs-4 me-3"></i>
                <div>
                  <h6 className="fw-bold mb-1">Free Shipping Available!</h6>
                  <p className="mb-0">
                    Get free shipping on orders over KES 1,000.
                    {subtotal < 1000 && (
                      <span className="fw-bold">
                        {" "}Add KES {(1000 - subtotal).toFixed(2)} more to qualify!
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: "20px" }}>
              <div className="card-header bg-white py-3">
                <h5 className="fw-bold mb-0">Order Summary</h5>
              </div>
              <div className="card-body">
                {/* Summary Items */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Subtotal</span>
                    <span className="fw-semibold">KES {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Shipping</span>
                    <span className={`fw-semibold ${shipping === 0 ? 'text-success' : ''}`}>
                      {shipping === 0 ? 'FREE' : `KES ${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Tax (16% VAT)</span>
                    <span className="fw-semibold">KES {tax.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success fw-semibold">
                      <span>Discount ({appliedVoucher?.code})</span>
                      <span>- KES {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="d-flex justify-content-between mb-3">
                    <span className="fw-bold">Total Amount</span>
                    <span className="fw-bold text-primary fs-5">KES {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  className="btn btn-primary btn-lg w-100 py-3 mb-3"
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                >
                  <i className="bi bi-lock-fill me-2"></i>
                  Proceed to Checkout
                </button>

                {/* Payment Methods */}
                <div className="text-center mb-3">
                  <small className="text-muted">We accept</small>
                  <div className="d-flex justify-content-center gap-2 mt-2">
                    <span className="bg-light rounded p-2">
                      <i className="bi bi-credit-card text-primary"></i>
                    </span>
                    <span className="bg-light rounded p-2">
                      <i className="bi bi-paypal text-primary"></i>
                    </span>
                    <span className="bg-light rounded p-2">
                      <i className="bi bi-bank text-primary"></i>
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="alert alert-light border mt-3">
                  <small>
                    <i className="bi bi-shield-check text-success me-1"></i>
                    <strong>Secure checkout</strong> - Your payment information is encrypted
                  </small>
                </div>

                <hr />

                {/* Promo Code - Moved inside for visibility */}
                <div className="mt-3">
                  <h6 className="fw-bold mb-3 small text-muted text-uppercase">Have a promo code?</h6>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={!!appliedVoucher}
                    />
                    <button
                      className={`btn ${appliedVoucher ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                      type="button"
                      onClick={appliedVoucher ? removeVoucher : handleApplyVoucher}
                      disabled={loading || !promoCode}
                    >
                      {loading && !appliedVoucher ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        appliedVoucher ? 'Remove' : 'Apply'
                      )}
                    </button>
                  </div>
                  {voucherError && (
                    <div className="mt-2 small text-danger">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>
                      {voucherError}
                    </div>
                  )}
                  {voucherSuccess && (
                    <div className="mt-2 small text-success">
                      <i className="bi bi-check-circle-fill me-1"></i>
                      {voucherSuccess}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;