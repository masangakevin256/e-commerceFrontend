import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";

function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [editingCategory, setEditingCategory] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/categories`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCategories(res.data);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Please enter a category name");
            return;
        }

        try {
            const accessToken = localStorage.getItem("accessToken");
            if (editingCategory) {
                await axios.put(`${BASE_URL}/categories/${editingCategory.id}`, { name }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setMessage("Category updated successfully!");
            } else {
                await axios.post(`${BASE_URL}/categories`, { name }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setMessage("Category created successfully!");
            }
            
            setName("");
            setEditingCategory(null);
            setError("");
            fetchCategories();
            
            // Auto-clear message after 3 seconds
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        
        try {
            const accessToken = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_URL}/categories/${categoryToDelete.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            setMessage(`Category "${categoryToDelete.name}" deleted successfully!`);
            setShowDeleteModal(false);
            setCategoryToDelete(null);
            fetchCategories();
            
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Delete failed");
            setShowDeleteModal(false);
        }
    };

    const confirmDelete = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="fw-bold text-primary mb-2">
                                <i className="bi bi-tags me-2"></i>
                                Categories Management
                            </h2>
                            <p className="text-muted mb-0">
                                Manage your product categories and organize your inventory
                            </p>
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 me-3">
                                <i className="bi bi-grid-3x3 me-1"></i>
                                {categories.length} Categories
                            </span>
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

            <div className="row">
                {/* Left Column - Add/Edit Form */}
                <div className="col-lg-4 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white py-3">
                            <h5 className="fw-bold mb-0">
                                <i className="bi bi-plus-circle me-2"></i>
                                {editingCategory ? "Edit Category" : "Add New Category"}
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg"
                                        placeholder="Enter category name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <div className="form-text">
                                        Enter a descriptive name for your category
                                    </div>
                                </div>

                                <div className="d-grid gap-2">
                                    <button 
                                        type="submit" 
                                        className={`btn btn-lg ${editingCategory ? 'btn-warning' : 'btn-primary'}`}
                                    >
                                        <i className={`bi ${editingCategory ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                                        {editingCategory ? "Update Category" : "Create Category"}
                                    </button>
                                    
                                    {editingCategory && (
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary btn-lg"
                                            onClick={() => { 
                                                setEditingCategory(null); 
                                                setName(""); 
                                            }}
                                        >
                                            <i className="bi bi-x-circle me-2"></i>
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Stats */}
                            <div className="mt-5 pt-4 border-top">
                                <h6 className="fw-bold text-muted mb-3">Category Statistics</h6>
                                <div className="row text-center">
                                    <div className="col-6">
                                        <div className="p-3 bg-light rounded">
                                            <h3 className="fw-bold text-primary mb-0">{categories.length}</h3>
                                            <small className="text-muted">Total Categories</small>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="p-3 bg-light rounded">
                                            <h3 className="fw-bold text-success mb-0">{filteredCategories.length}</h3>
                                            <small className="text-muted">Displayed</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Categories List */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0">
                                <i className="bi bi-list-ul me-2"></i>
                                All Categories
                            </h5>
                            <div className="d-flex align-items-center">
                                <div className="input-group input-group-sm" style={{ width: "250px" }}>
                                    <span className="input-group-text bg-light border-end-0">
                                        <i className="bi bi-search"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0"
                                        placeholder="Search categories..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button 
                                            className="btn btn-outline-secondary border-start-0" 
                                            type="button"
                                            onClick={() => setSearchTerm("")}
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3 text-muted">Loading categories...</p>
                                </div>
                            ) : filteredCategories.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-tag display-1 text-muted mb-3"></i>
                                    <h5 className="fw-bold text-muted">No categories found</h5>
                                    <p className="text-muted">
                                        {searchTerm ? "Try a different search term" : "Start by adding your first category"}
                                    </p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 py-3" style={{ width: "50px" }}>#</th>
                                                <th className="border-0 py-3">Category Name</th>
                                                <th className="border-0 py-3 text-center">Status</th>
                                                <th className="border-0 py-3 text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCategories.map((category, index) => (
                                                <tr key={category.id} className="align-middle">
                                                    <td className="py-3">
                                                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-circle px-2 py-1">
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                                                <i className="bi bi-tag text-primary"></i>
                                                            </div>
                                                            <div>
                                                                <h6 className="fw-bold mb-0">{category.name}</h6>
                                                                <small className="text-muted">
                                                                    ID: {category.id} • Created recently
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">
                                                            <i className="bi bi-check-circle me-1"></i>
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-end">
                                                        <div className="btn-group">
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                                                onClick={() => { 
                                                                    setEditingCategory(category); 
                                                                    setName(category.name); 
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                            >
                                                                <i className="bi bi-pencil me-1"></i>
                                                                Edit
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline-danger d-flex align-items-center"
                                                                onClick={() => confirmDelete(category)}
                                                            >
                                                                <i className="bi bi-trash me-1"></i>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        
                        {/* Table Footer */}
                        {filteredCategories.length > 0 && (
                            <div className="card-footer bg-white border-top py-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                        Showing {filteredCategories.length} of {categories.length} categories
                                    </small>
                                    <small className="text-muted">
                                        <i className="bi bi-info-circle me-1"></i>
                                        Click on actions to manage categories
                                    </small>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && categoryToDelete && (
                <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold text-danger">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    Confirm Delete
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <div className="mb-3">
                                        <i className="bi bi-trash display-1 text-danger"></i>
                                    </div>
                                    <h5 className="fw-bold mb-3">Delete "{categoryToDelete.name}"?</h5>
                                    <p className="text-muted">
                                        This action cannot be undone. All products in this category will be affected.
                                        Are you sure you want to delete this category?
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
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
                                >
                                    <i className="bi bi-trash me-2"></i>
                                    Yes, Delete Category
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminCategories;