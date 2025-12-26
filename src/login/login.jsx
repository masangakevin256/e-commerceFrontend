import { useState, useEffect } from "react";
import axios from "axios";
import './login.css';
import Footer from "../footer/footer";
import { useNavigate, Link } from "react-router-dom";
import { BASE_URL } from "../tokens/BASE_URL";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  // Clear error/message after 3s
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, message]);

  // Load saved credentials once on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  // Save/remove credentials when remember changes
  useEffect(() => {
    if (remember && email) {
      localStorage.setItem('email', email);
    } else {
      localStorage.removeItem('email');
    }
  }, [remember, email]);

  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!resetEmail) {
      setError("Please enter your email");
      return;
    }

    setResetLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/resetPassword/forgot-password`, {
        email: resetEmail
      });
      
      setMessage(res.data?.message || "Password reset instructions sent to your email");
      
      // Close modal using Bootstrap
      const modal = document.getElementById('forgotPasswordModal');
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) modalInstance.hide();
      
      setResetEmail('');
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset email");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/login/customers`, {
        email,
        password,
      }, {
        withCredentials: true
      });

      setMessage("Login successful");

      if (res.data.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }

      setTimeout(() => {
        navigate("/customer/dashboard");
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-fluid login-container">
      {/* Header Section */}
      <div className="header-section border border-success border-5">
        <div className="header-content">
          <h2 className="text-center fw-bold">Welcome to Kisii University E-commerce System</h2>
          <p className="text-center mb-0">Advanced e-commerce platform for Kisii University</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="login-content-wrapper">
        <div className="login-section">
          <div className="login-header text-center mb-4">
            <h2 className="fw-bold">Welcome Back</h2>
            <p className="mb-0">Sign in to access your account</p>
          </div>

          {/* Messages Display */}
          {(message || error) && (
            <div className="alert-container mb-4">
              {message && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <span>{message}</span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                </div>
              )}
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <span>{error}</span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="login-form">
            <div className="mb-4">
              <label htmlFor="email" className="form-label fw-medium">
                <i className="bi bi-envelope me-2"></i>Email Address
              </label>
              <div className="input-group">
                <input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="form-control form-control-lg"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-medium">
                <i className="bi bi-lock me-2"></i>Password
              </label>
              <div className="input-group">
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  className="form-control form-control-lg"
                  placeholder="Enter your password"
                  required
                />
                {/* Eye icon button for larger screens */}
                <button
                  type="button"
                  className="btn btn-outline-secondary password-toggle d-none d-md-flex"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                </button>
              </div>
              
              {/* Show Password Checkbox - Visible on mobile only, right below the password input */}
              <div className="show-password-checkbox mt-2 d-block d-md-none">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    id="showPasswordMobile"
                  />
                  <label className="form-check-label small" htmlFor="showPasswordMobile">
                    <i className="bi bi-eye me-1"></i> Show Password
                  </label>
                </div>
              </div>
            </div>

            {/* Options - Remember me and Forgot Password */}
            <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  id="rememberMe"
                />
                <label className="form-check-label" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
              <button 
                type="button" 
                className="btn btn-link text-decoration-none p-0"
                data-bs-toggle="modal"
                data-bs-target="#forgotPasswordModal"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <div className="d-grid mb-4">
              <button 
                type="submit" 
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="divider d-flex align-items-center mb-4">
              <span className="flex-grow-1 border-top"></span>
              <span className="px-3 text-muted">or</span>
              <span className="flex-grow-1 border-top"></span>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="mb-2">Don't have an account?</p>
              <Link to="/registration" className="btn btn-outline-primary btn-lg">
                <i className="bi bi-person-plus me-2"></i>
                Create New Account
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Bootstrap Forgot Password Modal */}
      <div className="modal fade" id="forgotPasswordModal" tabIndex="-1" aria-labelledby="forgotPasswordModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="forgotPasswordModalLabel">
                <i className="bi bi-key me-2"></i>
                Reset Password
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleForgotPassword}>
              <div className="modal-body">
                <p className="mb-3">Enter your email to receive a password reset link.</p>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    disabled={resetLoading}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" disabled={resetLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={resetLoading || !resetEmail}>
                  {resetLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Login;