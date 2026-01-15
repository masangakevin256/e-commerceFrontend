import React, { useState, useEffect } from "react";
import axios from "axios";
import defaultProfilePic from "../../assets/avatar.png";
import { BASE_URL } from "../../tokens/BASE_URL";

function Profile({ refreshUser }) {
  const [user, setUser] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const fileInputRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}/customers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setUser(res.data);
        const userData = res.data[0];
        if (userData) {
          setFormData(prev => ({
            ...prev,
            name: userData.name || "",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || userData.phonenumber || "",
            address: userData.address || ""
          }));
        }
        if (res.data[0]?.profile_pic) {
          console.log(res.data[0].profile_pic);
          setPreviewUrl(`${BASE_URL}/uploads/profiles/${res.data[0].profile_pic}`);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Optionally auto-upload
      uploadImage(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("profile_pic", file);

      await axios.post(`${BASE_URL}/customers/upload-profile-pic`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setError("");

      // Refresh global user data (navbar icon)
      if (refreshUser) refreshUser();

    } catch (err) {
      console.error(err);
      setError("Failed to upload profile picture.");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Could not access camera.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], "profile-capture.jpg", { type: "image/jpeg" });
        setProfileImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        uploadImage(file);
        stopCamera();
      }, "image/jpeg");
    }
  };


  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset security fields when canceling
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const customerId = user[0]?.customer_id;
      const res = await axios.put(`${BASE_URL}/customers/${customerId}`, {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        password: formData.currentPassword,
        newPassword: formData.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      // Refresh data
      const fetchRes = await axios.get(`${BASE_URL}/customers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setUser(fetchRes.data);
      setIsEditing(false);
      setError("");
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
      if (refreshUser) refreshUser();
      alert("Profile updated successfully!");

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
       <div className="container py-4">
      <div className="row g-4">
        {/* Header */}
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 fw-bold text-primary">Profile Management</h1>
            <button
              className="btn btn-primary d-flex align-items-center"
              onClick={handleEditToggle}
            >
              <i className="bi bi-pencil-square me-2"></i>
              {isEditing ? "Cancel Editing" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Error and Loading States */}
        {error && (
          <div className="col-12">
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          </div>
        )}

        {loading && (
          <div className="col-12">
            <div className="alert alert-info text-center">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              Loading profile information...
            </div>
          </div>
        )}

        {/* Main Content */}
        {user.length > 0 ? (
          <>
            {/* Profile Overview Card */}
            <div className="col-lg-5 col-md-6">
              <div className="card shadow-sm border-0 rounded-3 h-100">
                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    <div className="position-relative d-inline-block">
                      <img
                        src={previewUrl || defaultProfilePic}
                        className="rounded-circle border border-4 border-primary shadow-sm"
                        alt="Profile"
                        style={{ width: "150px", height: "150px", objectFit: "cover" }}
                      />

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="d-none"
                        accept="image/*"
                        onChange={handleFileChange}
                      />

                      {/* Dropdown for Camera/Upload */}
                      <div className="dropdown position-absolute bottom-0 end-0">
                        <button
                          className="btn btn-primary btn-sm rounded-circle shadow"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className="bi bi-camera"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-dark shadow">
                          <li>
                            <button className="dropdown-item" onClick={() => fileInputRef.current.click()}>
                              <i className="bi bi-upload me-2"></i> Upload Photo
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={startCamera}>
                              <i className="bi bi-camera-fill me-2"></i> Take Photo
                            </button>
                          </li>
                          {previewUrl && (
                            <li>
                              <button className="dropdown-item text-danger" onClick={() => { setPreviewUrl(null); setProfileImage(null); }}>
                                <i className="bi bi-trash me-2"></i> Remove Photo
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Camera Modal Overlay */}
                    {showCamera && (
                      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75" style={{ zIndex: 1050 }}>
                        <div className="card bg-dark text-white border-0 shadow-lg overflow-hidden" style={{ maxWidth: "500px", width: "90%" }}>
                          <div className="card-header border-bottom border-secondary d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Capture Photo</h5>
                            <button type="button" className="btn-close btn-close-white" onClick={stopCamera}></button>
                          </div>
                          <div className="card-body p-0 bg-black">
                            <video ref={videoRef} autoPlay playsInline className="w-100 h-auto"></video>
                            <canvas ref={canvasRef} className="d-none"></canvas>
                          </div>
                          <div className="card-footer border-top border-secondary d-flex justify-content-center gap-3 py-3">
                            <button className="btn btn-light rounded-circle p-3" onClick={capturePhoto}>
                              <i className="bi bi-camera-fill fs-3 text-primary"></i>
                            </button>
                            <button className="btn btn-outline-danger rounded-circle p-3" onClick={stopCamera}>
                              <i className="bi bi-x fs-3"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <h3 className="mt-3 fw-bold">{user[0]?.name}</h3>
                    <p className="text-muted mb-0">{user[0]?.email}</p>
                    <span className="badge bg-primary mt-2">Customer ID: {user[0]?.customer_id}</span>
                  </div>

                  <hr />

                  {/* Profile Details */}
                  <div className="profile-details">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-light rounded-circle p-2 me-3">
                        <i className="bi bi-person-circle text-primary fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-0 small">Full Name</p>
                        <p className="fw-semibold mb-0">{user[0]?.name}</p>
                      </div>
                    </div>

                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-light rounded-circle p-2 me-3">
                        <i className="bi bi-envelope text-primary fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-0 small">Email Address</p>
                        <p className="fw-semibold mb-0">{user[0]?.email}</p>
                      </div>
                    </div>

                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-light rounded-circle p-2 me-3">
                        <i className="bi bi-telephone text-primary fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-0 small">Phone Number</p>
                        <p className="fw-semibold mb-0">{user[0]?.phoneNumber || user[0]?.phonenumber || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="d-flex align-items-center">
                      <div className="bg-light rounded-circle p-2 me-3">
                        <i className="bi bi-geo-alt text-primary fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-0 small">Address</p>
                        <p className="fw-semibold mb-0">{user[0]?.address || "Not provided"}</p>
                      </div>
                      {/* <div>
                        <p className="text-muted mb-0 small">Referral Code</p>
                        <p className="fw-semibold mb-0">{user[0]?.referral_code || "Not provided"}</p>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Section */}
            <div className="col-lg-7 col-md-6">
              <div className="card shadow-sm border-0 rounded-3 h-100">
                <div className="card-body p-4">
                  {/* Personal Information */}
                  <div className="mb-5">
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                        <i className="bi bi-person-badge text-primary fs-4"></i>
                      </div>
                      <h3 className="h5 fw-bold mb-0 text-primary">Personal Information</h3>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phone Number</label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          className="form-control"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Customer ID</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={user[0]?.customer_id || ""}
                          disabled
                          readOnly
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Address</label>
                        <textarea
                          name="address"
                          className="form-control"
                          rows="3"
                          value={formData.address}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Enter your address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div>
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                        <i className="bi bi-shield-lock text-primary fs-4"></i>
                      </div>
                      <h3 className="h5 fw-bold mb-0 text-primary">Security Settings</h3>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          className="form-control"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          className="form-control"
                          value={formData.newPassword}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          className="form-control"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-4 pt-3 border-top">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleEditToggle}
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={handleSaveChanges}
                            disabled={loading}
                          >
                            <i className="bi bi-check-circle me-2"></i>
                            {loading ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          !loading && (
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-person-x display-1 text-muted mb-4"></i>
                  <h3 className="h4 fw-bold text-primary mb-3">No Profile Found</h3>
                  <p className="text-muted mb-4">Please login to access your profile information.</p>
                  <button className="btn btn-primary">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Login to Continue
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Profile;