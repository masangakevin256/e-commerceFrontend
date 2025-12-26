import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import defaultProfilePic from "../../../public/avatar.png";
import AdminOverview from "./AdminOverview";
import AdminProducts from "./AdminProducts";
import AdminOrders from "./AdminOrders";
import AdminCustomers from "./AdminCustomers";
import AdminCategories from "./AdminCategories";
import AdminVouchers from "./AdminVouchers";
import AdminSettings from "./AdminSettings";
import AdminProfile from "./profile";
import AdminReviews from "./AdminReview";
import AdminManagement from "./AdminSection";
import { BASE_URL } from "../../tokens/BASE_URL";


function AdminDashboard() {
    const [section, setSection] = useState("overview");
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        lowStock: 0,
        salesTrend: [],
        categoryStats: []
    });
    const [adminName, setAdminName] = useState("Administrator");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminRole, setAdminRole] = useState("Admin");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [quickStats, setQuickStats] = useState({
        todayOrders: 0,
        pendingOrders: 0,
        outOfStock: 0
    });
    const [unreadCount, setUnreadCount] = useState(0);
    
    const navigate = useNavigate();
    const notificationRef = useRef(null);

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            navigate("/");
            return;
        }

        try {
            const decoded = jwtDecode(accessToken);
            setAdminName(decoded.userInfo?.name || "Administrator");
            setAdminEmail(decoded.userInfo?.email || "");
            setAdminRole(decoded.userInfo?.role || "Admin");
            initializeDashboard();
        } catch (err) {
            console.error("Auth error:", err);
            localStorage.removeItem("accessToken");
            navigate("/");
        }
    }, [navigate]);

    const initializeDashboard = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchStats(),
                fetchQuickStats(),
                fetchNotifications()
            ]);
        } catch (err) {
            setError("Failed to initialize dashboard");
            console.error("Initialize error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/admins/stats`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setStats(res.data);
        } catch (err) {
            console.error("Stats fetch error:", err);
        }
    };

    const fetchQuickStats = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/admins/quick-stats`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setQuickStats(res.data);
        } catch (err) {
            console.error("Quick stats error:", err);
        }
    };

    const fetchNotifications = async () => {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        try {
            const res = await axios.get(`${BASE_URL}/messages`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            const notificationsData = res.data || [];
            setNotifications(notificationsData);
            setUnreadCount(notificationsData.filter(n => !n.is_read).length);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    const handleLogout = () => {
        if(!window.confirm("Are you sure you want to logout?")) return;
        localStorage.removeItem("accessToken");
        setTimeout(() => {
            navigate("/");
        }, 3000);
    };

    const markNotificationAsRead = async (notificationId) => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            await axios.put(`${BASE_URL}/messages/mark-read`, 
                { id: notificationId }, 
                {
                    headers: { 
                        Authorization: `Bearer ${accessToken}` 
                    }
                }
            );
            fetchNotifications();
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            await axios.put(`${BASE_URL}/messages/mark-read`, 
                {}, 
                {
                    headers: { 
                        Authorization: `Bearer ${accessToken}` 
                    }
                }
            );
            fetchNotifications();
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_URL}/messages/${notificationId}`, {
                headers: { 
                    Authorization: `Bearer ${accessToken}` 
                }
            });
            fetchNotifications();
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            order: "bi-cart-check",
            stock: "bi-exclamation-triangle",
            system: "bi-gear",
            user: "bi-person",
            success: "bi-check-circle",
            warning: "bi-exclamation-circle",
            info: "bi-info-circle"
        };
        return icons[type] || "bi-bell";
    };

    const getNotificationColor = (type) => {
        const colors = {
            order: "primary",
            stock: "warning",
            system: "info",
            user: "success",
            success: "success",
            warning: "danger",
            info: "info"
        };
        return colors[type] || "secondary";
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const navItems = [
        { key: "overview", icon: "bi-speedometer2", label: "Dashboard", color: "primary" },
        {key: "admins", icon: "bi-people", label: "Admins", color: "success"},
        { key: "products", icon: "bi-box-seam", label: "Products", color: "success" },
        { key: "categories", icon: "bi-tags", label: "Categories", color: "info" },
        { key: "orders", icon: "bi-cart-check", label: "Orders", color: "warning" },
        { key: "customers", icon: "bi-people", label: "Customers", color: "purple" },
        { key: "vouchers", icon: "bi-ticket-perforated", label: "Vouchers", color: "danger" },
        { key: "reviews", icon: "bi-star", label: "Reviews", color: "warning" },
        { key: "profile", icon: "bi-person", label: "Profile", color: "secondary" },
        { key: "settings", icon: "bi-gear", label: "Settings", color: "dark" },
    ];

    const renderSection = () => {
        const components = {
            overview: <AdminOverview stats={stats} quickStats={quickStats} />,
            products: <AdminProducts />,
            categories: <AdminCategories />,
            orders: <AdminOrders />,
            customers: <AdminCustomers />,
            vouchers: <AdminVouchers />,
            profile: <AdminProfile />,
            settings: <AdminSettings />,
            reviews: <AdminReviews />,
            admins: <AdminManagement />
        };
        return components[section] || <AdminOverview stats={stats} quickStats={quickStats} />;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
                <div className="text-center">
                    <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex min-vh-100 bg-light" style={{ overflow: "hidden" }}>
            {/* Sidebar */}
            <div 
                className={`d-flex flex-column bg-white border-end transition-all position-fixed h-100 ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} 
                style={{ 
                    width: sidebarCollapsed ? '70px' : '250px',
                    transition: 'all 0.3s ease',
                    zIndex: 1000
                }}
            >
                {/* Logo */}
                <div className="p-4 border-bottom">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <div className={`rounded-circle bg-primary d-flex align-items-center justify-content-center ${sidebarCollapsed ? 'mx-auto' : 'me-3'}`} 
                                 style={{ width: '40px', height: '40px' }}>
                                <i className="bi bi-shield-check text-white fs-5"></i>
                            </div>
                            {!sidebarCollapsed && (
                                <div className="overflow-hidden">
                                    <h5 className="fw-bold text-primary mb-0 fs-6">Admin Panel</h5>
                                    <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>KU Store Management</small>
                                </div>
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <button 
                                className="btn btn-sm btn-light rounded-circle"
                                onClick={() => setSidebarCollapsed(true)}
                                style={{ width: "30px", height: "30px" }}
                                aria-label="Collapse sidebar"
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Navigation Items */}
                <div className="flex-grow-1 overflow-auto py-3">
                    <ul className="nav flex-column">
                        {navItems.map((item) => (
                            <li className="nav-item" key={item.key}>
                                <button
                                    className={`nav-link d-flex align-items-center py-3 px-4 border-0 w-100 text-start ${section === item.key ? 'active' : ''}`}
                                    onClick={() => setSection(item.key)}
                                    style={{
                                        backgroundColor: section === item.key ? `var(--bs-${item.color})` : 'transparent',
                                        color: section === item.key ? 'white' : 'var(--bs-body-color)'
                                    }}
                                    aria-current={section === item.key ? "page" : undefined}
                                >
                                    <i className={`bi ${item.icon} me-3 ${sidebarCollapsed ? 'mx-auto' : ''}`} 
                                       style={{ fontSize: '1.1rem' }}></i>
                                    {!sidebarCollapsed && (
                                        <span className="fw-medium">{item.label}</span>
                                    )}
                                    {!sidebarCollapsed && section === item.key && (
                                        <i className="bi bi-chevron-right ms-auto"></i>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Sidebar Footer */}
                <div className="border-top p-3">
                    {!sidebarCollapsed && (
                        <div className="text-center">
                            <div className="mb-2">
                                <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                                    <i className="bi bi-shield-lock me-2"></i>
                                    Admin Mode
                                </div>
                            </div>
                            <small className="text-muted">
                                <i className="bi bi-cpu me-1"></i>
                                v1.0.0
                            </small>
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <div className="text-center">
                            <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center p-2">
                                <i className="bi bi-shield-lock text-primary"></i>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div 
                className="flex-grow-1 d-flex flex-column" 
                style={{ 
                    marginLeft: sidebarCollapsed ? '70px' : '250px',
                    transition: 'margin-left 0.3s ease'
                }}
            >
                {/* Fixed Top Navigation Bar */}
                <header className="bg-white shadow-sm p-3 d-flex justify-content-between align-items-center sticky-top" style={{ zIndex: 999 }}>
                    <div className="d-flex align-items-center gap-3">
                        {sidebarCollapsed && (
                            <button 
                                className="btn btn-light border rounded-circle"
                                onClick={() => setSidebarCollapsed(false)}
                                style={{ width: "40px", height: "40px" }}
                                aria-label="Expand sidebar"
                            >
                                <i className="bi bi-list"></i>
                            </button>
                        )}
                        <div>
                            <h4 className="fw-bold text-primary mb-0 text-capitalize fs-5">
                                {section === "overview" ? "Dashboard Overview" : section.replace("-", " ")}
                            </h4>
                            <small className="text-muted">
                                <i className="bi bi-calendar3 me-1"></i>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </small>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {/* Search Bar */}
                        <div className="d-none d-md-block" style={{ width: "300px" }}>
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="search"
                                    className="form-control border-start-0"
                                    placeholder="Search orders, products, customers..."
                                    aria-label="Search dashboard"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-outline-primary btn-sm d-flex align-items-center"
                                onClick={initializeDashboard}
                                title="Refresh"
                                aria-label="Refresh dashboard"
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                            
                            <button 
                                className="btn btn-outline-success btn-sm d-flex align-items-center"
                                title="Add New"
                                aria-label="Add new item"
                            >
                                <i className="bi bi-plus-lg"></i>
                            </button>
                        </div>

                        {/* Notifications Dropdown */}
                        <div className="position-relative" ref={notificationRef}>
                            <button 
                                className="btn btn-light border rounded-circle position-relative"
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ width: "42px", height: "42px" }}
                                aria-label="Notifications"
                                aria-expanded={showNotifications}
                            >
                                <i className="bi bi-bell"></i>
                                {unreadCount > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                                          style={{ fontSize: "0.6rem", minWidth: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>
                            
                            {/* Notifications Panel */}
                            {showNotifications && (
                                <div className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border notification-panel" 
                                     style={{ 
                                         width: "380px", 
                                         maxHeight: "500px", 
                                         overflowY: "auto",
                                         zIndex: 1001,
                                         right: "0"
                                     }}
                                     role="dialog"
                                     aria-label="Notifications panel">
                                    {/* Notifications Header */}
                                    <div className="p-3 border-bottom bg-light">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 className="fw-bold mb-0">Notifications</h6>
                                                <small className="text-muted">{unreadCount} unread</small>
                                            </div>
                                            {unreadCount > 0 && (
                                                <button 
                                                    className="btn btn-sm btn-link text-decoration-none p-0 text-primary"
                                                    onClick={markAllAsRead}
                                                    aria-label="Mark all notifications as read"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Notifications List */}
                                    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                                        {notifications.length === 0 ? (
                                            <div className="text-center py-5 px-3">
                                                <i className="bi bi-bell-slash display-6 text-muted mb-3"></i>
                                                <p className="text-muted mb-2">No notifications</p>
                                                <small className="text-muted">You're all caught up!</small>
                                            </div>
                                        ) : (
                                            notifications.map(notification => (
                                                <div 
                                                    key={notification.id} 
                                                    className={`p-3 border-bottom notification-item ${!notification.is_read ? 'bg-light bg-opacity-25' : ''}`}
                                                    style={{ 
                                                        cursor: 'pointer',
                                                        borderLeft: !notification.is_read ? '3px solid var(--bs-primary)' : 'none'
                                                    }}
                                                    onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyPress={(e) => e.key === 'Enter' && !notification.is_read && markNotificationAsRead(notification.id)}
                                                    aria-label={`Notification: ${notification.title}`}
                                                >
                                                    <div className="d-flex align-items-start">
                                                        <div className={`bg-${getNotificationColor(notification.type)} bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0`}>
                                                            <i className={`bi ${getNotificationIcon(notification.type)} text-${getNotificationColor(notification.type)}`}></i>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                                <h6 className="fw-bold mb-0" style={{ fontSize: "0.9rem" }}>
                                                                    {notification.title}
                                                                </h6>
                                                                <div className="d-flex gap-1">
                                                                    {!notification.is_read && (
                                                                        <button 
                                                                            className="btn btn-sm btn-link p-0 text-primary"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                markNotificationAsRead(notification.id);
                                                                            }}
                                                                            title="Mark as read"
                                                                            aria-label="Mark notification as read"
                                                                        >
                                                                            <i className="bi bi-check-circle"></i>
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        className="btn btn-sm btn-link p-0 text-danger"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            deleteNotification(notification.id);
                                                                        }}
                                                                        title="Delete"
                                                                        aria-label="Delete notification"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p className="text-muted small mb-1" style={{ fontSize: "0.85rem" }}>
                                                                {notification.message}
                                                            </p>
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <small className="text-muted">
                                                                    {formatTime(notification.created_at)}
                                                                </small>
                                                                <span className={`badge bg-${getNotificationColor(notification.type)} bg-opacity-10 text-${getNotificationColor(notification.type)}`}>
                                                                    {notification.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    
                                    {/* Notifications Footer */}
                                    {notifications.length > 0 && (
                                        <div className="p-3 border-top bg-light">
                                            <button 
                                                className="btn btn-sm btn-outline-primary w-100"
                                                onClick={() => {
                                                    setShowNotifications(false);
                                                    // Navigate to notifications page if you have one
                                                }}
                                                aria-label="View all notifications"
                                            >
                                                View all notifications
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="dropdown">
                            <button 
                                className="btn btn-light border rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "42px", height: "42px" }}
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                aria-label="User menu"
                            >
                                <i className="bi bi-person-circle fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                <li className="dropdown-header">
                                    <div className="fw-bold">{adminName}</div>
                                    <small className="text-muted">{adminEmail}</small>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item" onClick={() => setSection("profile")}>
                                        <i className="bi bi-person me-2"></i> My Profile
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" onClick={() => setSection("settings")}>
                                        <i className="bi bi-gear me-2"></i> Settings
                                    </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                                        <i className="bi bi-box-arrow-right me-2"></i> Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-grow-1 p-4 overflow-auto" style={{ 
                    backgroundColor: '#f8f9fa',
                    minHeight: 'calc(100vh - 76px)'
                }}>
                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            {error}
                            <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
                        </div>
                    )}
                    
                    {renderSection()}
                </main>

                {/* Footer */}
                <footer className="bg-white border-top py-3 px-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="text-muted small">
                            © {new Date().getFullYear()} Kisii University Store • Admin Dashboard v1.0
                        </div>
                        <div className="text-muted small d-flex align-items-center gap-3">
                            <span>
                                <i className="bi bi-circle-fill text-success me-1" style={{ fontSize: '6px' }}></i>
                                System: <span className="fw-bold text-success">Online</span>
                            </span>
                            <span className="d-none d-md-inline">•</span>
                            <span className="d-none d-md-inline">
                                <i className="bi bi-clock me-1"></i>
                                Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </footer>
            </div>

            {/* CSS Styles */}
            <style jsx>{`
                .sidebar-collapsed .nav-item {
                    justify-content: center !important;
                    padding: 0.5rem !important;
                }
                .btn:hover {
                    transform: translateY(-1px);
                    transition: all 0.2s ease;
                }
                .nav-item:hover:not(.active) {
                    background-color: rgba(13, 110, 253, 0.05) !important;
                }
                .nav-item.active {
                    box-shadow: 0 4px 12px rgba(var(--bs-primary-rgb), 0.15);
                    transform: translateX(5px);
                }
                .text-purple {
                    color: #6f42c1 !important;
                }
                .bg-purple {
                    background-color: #6f42c1 !important;
                }
                .dropdown-item:active {
                    background-color: var(--bs-primary);
                    color: white;
                }
                
                /* Custom notification panel styles */
                .notification-panel {
                    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                    border: 1px solid rgba(0,0,0,0.1);
                }
                
                /* Smooth transitions */
                .notification-item {
                    transition: all 0.2s ease;
                }
                
                .notification-item:hover {
                    background-color: rgba(0,0,0,0.03);
                }
            `}</style>
        </div>
    );
}

export default AdminDashboard;