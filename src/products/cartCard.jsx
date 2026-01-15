import React, { useState } from "react";
import productImg from "../assets/product.jpg";

function CartCard({ item, onUpdateQuantity, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate total price for this item
  const totalPrice = (Number(item.price) || 0) * (Number(item.quantity) || 1);

  // Format price safely
  const formatPrice = (price) => {
    if (price === undefined || price === null) return "0";
    const numPrice = Number(price);
    return isNaN(numPrice) ? "0" : numPrice.toFixed(2);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    // Add a small delay for visual feedback
    setTimeout(() => {
      onDelete(item.id);
    }, 300);
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  return (
    <div className="col-lg-12 mb-3">
      <div className={`card border-0 shadow-sm ${isDeleting ? 'opacity-50' : ''}`}>
        <div className="card-body p-3">
          <div className="row align-items-center">
            {/* Product Image */}
            <div className="col-md-2 col-4">
              <div className="position-relative">
                <img
                  src={item.image || productImg}
                  className="img-fluid rounded"
                  alt={item.name || "Product"}
                  style={{ height: "120px", width: "100%", objectFit: "cover" }}
                />
                <div className="position-absolute top-0 start-0 bg-primary text-white rounded-circle px-2 py-1 m-1">
                  <small className="fw-bold">{item.quantity || 1}</small>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="col-md-5 col-8">
              <h6 className="card-title fw-bold mb-1 text-truncate">
                {item.name || "Product Name"}
              </h6>
              <p className="text-muted small mb-1">
                <i className="bi bi-tag me-1"></i> ID: {item.id || "N/A"}
              </p>
              <p className="mb-0">
                <span className="badge bg-light text-dark border">
                  <i className="bi bi-currency-exchange me-1"></i>
                  KES {formatPrice(item.price)} each
                </span>
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="col-md-3 col-12 mt-md-0 mt-2">
              <div className="d-flex align-items-center justify-content-center">
                <button
                  className="btn btn-outline-secondary btn-sm rounded-circle"
                  onClick={handleDecrease}
                  disabled={item.quantity <= 1}
                  style={{ width: "32px", height: "32px" }}
                >
                  <i className="bi bi-dash"></i>
                </button>

                <div className="mx-3">
                  <div className="text-center">
                    <span className="fw-bold fs-5">{item.quantity || 1}</span>
                  </div>
                  <div className="text-center">
                    <small className="text-muted">Quantity</small>
                  </div>
                </div>

                <button
                  className="btn btn-outline-secondary btn-sm rounded-circle"
                  onClick={handleIncrease}
                  style={{ width: "32px", height: "32px" }}
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
            </div>

            {/* Price & Actions */}
            <div className="col-md-2 col-12 mt-md-0 mt-3">
              <div className="text-end">
                {/* Total Price */}
                <div className="mb-2">
                  <h5 className="text-primary fw-bold mb-0">KES {formatPrice(totalPrice)}</h5>
                  <small className="text-muted">Total</small>
                </div>

                {/* Actions */}
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-outline-danger btn-sm d-flex align-items-center"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Removing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-1"></i> Remove
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card-footer bg-light py-2">
          <div className="row align-items-center">
            <div className="col-md-8 col-12">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Subtotal: <strong className="text-dark">KES {formatPrice(totalPrice)}</strong>
                {item.discount && (
                  <span className="ms-2 badge bg-success">
                    <i className="bi bi-percent me-1"></i> Saved {item.discount}%
                  </span>
                )}
              </small>
            </div>
            <div className="col-md-4 col-12 text-md-end">
              <small className="text-success">
                <i className="bi bi-check-circle me-1"></i>
                In Stock
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartCard;