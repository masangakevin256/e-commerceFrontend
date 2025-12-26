import { Link } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import defaultProfilePic from "../../../public/avatar.png";
import Products from "./products";
import Profile from "./profile";
import Cart from "./Cart";
import Orders from "./Orders";
import Wishlist from "./Wishlist";
import Voucher from "./Voucher";
import Settings from "./Settings";
import FAQ from "./FAQ";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../tokens/BASE_URL";

function CustomerDashboard() {
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [username, setUsername] = useState("Customer");
    const [profilePic, setProfilePic] = useState("");
    const [data, setData] = useState([]);
    const [section, setSection] = useState("products");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [orderCount, setOrderCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const Navigate = useNavigate();
    const notificationRef = useRef(null);
    const sidebarRef = useRef(null);

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

    // Handle sidebar collapse state on window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 992) {
                setSidebarCollapsed(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load sidebar state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('customerSidebarCollapsed');
        if (savedState !== null) {
            setSidebarCollapsed(JSON.parse(savedState));
        }
    }, []);

    // Save sidebar state to localStorage
    useEffect(() => {
        localStorage.setItem('customerSidebarCollapsed', JSON.stringify(sidebarCollapsed));
    }, [sidebarCollapsed]);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const fetchCartCount = async () => {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        try {
            const res = await axios.get(`${BASE_URL}/cart/count`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            setCartCount(res.data.count || 0);
        } catch (err) {
            console.error("Error fetching cart count:", err);
        }
    };

    const fetchOrderCount = async () => {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        try {
            const res = await axios.get(`${BASE_URL}/orders/count`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            setOrderCount(res.data.count || 0);
        } catch (err) {
            console.error("Error fetching order count:", err);
        }
    };

    const fetchWishlistCount = async () => {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        try {
            const res = await axios.get(`${BASE_URL}/wishlist/count`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            setWishlistCount(res.data.count || 0);
        } catch (err) {
            console.error("Error fetching wishlist count:", err);
        }
    };

    const fetchNotifications = async () => {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        try {
            const res = await axios.get(`${BASE_URL}/notifications`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            setNotifications(res.data || []);
            setUnreadCount(res.data.filter(n => !n.is_read).length || 0);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        if (section !== "products") {
            setSection("products");
        }
    };

    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");
        document.title = "Customer Dashboard";

        if (accessToken) {
            try {
                const decodedToken = jwtDecode(accessToken);
                const user = decodedToken.userInfo;
                const name = user.name.split(" ").reverse().join(" ");
                setUsername(name);
            } catch (err) {
                setError("Invalid token");
                console.error("Token decode error:", err);
            }
        } else {
            setError("No access token found");
        }
    }, []);

    const handleMarkAllAsRead = async () => {
        const accessToken = localStorage.getItem("accessToken");
        try {
            await axios.put(`${BASE_URL}/notifications/mark-read`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    const handleMarkAsRead = async (id) => {
        const accessToken = localStorage.getItem("accessToken");
        try {
            await axios.put(`${BASE_URL}/notifications/mark-read`, { id }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    const handleDeleteNotification = async (id) => {
        const accessToken = localStorage.getItem("accessToken");
        try {
            await axios.delete(`${BASE_URL}/notifications/${id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm("Are you sure you want to logout?")) return;
        localStorage.removeItem("accessToken");
        
        setMessage("Logging out.....");
        
        setTimeout(() => {
            Navigate("/");
        }, 2000);
    };

    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");

        async function fetchUser() {
            try {
                setLoading(true);
                const res = await axios.get(`${BASE_URL}/customers`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const userData = Array.isArray(res.data) ? res.data[0] : res.data;
                setData(userData);

                if (userData?.profile_pic) {
                    setProfilePic(`${BASE_URL}/uploads/profiles/${userData.profile_pic}`);
                }
            } catch (err) {
                console.error("Error fetching user:", err);
                setError("Failed to load user data");
            } finally {
                setLoading(false);
            }
        }

        if (accessToken) {
            fetchUser();
            fetchCartCount();
            fetchOrderCount();
            fetchWishlistCount();
            fetchNotifications();
        }
    }, [section]);

    const renderSection = () => {
        switch (section) {
            case "products":
                return <Products
                    showMessage={setMessage}
                    showError={setError}
                    updateCartCount={fetchCartCount}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />;
            case "wishlist":
                return <Wishlist
                    updateCartCount={fetchCartCount}
                    showMessage={setMessage}
                    showError={setError}
                />;
            case "orders":
                return <Orders />;
            case "profile":
                return <Profile refreshUser={() => {
                    const accessToken = localStorage.getItem("accessToken");
                    if (accessToken) {
                        axios.get(`${BASE_URL}/customers`, {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        }).then(res => {
                            const userData = Array.isArray(res.data) ? res.data[0] : res.data;
                            if (userData?.profile_pic) {
                                setProfilePic(`${BASE_URL}/uploads/profiles/${userData.profile_pic}`);
                            }
                        });
                    }
                }} />;
            case "cart":
                return <Cart updateCartCount={fetchCartCount} customerPhone={data.phoneNumber || data.phonenumber || " "}  />;
            case "voucher":
                return <Voucher />;
            case "settings":
                return <Settings />;
            case "faq":
                return <FAQ />;
            default:
                return <Products
                    showMessage={setMessage}
                    showError={setError}
                    updateCartCount={fetchCartCount}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />;
        }
    };

    // Auto-clear notifications
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const getNotificationIcon = (type) => {
        const icons = {
            order: "bi-cart-check",
            payment: "bi-credit-card",
            delivery: "bi-truck",
            promotion: "bi-tag",
            system: "bi-gear",
            security: "bi-shield-check",
            success: "bi-check-circle",
            warning: "bi-exclamation-circle",
            info: "bi-info-circle"
        };
        return icons[type] || "bi-bell";
    };

    const getNotificationColor = (type) => {
        const colors = {
            order: "primary",
            payment: "success",
            delivery: "warning",
            promotion: "info",
            system: "dark",
            security: "danger",
            success: "success",
            warning: "warning",
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
        { key: "products", icon: "bi-grid", label: "Products", active: true },
        { key: "orders", icon: "bi-cart-check", label: "Orders" },
        { key: "wishlist", icon: "bi-heart", label: "Wishlist" },
        { key: "cart", icon: "bi-cart", label: "Cart", badge: cartCount },
        { key: "voucher", icon: "bi-ticket-perforated", label: "Vouchers" },
        { key: "profile", icon: "bi-person", label: "Profile" },
        { key: "settings", icon: "bi-gear", label: "Settings" },
        { key: "faq", icon: "bi-question-circle", label: "Help Center" },
    ];

    return (
        <div className="min-vh-100 bg-light">
            {/* Top Navigation Bar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
                <div className="container-fluid">
                    {/* Brand/Logo */}
                    <div className="d-flex align-items-center">
                        <button
                            className="navbar-toggler me-2 border-0 d-lg-none"
                            type="button"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#sidebar"
                        >
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        {/* Sidebar Toggle Arrow for large screens */}
                        <button
                            className="btn btn-link text-white me-2 d-none d-lg-flex align-items-center justify-content-center"
                            onClick={toggleSidebar}
                            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                        >
                            <i className={`bi bi-chevron-${sidebarCollapsed ? 'right' : 'left'} fs-5`}></i>
                        </button>
                        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
                            <i className="bi bi-shop me-2"></i>
                            <span className="d-none d-sm-inline">Kisii University</span>
                            <span className="d-inline d-sm-none">KSU Store</span>
                        </Link>
                    </div>

                    {/* Search Bar - Only on larger screens */}
                    <div className="d-none d-lg-block flex-grow-1 mx-4" style={{ maxWidth: "500px" }}>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white border-end-0">
                                <i className="bi bi-search text-primary"></i>
                            </span>
                            <input
                                type="search"
                                className="form-control border-start-0"
                                placeholder="Search products, brands, categories..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>

                    {/* Right-side Icons */}
                    <div className="d-flex align-items-center">
                        {/* Cart Icon with Badge */}
                        <button
                            className="btn btn-link text-white position-relative me-3"
                            onClick={() => setSection("cart")}
                            title="Cart"
                        >
                            <i className="bi bi-cart fs-5"></i>
                            {cartCount > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "0.6rem" }}>
                                    {cartCount > 9 ? "9+" : cartCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications - Enhanced like Admin Dashboard */}
                        <div className="position-relative me-3" ref={notificationRef}>
                            <button
                                className="btn btn-link text-white position-relative"
                                onClick={() => setShowNotifications(!showNotifications)}
                                title="Notifications"
                            >
                                <i className="bi bi-bell fs-5"></i>
                                {unreadCount > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning" 
                                          style={{ fontSize: "0.6rem", minWidth: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>
                            
                            {/* Enhanced Notifications Panel */}
                            {showNotifications && (
                                <div className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border" 
                                     style={{ 
                                         width: "380px", 
                                         maxHeight: "500px", 
                                         overflowY: "auto",
                                         zIndex: 1001,
                                         right: "0"
                                     }}>
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
                                                    onClick={handleMarkAllAsRead}
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
                                                    className={`p-3 border-bottom ${!notification.is_read ? 'bg-light bg-opacity-25' : ''}`}
                                                    style={{ 
                                                        cursor: 'pointer',
                                                        borderLeft: !notification.is_read ? '3px solid var(--bs-primary)' : 'none'
                                                    }}
                                                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
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
                                                                                handleMarkAsRead(notification.id);
                                                                            }}
                                                                            title="Mark as read"
                                                                        >
                                                                            <i className="bi bi-check-circle"></i>
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        className="btn btn-sm btn-link p-0 text-danger"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteNotification(notification.id);
                                                                        }}
                                                                        title="Delete"
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
                                                    setSection("orders");
                                                }}
                                            >
                                                View all notifications
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User Profile Dropdown */}
                        <div className="dropdown">
                            <button
                                className="btn btn-link text-white dropdown-toggle d-flex align-items-center"
                                type="button"
                                data-bs-toggle="dropdown"
                            >
                                <img
                                    src={profilePic || defaultProfilePic}
                                    className="rounded-circle border border-white border-2"
                                    alt={username}
                                    style={{ width: "32px", height: "32px", objectFit: "cover" }}
                                />
                                <span className="ms-2 d-none d-md-inline">{username}</span>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0">
                                <li className="dropdown-header">
                                    <div className="fw-bold">{username}</div>
                                    <small className="text-muted">Customer Account</small>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item" onClick={() => setSection("profile")}>
                                        <i className="bi bi-person-circle me-2"></i> My Profile
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" onClick={() => setSection("orders")}>
                                        <i className="bi bi-box-seam me-2"></i> My Orders
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" onClick={() => setSection("wishlist")}>
                                        <i className="bi bi-heart me-2"></i> Wishlist
                                    </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item" onClick={() => setSection("voucher")}>
                                        <i className="bi bi-ticket-perforated me-2"></i> Vouchers
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" onClick={() => setSection("settings")}>
                                        <i className="bi bi-gear me-2"></i> Settings
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" onClick={() => setSection("faq")}>
                                        <i className="bi bi-question-circle me-2"></i> Help Center
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
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="container-fluid">
                <div className="row">
                    {/* Sidebar Navigation - Collapsible for desktop */}
                    <div 
                        ref={sidebarRef}
                        className={`d-none d-lg-block p-0 transition-all ${sidebarCollapsed ? 'col-lg-1 col-xl-1' : 'col-lg-2 col-xl-2'}`}
                        style={{ transition: 'all 0.3s ease' }}
                    >
                        <div className="bg-white shadow-sm min-vh-100 border-end d-flex flex-column position-relative">
                            {/* Sidebar Toggle Arrow inside sidebar (bottom) */}
                            <button
                                className="btn btn-light btn-sm position-absolute top-50 end-0 translate-middle-y rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                                onClick={toggleSidebar}
                                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                                style={{ 
                                    width: "24px", 
                                    height: "24px", 
                                    zIndex: 1000,
                                    right: "-12px"
                                }}
                            >
                                <i className={`bi bi-chevron-${sidebarCollapsed ? 'right' : 'left'}`} style={{ fontSize: "0.8rem" }}></i>
                            </button>
                            
                            {!sidebarCollapsed ? (
                                // Expanded sidebar view
                                <>
                                    <div className="p-3 border-bottom">
                                        <h6 className="fw-bold text-primary mb-0">
                                            <i className="bi bi-speedometer2 me-2"></i>
                                            Dashboard
                                        </h6>
                                        <small className="text-muted">Customer Panel</small>
                                    </div>
                                    <nav className="nav flex-column p-3 flex-grow-1" 
                                         style={{ 
                                             overflowY: "auto",
                                             maxHeight: "calc(100vh - 200px)",
                                             scrollbarWidth: "thin",
                                             scrollbarColor: "#dee2e6 #ffffff"
                                         }}>
                                        {navItems.map((item) => (
                                            <button
                                                key={item.key}
                                                className={`nav-link text-start d-flex align-items-center py-2 mb-1 rounded ${section === item.key ? 'active bg-primary text-white' : 'text-dark'}`}
                                                onClick={() => setSection(item.key)}
                                            >
                                                <i className={`bi ${item.icon} me-3`}></i>
                                                <span className="flex-grow-1">{item.label}</span>
                                                {item.badge && (
                                                    <span className={`badge ${section === item.key ? 'bg-light text-primary' : 'bg-primary'}`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </nav>

                                    <div className="p-3 border-top">
                                        <small className="text-muted d-block mb-2">Quick Stats</small>
                                        <div className="d-flex justify-content-between small">
                                            <span>Orders: <strong>{orderCount}</strong></span>
                                            <span>Cart: <strong>{cartCount}</strong></span>
                                            <span>Wishlist: <strong>{wishlistCount}</strong></span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Collapsed sidebar view (icons only)
                                <>
                                    <div className="p-3 border-bottom text-center">
                                        <i className="bi bi-speedometer2 text-primary fs-5"></i>
                                    </div>
                                    <nav className="nav flex-column p-3 flex-grow-1" 
                                         style={{ 
                                             overflowY: "auto",
                                             maxHeight: "calc(100vh - 150px)"
                                         }}>
                                        {navItems.map((item) => (
                                            <button
                                                key={item.key}
                                                className={`nav-link text-center d-flex align-items-center justify-content-center py-2 mb-1 rounded ${section === item.key ? 'active bg-primary text-white' : 'text-dark'}`}
                                                onClick={() => setSection(item.key)}
                                                title={item.label}
                                            >
                                                <div className="position-relative">
                                                    <i className={`bi ${item.icon} fs-5`}></i>
                                                    {item.badge && item.badge > 0 && (
                                                        <span className={`position-absolute top-0 start-100 translate-middle badge ${section === item.key ? 'bg-light text-primary' : 'bg-primary'}`}
                                                              style={{ fontSize: "0.5rem", minWidth: "16px", height: "16px" }}>
                                                            {item.badge > 9 ? "9+" : item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </nav>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Sidebar Offcanvas */}
                    <div className="offcanvas offcanvas-start d-lg-none" tabIndex="-1" id="sidebar" style={{ maxWidth: "280px" }}>
                        <div className="offcanvas-header border-bottom">
                            <h5 className="offcanvas-title fw-bold text-primary">
                                <i className="bi bi-shop me-2"></i>
                                KU Store
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
                        </div>
                        <div className="offcanvas-body p-0 d-flex flex-column">
                            <div className="p-3 bg-light border-bottom">
                                <div className="d-flex align-items-center">
                                    <img
                                        src={profilePic || defaultProfilePic}
                                        className="rounded-circle border border-primary border-2 me-3"
                                        alt={username}
                                        style={{ width: "48px", height: "48px", objectFit: "cover" }}
                                    />
                                    <div>
                                        <h6 className="fw-bold mb-0">{username}</h6>
                                        <small className="text-muted">Customer</small>
                                    </div>
                                </div>
                            </div>
                            <nav className="nav flex-column p-3 flex-grow-1"
                                 style={{ 
                                     overflowY: "auto",
                                     scrollbarWidth: "thin",
                                     scrollbarColor: "#dee2e6 #ffffff"
                                 }}>
                                {navItems.map((item) => (
                                    <button
                                        key={item.key}
                                        className={`nav-link text-start d-flex align-items-center py-2 mb-1 rounded ${section === item.key ? 'active bg-primary text-white' : 'text-dark'}`}
                                        onClick={() => {
                                            setSection(item.key);
                                            document.querySelector('[data-bs-dismiss="offcanvas"]').click();
                                        }}
                                        data-bs-dismiss="offcanvas"
                                    >
                                        <i className={`bi ${item.icon} me-3`}></i>
                                        <span className="flex-grow-1">{item.label}</span>
                                        {item.badge && (
                                            <span className={`badge ${section === item.key ? 'bg-light text-primary' : 'bg-primary'}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content - Adjusts based on sidebar state */}
                    <div className={`p-0 ${sidebarCollapsed ? 'col-lg-11 col-xl-11' : 'col-lg-10 col-xl-10'}`}>
                        <div className="p-3">
                            {/* Breadcrumb/Page Header */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h4 className="fw-bold text-primary mb-0">
                                        {section === "products" && <><i className="bi bi-grid me-2"></i>Products</>}
                                        {section === "orders" && <><i className="bi bi-cart-check me-2"></i>Orders</>}
                                        {section === "wishlist" && <><i className="bi bi-heart me-2"></i>Wishlist</>}
                                        {section === "voucher" && <><i className="bi bi-ticket-perforated me-2"></i>Vouchers</>}
                                        {section === "profile" && <><i className="bi bi-person me-2"></i>Profile</>}
                                        {section === "settings" && <><i className="bi bi-gear me-2"></i>Settings</>}
                                        {section === "faq" && <><i className="bi bi-question-circle me-2"></i>Help Center</>}
                                        {section === "cart" && <><i className="bi bi-cart me-2"></i>Shopping Cart</>}
                                    </h4>
                                    <nav aria-label="breadcrumb">
                                        <ol className="breadcrumb mb-0">
                                            <li className="breadcrumb-item">
                                                <button className="btn btn-link p-0 text-decoration-none" onClick={() => setSection("products")}>
                                                    Dashboard
                                                </button>
                                            </li>
                                            <li className="breadcrumb-item active text-capitalize" aria-current="page">
                                                {section}
                                            </li>
                                        </ol>
                                    </nav>
                                </div>

                                {/* Quick Actions */}
                                <div className="d-flex gap-2">
                                    {section === "products" && (
                                        <>
                                            <button className="btn btn-sm btn-outline-primary">
                                                <i className="bi bi-filter me-1"></i> Filter
                                            </button>
                                            <button className="btn btn-sm btn-outline-primary">
                                                <i className="bi bi-sort-down me-1"></i> Sort
                                            </button>
                                        </>
                                    )}
                                    {section === "cart" && (
                                        <button className="btn btn-sm btn-primary" onClick={() => setSection("orders")}>
                                            <i className="bi bi-arrow-right me-1"></i> Checkout
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="bg-white rounded shadow-sm p-0" style={{ minHeight: "calc(100vh - 180px)" }}>
                                {renderSection()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notifications */}
            {error && (
                <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1060 }}>
                    <div className="toast show" role="alert">
                        <div className="toast-header bg-danger text-white">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            <strong className="me-auto">Error</strong>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setError('')}></button>
                        </div>
                        <div className="toast-body">
                            {error}
                        </div>
                    </div>
                </div>
            )}

            {message && (
                <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1060 }}>
                    <div className="toast show" role="alert">
                        <div className="toast-header bg-success text-white">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            <strong className="me-auto">Success</strong>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setMessage('')}></button>
                        </div>
                        <div className="toast-body">
                            {message}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-dark text-white py-3 mt-4">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-6">
                            <p className="mb-0 small">
                                <i className="bi bi-shop me-1"></i> Kisii University Marketplace © 2024
                            </p>
                        </div>
                        <div className="col-md-6 text-end">
                            <small className="text-muted">
                                Buy & Sell within Kisii University Community
                            </small>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                /* Custom scrollbar for sidebar */
                .offcanvas-body::-webkit-scrollbar,
                .nav::-webkit-scrollbar {
                    width: 6px;
                }
                
                .offcanvas-body::-webkit-scrollbar-track,
                .nav::-webkit-scrollbar-track {
                    background: #f8f9fa;
                    border-radius: 3px;
                }
                
                .offcanvas-body::-webkit-scrollbar-thumb,
                .nav::-webkit-scrollbar-thumb {
                    background: #dee2e6;
                    border-radius: 3px;
                }
                
                .offcanvas-body::-webkit-scrollbar-thumb:hover,
                .nav::-webkit-scrollbar-thumb:hover {
                    background: #adb5bd;
                }
                
                /* Smooth hover effects */
                .nav-link:hover:not(.active) {
                    background-color: rgba(13, 110, 253, 0.05) !important;
                    transform: translateX(3px);
                    transition: all 0.2s ease;
                }
                
                .nav-link.active {
                    box-shadow: 0 2px 8px rgba(13, 110, 253, 0.15);
                }
                
                /* Notification panel custom scroll */
                .position-absolute::-webkit-scrollbar {
                    width: 6px;
                }
                
                .position-absolute::-webkit-scrollbar-track {
                    background: #f8f9fa;
                }
                
                .position-absolute::-webkit-scrollbar-thumb {
                    background: #ced4da;
                    border-radius: 3px;
                }
                
                .position-absolute::-webkit-scrollbar-thumb:hover {
                    background: #adb5bd;
                }
                
                /* Smooth transition for sidebar collapse */
                .transition-all {
                    transition: all 0.3s ease;
                }
                
                /* Custom notification panel styles */
                .notification-panel {
                    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                    border: 1px solid rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
}

export default CustomerDashboard;