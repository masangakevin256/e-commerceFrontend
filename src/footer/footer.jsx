import { useEffect, useState } from 'react';
import './Footer.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from "../tokens/BASE_URL";

function Footer() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [password, setPassword] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [attempts, setAttempts] = useState(0);
    const [lockUntil, setLockUntil] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    
    const navigate = useNavigate();

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (!email) return;
        
        setLoading(true);
        setTimeout(() => {
            setSubscribed(true);
            setEmail('');
            setLoading(false);
            setTimeout(() => setSubscribed(false), 3000);
        }, 1000);
    };

    // Check if login is locked
    useEffect(() => {
        if (lockUntil && new Date() < new Date(lockUntil)) {
            const timeout = setTimeout(() => {
                setLockUntil(null);
            }, new Date(lockUntil) - new Date());
            return () => clearTimeout(timeout);
        }
    }, [lockUntil]);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        
        // Check if login is locked
        if (lockUntil && new Date() < new Date(lockUntil)) {
            const remaining = Math.ceil((new Date(lockUntil) - new Date()) / 1000);
            setError(`Login locked. Try again in ${remaining} seconds`);
            return;
        }
        
        // Basic validation
        if (!adminEmail || !adminPassword) {
            setError("Please enter both email and password");
            return;
        }
        
        if (adminPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        
        try {
            setLoading(true);
            setError("");
            
            const res = await axios.post(`${BASE_URL}/login/admins`, {
                email: adminEmail,
                password: adminPassword
            });
            
            if (res.data?.message && res.data.accessToken) {
                // Store token securely
                localStorage.setItem("accessToken", res.data.accessToken);
                
                // Reset attempts on successful login
                setAttempts(0);
                setLockUntil(null);
                
                setMessage("Login successful! Redirecting...");
                
                // Clear form
                setAdminEmail("");
                setAdminPassword("");
                
                // Redirect after delay
                setTimeout(() => {
                    navigate("/admin/dashboard");
                }, 1500);
            }
            
        } catch (err) {
            // Handle login failure
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            
            // Lock after 3 failed attempts
            if (newAttempts >= 3) {
                const lockTime = new Date(Date.now() + 5 * 60 * 1000); // Lock for 5 minutes
                setLockUntil(lockTime);
                setError("Too many failed attempts. Login locked for 5 minutes.");
            } else {
                setError(err.response?.data?.error || "Invalid email or password");
            }
            
            // Clear password field for security
            setAdminPassword("");
        } finally {
            setLoading(false);
        }
    };

    const handleHiddenAdminClick = () => {
        // Only show admin login in development mode
        if (process.env.NODE_ENV === 'development') {
            setShowAdminLogin(true);
        } else {
            // In production, redirect to separate admin login page
            navigate("/admin-login");
        }
    };

    return (
        <footer className="footer mt-5">
            <div className="footer-main">
                <div className="container">
                    <div className="footer-grid">
                        {/* Logo and Description */}
                        <div className="footer-col">
                            <div className="footer-logo">
                                <h3 className="logo-text">
                                    <span className="logo-primary">Kisii</span>
                                    <span className="logo-secondary">E-Shop</span>
                                </h3>
                            </div>
                            <p className="footer-description">
                                Official e-commerce platform of Kisii University. 
                                Providing students, staff, and alumni with seamless 
                                shopping experience for academic and university merchandise.
                            </p>
                            <div className="social-links">
                                <a href="#" className="social-link" aria-label="Facebook">
                                    <i className="bi bi-facebook"></i>
                                </a>
                                <a href="#" className="social-link" aria-label="Twitter">
                                    <i className="bi bi-twitter-x"></i>
                                </a>
                                <a href="#" className="social-link" aria-label="Instagram">
                                    <i className="bi bi-instagram"></i>
                                </a>
                                <a href="#" className="social-link" aria-label="LinkedIn">
                                    <i className="bi bi-linkedin"></i>
                                </a>
                                <a href="#" className="social-link" aria-label="YouTube">
                                    <i className="bi bi-youtube"></i>
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="footer-col">
                            <h4 className="footer-title">Quick Links</h4>
                            <ul className="footer-links">
                                <li><a href="/">Home</a></li>
                                <li><a href="/products">Shop Now</a></li>
                                <li><a href="/categories">Categories</a></li>
                                <li><a href="/new-arrivals">New Arrivals</a></li>
                                <li><a href="/specials">Special Offers</a></li>
                                <li><a href="/trending">Trending Products</a></li>
                            </ul>
                        </div>

                        {/* Resources */}
                        <div className="footer-col">
                            <h4 className="footer-title">Resources</h4>
                            <ul className="footer-links">
                                <li><a href="/about">About Us</a></li>
                                <li><a href="/contact">Contact Us</a></li>
                                <li><a href="/faq">FAQ</a></li>
                                <li><a href="/shipping">Shipping Policy</a></li>
                                <li><a href="/returns">Returns & Refunds</a></li>
                                <li><a href="/privacy">Privacy Policy</a></li>
                                <li><a href="/terms">Terms of Service</a></li>
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div className="footer-col">
                            <h4 className="footer-title">Stay Updated</h4>
                            <p className="newsletter-text">
                                Subscribe to our newsletter for the latest updates, 
                                promotions, and university news.
                            </p>
                            <form className="newsletter-form" onSubmit={handleSubscribe}>
                                <div className="input-group">
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <button 
                                        type="submit" 
                                        className="subscribe-btn"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="spinner-border spinner-border-sm"></span>
                                        ) : (
                                            'Subscribe'
                                        )}
                                    </button>
                                </div>
                                {subscribed && (
                                    <div className="alert alert-success mt-2 mb-0">
                                        <i className="bi bi-check-circle me-2"></i>
                                        Successfully subscribed!
                                    </div>
                                )}
                            </form>
                            
                            {/* Contact Info */}
                            <div className="contact-info">
                                <div className="contact-item">
                                    <i className="bi bi-geo-alt-fill"></i>
                                    <span>Kisii University Main Campus, Kisii, Kenya</span>
                                </div>
                                <div className="contact-item">
                                    <i className="bi bi-telephone-fill"></i>
                                    <span>+254 123 456 789</span>
                                </div>
                                <div className="contact-item">
                                    <i className="bi bi-envelope-fill"></i>
                                    <span>support@kisii-eshop.ac.ke</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Login Modal */}
            {showAdminLogin && (
                <div className="modal fade show" style={{display: "block", backgroundColor: "rgba(0,0,0,0.7)"}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0 bg-primary text-white">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-shield-lock me-2"></i>
                                    Admin Login
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowAdminLogin(false);
                                        setError("");
                                        setMessage("");
                                        setAdminEmail("");
                                        setAdminPassword("");
                                    }}
                                ></button>
                            </div>
                            <form onSubmit={handleAdminLogin}>
                                <div className="modal-body">
                                    {/* Security Warning */}
                                    <div className="alert alert-warning border-0 mb-4">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        <strong>Security Notice:</strong> This area is restricted to authorized personnel only.
                                    </div>
                                    
                                    {/* Login Locked Message */}
                                    {lockUntil && new Date() < new Date(lockUntil) && (
                                        <div className="alert alert-danger border-0 mb-3">
                                            <i className="bi bi-lock-fill me-2"></i>
                                            Login locked until {new Date(lockUntil).toLocaleTimeString()}
                                        </div>
                                    )}
                                    
                                    {/* Messages */}
                                    {message && (
                                        <div className="alert alert-success alert-dismissible fade show mb-3">
                                            <i className="bi bi-check-circle-fill me-2"></i>
                                            {message}
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setMessage("")}
                                            ></button>
                                        </div>
                                    )}
                                    
                                    {error && !lockUntil && (
                                        <div className="alert alert-danger alert-dismissible fade show mb-3">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                            {error}
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setError("")}
                                            ></button>
                                        </div>
                                    )}
                                    
                                    {/* Login Form */}
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Admin Email</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <i className="bi bi-person-badge"></i>
                                            </span>
                                            <input
                                                type="email"
                                                className="form-control border-start-0"
                                                placeholder="admin@kisii-eshop.ac.ke"
                                                value={adminEmail}
                                                onChange={(e) => setAdminEmail(e.target.value)}
                                                disabled={!!lockUntil}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Password</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <i className="bi bi-key"></i>
                                            </span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control border-start-0"
                                                placeholder="Enter your password"
                                                value={adminPassword}
                                                onChange={(e) => setAdminPassword(e.target.value)}
                                                disabled={!!lockUntil}
                                                required
                                            />
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                            </button>
                                        </div>
                                        <small className="text-muted">
                                            <i className="bi bi-info-circle me-1"></i>
                                            {attempts > 0 && `Failed attempts: ${attempts}`}
                                        </small>
                                    </div>
                                    
                                    {/* Security Features */}
                                    <div className="form-check mb-3">
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input" 
                                            id="rememberDevice"
                                        />
                                        <label className="form-check-label" htmlFor="rememberDevice">
                                            Trust this device for 30 days
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={() => setShowAdminLogin(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary px-4"
                                        disabled={loading || (!!lockUntil && new Date() < new Date(lockUntil))}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                                Login
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Footer */}
            <div className="footer-bottom">
                <div className="container">
                    <div className="footer-bottom-content">
                        <div className="copyright">
                            <p>&copy; {new Date().getFullYear()} Kisii University E-Commerce Platform. All rights reserved.</p>
                        </div>
                        <div className="hidden-text">
                            <p 
                                className='text-muted' 
                                style={{cursor: 'pointer', fontSize: '12px'}}
                                onClick={handleHiddenAdminClick}
                                title="Admin Access (Development Only)"
                            >
                                🔒
                            </p>
                        </div>
                        <div className="payment-methods">
                            <span className="payment-label">Secure Payments:</span>
                            <div className="payment-icons">
                                <i className="bi bi-credit-card" title="Visa"></i>
                                <i className="bi bi-credit-card-2-front" title="Mastercard"></i>
                                <i className="bi bi-paypal" title="PayPal"></i>
                                <i className="bi bi-bank" title="M-Pesa"></i>
                                <i className="bi bi-phone" title="Airtel Money"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back to Top Button */}
            <button 
                className="back-to-top"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Back to top"
            >
                <i className="bi bi-chevron-up"></i>
            </button>
        </footer>
    );
}

export default Footer;