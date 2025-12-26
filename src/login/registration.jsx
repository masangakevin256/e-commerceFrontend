import { useState, useEffect } from "react";
import axios from "axios";
import "./registration.css";
import Footer from "../footer/footer";
import { Link } from "react-router-dom";
import { BASE_URL } from "../tokens/BASE_URL";

function Registration() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [agree, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [referralCode, setReferralCode] = useState('');

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
        if (message) {
            const timer = setTimeout(() => {
                setMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, message]);

    async function handleRegistration(event) {
        event.preventDefault();
        
        if (!email || !name || !password || !confirmPassword || !phoneNumber) {
            setError("Please enter all fields");
            return;
        }
        
        let formattedPhoneNumber = phoneNumber;
        if (phoneNumber.startsWith("0")) {
            formattedPhoneNumber = `+254${phoneNumber.slice(1)}`;
        } else if (!phoneNumber.startsWith("+254")) {
            formattedPhoneNumber = `+254${phoneNumber}`;
        }
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        if (!agree) {
            setError("You must agree to the terms and conditions");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(BASE_URL + `/register/customers`, {
                name,
                email,
                password,
                phoneNumber: formattedPhoneNumber,
                referralCode,
            });

            setMessage(res.data?.message || "Registration successful");
            
            if (res.data?.message) {
                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setPhoneNumber('');
                setReferralCode('');
                setAgreed(false);
            }
            
        } catch (error) {
            console.log(error);
            setError(error.response?.data?.error || error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container-fluid registration-page">
            <div className="registration-header border border-success border-5 text-center py-3">
                <h1 className="fw-bold mb-2">Welcome to Kisii University E-commerce</h1>
                <p className="mb-0">Advanced e-commerce platform</p>
            </div>
            
            <div className="registration-wrapper">
                <div className="registration-card">
                    <h2 className="text-center fw-bold mb-3">Create Account</h2>
                    <p className="text-center text-muted mb-4">Join our community and start shopping now!</p>
                    
                    <form onSubmit={handleRegistration}>
                        <div className="form-group mb-3">
                            <label htmlFor="name" className="form-label">Name</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                id="name" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required
                            />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                id="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required
                            />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                            <div className="input-group">
                                <span className="input-group-text">+254</span>
                                <input 
                                    type="tel" 
                                    className="form-control" 
                                    id="phoneNumber" 
                                    value={phoneNumber} 
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="712345678"
                                    required
                                />
                            </div>
                            <small className="text-muted mt-2 d-block">
                                Enter phone number without country code (e.g., 712345678)
                            </small>
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="referralCode" className="form-label">Referral Code (Optional)</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                id="referralCode" 
                                value={referralCode} 
                                onChange={(e) => setReferralCode(e.target.value)}
                            />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="password" className="form-label">Password</label>
                            <div className="input-group">
                                <input 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    type={showPassword ? "text" : "password"} 
                                    className="form-control" 
                                    required
                                />
                                <button 
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                                </button>
                            </div>
                        </div>
                        
                        <div className="form-group mb-3">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                            <div className="input-group">
                                <input 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    className="form-control" 
                                    required
                                />
                                <button 
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                                </button>
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <div className="form-check">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id="agree" 
                                    checked={agree} 
                                    onChange={(e) => setAgreed(e.target.checked)} 
                                    required
                                />
                                <label className="form-check-label" htmlFor="agree">
                                    I agree to the terms and conditions
                                </label>
                            </div>
                        </div>

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

                        <div className="d-grid mb-3">
                            <button 
                                type="submit" 
                                className="btn btn-primary btn-lg"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Signing up...
                                    </>
                                ) : "Sign up"}
                            </button>
                        </div>
                    </form>
                    
                    <div className="text-center mt-4 pt-3 border-top">
                        <p className="mb-0">
                            Already have an account?{" "}
                            <Link to="/" className="text-decoration-none fw-medium">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}

export default Registration;