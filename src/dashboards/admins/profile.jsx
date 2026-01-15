import React, { useState, useEffect } from "react";
import axios from "axios";
import defaultProfilePic from "../../assets/avatar.png";
import { BASE_URL } from "../../tokens/BASE_URL";

function AdminProfile({ refreshUser }) {
  const [admin, setAdmin] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const[user, setUser] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "",
    permissions: [],
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const fileInputRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  

  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      const res = await axios.get(`${BASE_URL}/admins`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      // API returns a single object, not an array
      const adminData = res.data;
      setAdmin(adminData);
      console.log("Admin data:", adminData);
      
      setFormData(prev => ({
        ...prev,
        name: adminData.name || "",
        email: adminData.email || "",
        phoneNumber: adminData.phoneNumber || "",
        role: adminData.role || "Administrator",
        permissions: adminData.permissions || []
      }));

      if (adminData?.profile_pic) {
        setPreviewUrl(`http://localhost:3500/uploads/profiles/${adminData.profile_pic}`);
      }
      
    } catch (err) {
      console.error(err);
      setError("Failed to load admin profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      uploadImage(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("profile_pic", file);
      const accessToken = localStorage.getItem("accessToken");

      await axios.post(`${BASE_URL}/admins/upload-profile-pic`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setError("");
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
      const accessToken = localStorage.getItem("accessToken");
      
      // Update profile data
      await axios.put(`${BASE_URL}/admins/${admin.admin_id}`, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        password: formData.currentPassword,
        newPassword: formData.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Refresh admin data
      await fetchAdmin();
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

  const getRoleBadge = (role) => {
    const badges = {
      "Super Admin": "bg-danger",
      "Administrator": "bg-primary",
      "Manager": "bg-success",
      "Support": "bg-info",
      "Content": "bg-warning"
    };
    return badges[role] || "bg-secondary";
  };

  return (
    <div>
        { admin && (
           <div>
            <div className="container-fluid py-4">
      <div className="row g-4">
        {/* Header */}
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h2 fw-bold text-primary mb-1">Admin Profile</h1>
              <p className="text-muted mb-0">Manage your administrator account</p>
            </div>
            <button
              className="btn btn-primary d-flex align-items-center"
              onClick={handleEditToggle}
              disabled={loading}
            >
              <i className="bi bi-pencil-square me-2"></i>
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Error and Loading States */}
        {error && (
          <div className="col-12">
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {Object.keys(admin).length > 0 ? (
          <>
            {/* Profile Overview Card */}
            <div className="col-lg-4 col-md-5">
              <div className="card shadow-sm border-0 rounded-3 h-100">
                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    <div className="position-relative d-inline-block">
                      <img
                        src={previewUrl || defaultProfilePic}
                        className="rounded-circle border border-4 border-primary shadow-sm"
                        alt="Profile"
                        style={{ width: "160px", height: "160px", objectFit: "cover" }}
                      />

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="d-none"
                        accept="image/*"
                        onChange={handleFileChange}
                      />

                      {/* Profile Photo Options */}
                      <div className="dropdown position-absolute bottom-0 end-0">
                        <button
                          className="btn btn-primary btn-sm rounded-circle shadow"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          disabled={loading}
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

                    <h3 className="mt-4 fw-bold">{admin.name}</h3>
                    <p className="text-muted mb-2">{admin.email}</p>
                    <span className={`badge ${getRoleBadge(admin.role)} fs-6 px-3 py-2`}>
                      {admin.role}
                    </span>
                  </div>

                  <hr />

                  {/* Admin Details */}
                  <div className="profile-details">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-light rounded-circle p-2 me-3">
                        <i className="bi bi-person-badge text-primary fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-0 small">Admin ID</p>
                        <p className="fw-semibold mb-0">{admin.id || admin.admin_id}</p>
                      </div>
                    </div>

                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-light rounded-circle p-2 me-3">
                        <i className="bi bi-telephone text-primary fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-0 small">Phone Number</p>
                        <p className="fw-semibold mb-0">{admin.phoneNumber || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="d-flex align-items-start mb-3">
                      <div className="bg-light rounded-circle p-2 me-3">
                        <i className="bi bi-shield-check text-primary fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-2 small">Permissions</p>
                        <div className="d-flex flex-wrap gap-2">
                          {admin.permissions && admin.permissions.length > 0 ? (
                            admin.permissions.map((permission, index) => (
                              <span key={index} className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                {permission}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted small">Full access</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center">
                      <div className="bg-light rounded-circle p-2 me-3">
                        <i className="bi bi-calendar text-primary fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-0 small">Account Created</p>
                        <p className="fw-semibold mb-0">
                          {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Section */}
            <div className="col-lg-8 col-md-7">
              <div className="card shadow-sm border-0 rounded-3 h-100">
                <div className="card-body p-4">
                  {/* Personal Information */}
                  <div className="mb-5">
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                        <i className="bi bi-gear text-primary fs-4"></i>
                      </div>
                      <h3 className="h5 fw-bold mb-0 text-primary">Account Settings</h3>
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
                          disabled
                          placeholder="Email cannot be changed"
                        />
                        <small className="text-muted">Contact super admin to change email</small>
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
                        <label className="form-label fw-semibold">Admin Role</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={formData.role}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className="mb-5">
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                        <i className="bi bi-key text-primary fs-4"></i>
                      </div>
                      <h3 className="h5 fw-bold mb-0 text-primary">Permissions</h3>
                    </div>
                    <div className="card bg-light border-0">
                      <div className="card-body">
                        {formData.permissions && formData.permissions.length > 0 ? (
                          <div className="row g-2">
                            {formData.permissions.map((permission, index) => (
                              <div key={index} className="col-md-6">
                                <div className="d-flex align-items-center p-2 bg-white rounded border">
                                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                                  <span>{permission}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-3 text-muted">
                            <i className="bi bi-infinity display-5"></i>
                            <p className="mt-2 mb-0">Full administrative access</p>
                          </div>
                        )}
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
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          className="form-control"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Required for changes"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          className="form-control"
                          value={formData.newPassword}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Leave empty to keep"
                        />
                      </div>
                      <div className="col-md-4">
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
                  <i className="bi bi-person-badge display-1 text-muted mb-4"></i>
                  <h3 className="h4 fw-bold text-primary mb-3">Admin Profile Not Found</h3>
                  <p className="text-muted mb-4">Unable to load administrator profile information.</p>
                  <button className="btn btn-primary" onClick={fetchAdmin}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {/* Camera Modal */}
        {showCamera && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75" style={{ zIndex: 1050 }}>
            <div className="card bg-dark text-white border-0 shadow-lg overflow-hidden" style={{ maxWidth: "500px", width: "90%" }}>
              <div className="card-header border-bottom border-secondary d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Capture Profile Photo</h5>
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
      </div>
    </div>
           </div>
        )}
    </div>
  );
}

export default AdminProfile;