import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [imageMode, setImageMode] = useState("upload");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        stock: "",
        category_id: "",
        imageFile: null,
        imageUrl: "",
        originalPrice: "",
        discount: "",
        rating: ""
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [previewImage, setPreviewImage] = useState("");
    const [groupedProducts, setGroupedProducts] = useState({});

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/products`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setProducts(res.data);
            setError("");
        } catch (err) {
            setError("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/categories`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCategories(res.data);
        } catch (err) {
            console.error("Categories error:", err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === "imageUrl") {
            setPreviewImage(value);
        }
    };

   

    const filteredProducts = useMemo(() => {
        let filtered = products;
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.category_name && p.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        // Apply category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter(p => 
                p.category_id?.toString() === selectedCategory ||
                p.category_name === selectedCategory
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let valA, valB;
            
            switch (sortBy) {
                case "price":
                    valA = parseFloat(a.price);
                    valB = parseFloat(b.price);
                    break;
                case "stock":
                    valA = parseInt(a.stock);
                    valB = parseInt(b.stock);
                    break;
                case "name":
                default:
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
            }
            
            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
        
        return filtered;
    }, [products, searchTerm, selectedCategory, sortBy, sortOrder]);
     const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({ ...prev, imageFile: file }));
        
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Group products by category
    useEffect(() => {
        const grouped = filteredProducts.reduce((groups, product) => {
            const category = product.category_name || "Uncategorized";
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(product);
            return groups;
        }, {});
        setGroupedProducts(grouped);
    }, [filteredProducts]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const accessToken = localStorage.getItem("accessToken");
            const submitData = new FormData();
            
            // Append basic fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'imageFile' && value) {
                    submitData.append(key, value);
                }
            });
            
            // Handle image
            if (imageMode === "upload" && formData.imageFile) {
                submitData.append("image", formData.imageFile);
            } else if (imageMode === "url" && formData.imageUrl) {
                submitData.append("image", formData.imageUrl);
            }
            
            if (editingProduct) {
                // Update product
                await axios.put(`${BASE_URL}/products/${editingProduct.id}`, submitData, {
                    headers: { 
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "multipart/form-data"
                    }
                });
                setMessage("✅ Product updated successfully!");
            } else {
                // Add new product
                await axios.post(`${BASE_URL}/products`, submitData, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "multipart/form-data"
                    }
                });
                setMessage("✅ Product added successfully!");
            }
            
            setShowModal(false);
            resetForm();
            fetchProducts();
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Operation failed. Please try again.");
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({ 
            name: "", 
            description: "", 
            price: "", 
            stock: "", 
            category_id: "", 
            imageFile: null, 
            imageUrl: "",
            originalPrice: "",
            discount: "",
            rating: ""
        });
        setImageMode("upload");
        setPreviewImage("");
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        const currentCategory = categories.find(c => c.name === product.category_name);
        setFormData({
            name: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            category_id: currentCategory?.id || "",
            imageFile: null,
            imageUrl: product.image?.startsWith('http') ? product.image : "",
            originalPrice: product.originalPrice || "",
            discount: product.discount || "",
            rating: product.rating || ""
        });
        setImageMode(product.image?.startsWith('http') ? "url" : "upload");
        setPreviewImage(product.image?.startsWith('http') ? product.image : `${BASE_URL}/uploads/products/${product.image}`);
        setShowModal(true);
    };

    const confirmDelete = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;
        
        try {
            setDeletingId(productToDelete.id);
            const accessToken = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_URL}/products/${productToDelete.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setMessage(`✅ Product "${productToDelete.name}" deleted successfully!`);
            setShowDeleteModal(false);
            setProductToDelete(null);
            fetchProducts();
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError("Failed to delete product");
            setShowDeleteModal(false);
        } finally {
            setDeletingId(null);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400";
        if (imagePath.startsWith('http')) return imagePath;
        return `${BASE_URL}/uploads/products/${imagePath}`;
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id == categoryId);
        return category ? category.name : "Uncategorized";
    };

    return (
        <div className="container-fluid py-3 px-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="fw-bold text-primary mb-2">
                                <i className="bi bi-box-seam me-2"></i>
                                Product Management
                            </h2>
                            <p className="text-muted mb-0">
                                Manage your inventory, add new products, and update existing items
                            </p>
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 me-3">
                                <i className="bi bi-box me-1"></i>
                                {products.length} Total Products
                            </span>
                            <button 
                                className="btn btn-primary d-flex align-items-center"
                                onClick={() => { resetForm(); setShowModal(true); }}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                Add New Product
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {message && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
                            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                            <div className="flex-grow-1">{message}</div>
                            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                            <div className="flex-grow-1">{error}</div>
                            <button type="button" className="btn-close" onClick={() => setError("")}></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-3">
                            <div className="row g-3 align-items-center">
                                <div className="col-lg-4 col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0">
                                            <i className="bi bi-search"></i>
                                        </span>
                                        <input 
                                            type="text" 
                                            className="form-control border-start-0"
                                            placeholder="Search products..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button 
                                                className="btn btn-outline-secondary"
                                                onClick={() => setSearchTerm("")}
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="col-lg-3 col-md-6">
                                    <select 
                                        className="form-select"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="col-lg-3 col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light">Sort By</span>
                                        <select 
                                            className="form-select"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="name">Name</option>
                                            <option value="price">Price</option>
                                            <option value="stock">Stock</option>
                                        </select>
                                        <button 
                                            className="btn btn-outline-secondary"
                                            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                        >
                                            <i className={`bi bi-arrow-${sortOrder === "asc" ? "down" : "up"}`}></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="col-lg-2 col-md-6">
                                    <div className="text-muted small">
                                        Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products by Category */}
            {loading ? (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-3 text-muted">Loading products...</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5">
                                <i className="bi bi-search display-1 text-muted mb-4"></i>
                                <h5 className="fw-bold text-primary mb-3">No products found</h5>
                                <p className="text-muted">
                                    {searchTerm || selectedCategory !== "all" 
                                        ? "Try adjusting your search or filter criteria."
                                        : "No products available. Start by adding your first product!"}
                                </p>
                                {(searchTerm || selectedCategory !== "all") && (
                                    <button 
                                        className="btn btn-primary mt-3"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setSelectedCategory("all");
                                        }}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                Object.keys(groupedProducts).map((category) => (
                    <div key={category} className="mb-5">
                        {/* Category Header */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fw-bold text-primary h5 mb-0">
                                <i className="bi bi-tag me-2"></i>
                                {category}
                            </h4>
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
                                {groupedProducts[category].length} products
                            </span>
                        </div>

                        {/* Products Grid */}
                        <div className="row g-3">
                            {groupedProducts[category].map(product => (
                                <div key={product.id} className="col-xxl-2 col-xl-3 col-lg-4 col-md-4 col-sm-6">
                                    <div className="card border-0 shadow-sm h-100 product-card">
                                        {/* Product Image */}
                                        <div className="position-relative" style={{ height: "180px", overflow: "hidden" }}>
                                            <img 
                                                src={getImageUrl(product.image)} 
                                                className="card-img-top h-100 w-100" 
                                                alt={product.name}
                                                style={{ objectFit: "cover" }}
                                            />
                                            <div className="position-absolute top-0 end-0 m-2">
                                                {product.discount && (
                                                    <span className="badge bg-danger">
                                                        -{product.discount}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="position-absolute top-0 start-0 m-2">
                                                <span className={`badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}`}>
                                                    {product.stock}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Card Body */}
                                        <div className="card-body p-3 d-flex flex-column">
                                            <h6 className="card-title fw-bold mb-2 text-truncate" title={product.name}>
                                                {product.name}
                                            </h6>
                                            
                                            <p className="text-muted small mb-2 flex-grow-1" style={{ minHeight: "40px" }}>
                                                {product.description?.substring(0, 50)}...
                                            </p>
                                            
                                            <div className="mt-auto">
                                                {/* Price */}
                                                <div className="mb-3">
                                                    <h6 className="text-primary fw-bold mb-0">KES {Number(product.price).toLocaleString()}</h6>
                                                    {product.originalPrice && (
                                                        <small className="text-muted text-decoration-line-through">
                                                            KES {Number(product.originalPrice).toLocaleString()}
                                                        </small>
                                                    )}
                                                </div>
                                                
                                                {/* Actions */}
                                                <div className="d-flex gap-2">
                                                    <button 
                                                        className="btn btn-outline-primary btn-sm flex-grow-1"
                                                        onClick={() => handleEdit(product)}
                                                    >
                                                        <i className="bi bi-pencil me-1"></i>
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => confirmDelete(product)}
                                                        disabled={deletingId === product.id}
                                                    >
                                                        {deletingId === product.id ? (
                                                            <span className="spinner-border spinner-border-sm"></span>
                                                        ) : (
                                                            <i className="bi bi-trash"></i>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Add/Edit Product Modal - Made Scrollable */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: "90vh" }}>
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-primary text-white sticky-top" style={{ zIndex: 1055 }}>
                                <h4 className="modal-title fw-bold">
                                    <i className={`bi ${editingProduct ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                                    {editingProduct ? "Edit Product" : "Add New Product"}
                                </h4>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            
                            <div className="modal-body p-0" style={{ maxHeight: "calc(90vh - 120px)", overflowY: "auto" }}>
                                <form onSubmit={handleSubmit} className="p-4">
                                    <div className="row g-4">
                                        {/* Left Column - Image Upload */}
                                        <div className="col-md-5">
                                            <div className="card border-0 bg-light">
                                                <div className="card-body text-center p-4">
                                                    {/* Image Preview */}
                                                    <div className="mb-4">
                                                        <div className="position-relative d-inline-block">
                                                            <img 
                                                                src={previewImage || "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400"}
                                                                className="img-fluid rounded border"
                                                                alt="Product preview"
                                                                style={{ maxHeight: "250px", objectFit: "contain" }}
                                                            />
                                                        </div>
                                                        <div className="mt-3">
                                                            <small className="text-muted">
                                                                Product image preview
                                                            </small>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Image Mode Selection */}
                                                    <div className="mb-4">
                                                        <label className="form-label fw-bold d-block mb-3">
                                                            <i className="bi bi-image me-2"></i>
                                                            Image Source
                                                        </label>
                                                        <div className="btn-group w-100" role="group">
                                                            <button 
                                                                type="button"
                                                                className={`btn ${imageMode === 'upload' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                                onClick={() => setImageMode('upload')}
                                                            >
                                                                <i className="bi bi-upload me-2"></i>
                                                                Upload
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                className={`btn ${imageMode === 'url' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                                onClick={() => setImageMode('url')}
                                                            >
                                                                <i className="bi bi-link me-2"></i>
                                                                URL
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Image Input */}
                                                    <div className="mb-3">
                                                        {imageMode === "upload" ? (
                                                            <div className="input-group">
                                                                <input 
                                                                    type="file" 
                                                                    className="form-control" 
                                                                    onChange={handleFileChange}
                                                                    accept="image/*"
                                                                    required={!editingProduct}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="input-group">
                                                                <span className="input-group-text">
                                                                    <i className="bi bi-link"></i>
                                                                </span>
                                                                <input 
                                                                    type="url" 
                                                                    name="imageUrl"
                                                                    className="form-control" 
                                                                    placeholder="https://example.com/image.jpg"
                                                                    value={formData.imageUrl}
                                                                    onChange={handleInputChange}
                                                                    required={!editingProduct}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Right Column - Form Fields */}
                                        <div className="col-md-7">
                                            <div className="row g-3">
                                                {/* Basic Info */}
                                                <div className="col-12">
                                                    <h5 className="fw-bold text-primary mb-3">
                                                        <i className="bi bi-info-circle me-2"></i>
                                                        Basic Information
                                                    </h5>
                                                </div>
                                                
                                                <div className="col-md-8">
                                                    <label className="form-label fw-semibold">Product Name *</label>
                                                    <input 
                                                        type="text" 
                                                        name="name"
                                                        className="form-control form-control-lg" 
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        required
                                                        placeholder="Enter product name"
                                                    />
                                                </div>
                                                
                                                <div className="col-md-4">
                                                    <label className="form-label fw-semibold">Category *</label>
                                                    <select 
                                                        name="category_id"
                                                        className="form-select form-control-lg"
                                                        value={formData.category_id}
                                                        onChange={handleInputChange}
                                                        required
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                <div className="col-12">
                                                    <label className="form-label fw-semibold">Description</label>
                                                    <textarea 
                                                        name="description"
                                                        className="form-control" 
                                                        rows="3"
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                        placeholder="Describe the product features and benefits"
                                                    />
                                                </div>
                                                
                                                {/* Pricing */}
                                                <div className="col-12 mt-4">
                                                    <h5 className="fw-bold text-primary mb-3">
                                                        <i className="bi bi-currency-exchange me-2"></i>
                                                        Pricing & Inventory
                                                    </h5>
                                                </div>
                                                
                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold">Price (KES) *</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text">KES</span>
                                                        <input 
                                                            type="number" 
                                                            name="price"
                                                            className="form-control" 
                                                            value={formData.price}
                                                            onChange={handleInputChange}
                                                            required
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold">Stock Quantity *</label>
                                                    <input 
                                                        type="number" 
                                                        name="stock"
                                                        className="form-control" 
                                                        value={formData.stock}
                                                        onChange={handleInputChange}
                                                        required
                                                        min="0"
                                                    />
                                                </div>
                                                
                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold">Original Price (KES)</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text">KES</span>
                                                        <input 
                                                            type="number" 
                                                            name="originalPrice"
                                                            className="form-control" 
                                                            value={formData.originalPrice}
                                                            onChange={handleInputChange}
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <small className="text-muted">For showing discounted price</small>
                                                </div>
                                                
                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold">Discount (%)</label>
                                                    <div className="input-group">
                                                        <input 
                                                            type="number" 
                                                            name="discount"
                                                            className="form-control" 
                                                            value={formData.discount}
                                                            onChange={handleInputChange}
                                                            min="0"
                                                            max="100"
                                                        />
                                                        <span className="input-group-text">%</span>
                                                    </div>
                                                    <small className="text-muted">Discount percentage</small>
                                                </div>
                                                
                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold">Rating</label>
                                                    <div className="input-group">
                                                        <input 
                                                            type="number" 
                                                            name="rating"
                                                            className="form-control" 
                                                            value={formData.rating}
                                                            onChange={handleInputChange}
                                                            min="0"
                                                            max="5"
                                                            step="0.1"
                                                        />
                                                        <span className="input-group-text">
                                                            <i className="bi bi-star-fill text-warning"></i>
                                                        </span>
                                                    </div>
                                                    <small className="text-muted">Product rating (0-5)</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="modal-footer border-top p-4 mt-4 sticky-bottom bg-white" style={{ zIndex: 1055 }}>
                                        <button 
                                            type="button" 
                                            className="btn btn-lg btn-outline-secondary px-4"
                                            onClick={() => setShowModal(false)}
                                        >
                                            <i className="bi bi-x-circle me-2"></i>
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-lg btn-primary px-4"
                                        >
                                            <i className={`bi ${editingProduct ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                                            {editingProduct ? "Update Product" : "Add Product"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal - Made Scrollable */}
            {showDeleteModal && productToDelete && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: "90vh" }}>
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0 sticky-top bg-white" style={{ zIndex: 1055 }}>
                                <h5 className="modal-title fw-bold text-danger">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    Delete Product
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                            </div>
                            <div className="modal-body" style={{ maxHeight: "calc(90vh - 200px)", overflowY: "auto" }}>
                                <div className="text-center mb-4">
                                    <div className="mb-3">
                                        <i className="bi bi-trash display-1 text-danger"></i>
                                    </div>
                                    <h5 className="fw-bold mb-3">Delete "{productToDelete.name}"?</h5>
                                    <p className="text-muted">
                                        This action cannot be undone. The product will be permanently removed from your inventory.
                                    </p>
                                    
                                    {/* Product Details */}
                                    <div className="card border-0 bg-light mt-4">
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <img 
                                                        src={getImageUrl(productToDelete.image)}
                                                        className="img-fluid rounded"
                                                        alt={productToDelete.name}
                                                        style={{ maxHeight: "100px" }}
                                                    />
                                                </div>
                                                <div className="col-md-9">
                                                    <h6 className="fw-bold">{productToDelete.name}</h6>
                                                    <div className="row small">
                                                        <div className="col-6">
                                                            <span className="text-muted">Category:</span><br/>
                                                            <strong>{getCategoryName(productToDelete.category_id)}</strong>
                                                        </div>
                                                        <div className="col-6">
                                                            <span className="text-muted">Price:</span><br/>
                                                            <strong>KES {Number(productToDelete.price).toLocaleString()}</strong>
                                                        </div>
                                                        <div className="col-6 mt-2">
                                                            <span className="text-muted">Stock:</span><br/>
                                                            <strong className={productToDelete.stock > 0 ? 'text-success' : 'text-danger'}>
                                                                {productToDelete.stock} units
                                                            </strong>
                                                        </div>
                                                        <div className="col-6 mt-2">
                                                            <span className="text-muted">Added:</span><br/>
                                                            <strong>{new Date(productToDelete.created_at).toLocaleDateString()}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="alert alert-warning mt-4">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        <strong>Warning:</strong> This will remove the product from customer view and all associated data.
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 sticky-bottom bg-white" style={{ zIndex: 1055 }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger"
                                    onClick={handleDelete}
                                    disabled={deletingId === productToDelete.id}
                                >
                                    {deletingId === productToDelete.id ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-trash me-2"></i>
                                            Yes, Delete Product
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminProducts;