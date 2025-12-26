import React from "react";
import productImg from "../../public/product.jpg";

import axios from "axios";

function ProductCard({ product, onAddToCart, onViewProduct, onWishlistToggle, isInitiallyWishlisted }) {
  const [isWishlisted, setIsWishlisted] = React.useState(isInitiallyWishlisted || false);
  const [wishlistLoading, setWishlistLoading] = React.useState(false);
  // Format price safely
  const formatPrice = (price) => {
    if (price === undefined || price === null) return "N/A";
    const numPrice = Number(price);
    if (isNaN(numPrice)) return "Invalid";
    return `$${numPrice.toFixed(2)}`;
  };

  // Format stock safely
  const getStock = () => {
    if (product.stock === undefined || product.stock === null) return 0;
    const stockNum = Number(product.stock);
    return isNaN(stockNum) ? 0 : stockNum;
  };

  const stock = getStock();
  const isLowStock = stock > 0 && stock <= 5;
  const isOutOfStock = stock === 0;

  const handleWishlistClick = async (e) => {
    e.stopPropagation();
    if (wishlistLoading) return;

    try {
      setWishlistLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        alert("Please login to manage your wishlist");
        return;
      }

      if (isWishlisted) {
        await axios.delete(`http://localhost:3500/wishlist/${product.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setIsWishlisted(false);
      } else {
        await axios.post("http://localhost:3500/wishlist", { product_id: product.id }, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setIsWishlisted(true);
      }

      if (onWishlistToggle) onWishlistToggle(!isWishlisted);

    } catch (err) {
      console.error("Wishlist error:", err);
      // alert("Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="col col-md-4 col-sm-6 col-12 mb-4">
      <div className="card h-100 shadow-sm border-0 hover-shadow">
        {/* Product image with overlay effects */}
        <div className="position-relative overflow-hidden rounded-top">
          <img
            src={productImg}
            className="card-img-top product-image"
            alt={product.name || "Product image"}
            style={{ height: "200px", objectFit: "cover" }}
          />

          {/* Stock badge */}
          {isLowStock && (
            <span className="position-absolute top-0 start-0 badge bg-warning text-dark m-2">
              <i className="bi bi-exclamation-triangle-fill me-1"></i> Low Stock
            </span>
          )}

          {isOutOfStock && (
            <span className="position-absolute top-0 start-0 badge bg-danger m-2">
              <i className="bi bi-x-circle-fill me-1"></i> Out of Stock
            </span>
          )}

          {/* Wishlist toggle button */}
          <div className="position-absolute top-0 start-0 m-2" style={{ zIndex: 2 }}>
            <button
              className={`btn btn-sm rounded-circle shadow-sm ${isWishlisted ? 'btn-danger' : 'btn-light'}`}
              onClick={handleWishlistClick}
              disabled={wishlistLoading}
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <i className={`bi bi-heart${isWishlisted ? '-fill' : ''}`}></i>
            </button>
          </div>

          {/* Quick view button */}
          <div className="position-absolute top-0 end-0 m-2">
            <button
              className="btn btn-light btn-sm rounded-circle shadow-sm"
              onClick={() => onViewProduct(product.id)}
              title="Quick View"
            >
              <i className="bi bi-eye"></i>
            </button>
          </div>
        </div>

        {/* Card body */}
        <div className="card-body d-flex flex-column">
          <div className="mb-2">
            <h5 className="card-title fw-bold text-truncate mb-1">
              {product.name || "Unnamed Product"}
            </h5>
            <p className="text-muted small mb-2">
              <i className="bi bi-tag me-1"></i>
              {product.id ? `ID: ${product.id}` : 'No ID'}
            </p>
          </div>

          <div className="mt-auto">
            {/* Stock indicator */}
            <div className="d-flex align-items-center mb-2">
              <div className="me-2">
                <i className={`bi bi-box-seam ${isOutOfStock ? 'text-danger' : isLowStock ? 'text-warning' : 'text-success'}`}></i>
              </div>
              <div className="flex-grow-1">
                <div className="progress" style={{ height: "5px" }}>
                  <div
                    className={`progress-bar ${isOutOfStock ? 'bg-danger' : isLowStock ? 'bg-warning' : 'bg-success'}`}
                    style={{
                      width: `${Math.min((stock / 100) * 100, 100)}%`,
                      maxWidth: '100%'
                    }}
                    role="progressbar"
                  ></div>
                </div>
                <small className={`${isOutOfStock ? 'text-danger' : isLowStock ? 'text-warning' : 'text-success'} fw-semibold`}>
                  {isOutOfStock ? 'Out of Stock' : `${stock} units available`}
                </small>
              </div>
            </div>

            {/* Price section - FIXED */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="h4 fw-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {/* Only show original price if it exists and is different from current price */}
                {product.originalPrice && product.price &&
                  Number(product.originalPrice) > Number(product.price) && (
                    <small className="text-muted text-decoration-line-through ms-2">
                      ${Number(product.originalPrice).toFixed(2)}
                    </small>
                  )}
              </div>
              {product.discount && !isNaN(product.discount) && (
                <span className="badge bg-success">
                  <i className="bi bi-percent me-1"></i> Save {product.discount}%
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center"
                onClick={() => product.id && onAddToCart(product.id)}
                disabled={isOutOfStock || !product.id}
              >
                <i className="bi bi-cart-plus me-2"></i>
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                className="btn btn-outline-primary d-flex align-items-center justify-content-center"
                onClick={() => product.id && onViewProduct(product.id)}
                disabled={!product.id}
                title="View Details"
              >
                <i className="bi bi-info-circle"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Additional features */}
        <div className="card-footer bg-transparent border-top-0 pt-0">
          <div className="d-flex justify-content-between small text-muted">
            <span>
              <i className="bi bi-star-fill text-warning me-1"></i>
              {product.rating && !isNaN(product.rating) ? Number(product.rating).toFixed(1) : 'N/A'}
            </span>
            <span>
              <i className="bi bi-truck me-1"></i>
              Free Shipping
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;