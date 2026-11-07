
import { useState, useRef } from "react";

import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  Save,
  Edit,
  Lock,
  Settings,
  Users,
  Trash2
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const defaultProfiles = {
  Admin: {
    name: "Gym Admin",
    email: "admin@gymstreak.com",
    phone: "+91 98765 43210",
    role: "Administrator",
    photo: ""
  },

  User: {
    name: "Gym User",
    email: "user@gymstreak.com",
    phone: "+91 98765 12345",
    role: "Member",
    photo: ""
  }
};

function getProfiles() {
  try {
    const saved = localStorage.getItem("gymstreak_profiles");

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        Admin: { ...defaultProfiles.Admin, ...parsed.Admin },
        User: { ...defaultProfiles.User, ...parsed.User }
      };
    }

    return defaultProfiles;
  } catch {
    return defaultProfiles;
  }
}

function Profile({ onNavigate }) {

  const [profiles, setProfiles] = useState(getProfiles);
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  const fileInputRef = useRef(null);

  const profile = profiles[selectedRole];

  // Handle Profile Photo Upload
  function handleImageUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfiles(prev => ({
        ...prev,
        [selectedRole]: {
          ...prev[selectedRole],
          photo: reader.result
        }
      }));

      setMessage("Photo selected. Click Save Changes to keep it.");
    };

    reader.onerror = () => {
      alert("Unable to read this image. Please try another.");
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // Remove Profile Photo
  function removePhoto() {
    setProfiles(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        photo: ""
      }
    }));

    setMessage("Photo removed. Click Save Changes to confirm.");
  }

  // Handle Input Changes
  function handleChange(e) {
    const { name, value } = e.target;

    setProfiles(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [name]: value
      }
    }));
  }

  // Save Profile
  function saveProfile(e) {
    e.preventDefault();

    try {
      localStorage.setItem(
        "gymstreak_profiles",
        JSON.stringify(profiles)
      );

      setEditing(false);
      setMessage("Profile updated successfully!");
    } catch {
      setMessage("Storage full. Please choose a smaller photo.");
    }
  }

  // Cancel Editing
  function cancelEdit() {
    setProfiles(getProfiles());
    setEditing(false);
    setMessage("");
  }

  return (
    <div className="app-layout">

      <Sidebar
        onNavigate={onNavigate}
        activePage="Profile"
      />

      <main className="main-content">

        <Header onNavigate={onNavigate} />

        <div className="dashboard-content">

          <div className="profile-page">

            {/* Heading */}
            <div className="profile-heading">
              <div>
                <h1>My Profile</h1>
                <p>Manage your GymStreak account details</p>
              </div>

              <span className="profile-status">
                Account Active
              </span>
            </div>

            {/* Admin and User Tabs */}
            <div className="profile-tabs">

              <button
                type="button"
                className={
                  selectedRole === "Admin" ? "selected" : ""
                }
                onClick={() => {
                  setSelectedRole("Admin");
                  setEditing(false);
                  setMessage("");
                }}
              >
                <Shield size={17} />
                Admin Profile
              </button>

              <button
                type="button"
                className={
                  selectedRole === "User" ? "selected" : ""
                }
                onClick={() => {
                  setSelectedRole("User");
                  setEditing(false);
                  setMessage("");
                }}
              >
                <Users size={17} />
                User Profile
              </button>

            </div>

            {/* Profile Card */}
            <form
              className="profile-card"
              onSubmit={saveProfile}
            >

              <div className="profile-cover"></div>

              {/* Profile Header */}
              <div className="profile-main">

                <div className="profile-avatar-large">

                  {profile.photo ? (
                    <img
                      src={profile.photo}
                      alt="Profile"
                    />
                  ) : (
                    <User size={42} />
                  )}

                </div>

                <div className="profile-name">
                  <h2>{profile.name}</h2>
                  <p>{profile.role}</p>
                </div>

                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={() => {
                    if (editing) {
                      cancelEdit();
                    } else {
                      setEditing(true);
                      setMessage("");
                    }
                  }}
                >
                  <Edit size={16} />
                  {editing ? "Cancel Edit" : "Edit Profile"}
                </button>

              </div>

              {message && (
                <div className="profile-success">
                  {message}
                </div>
              )}

              {/* Upload Photo */}
              {editing && (
                <div className="profile-upload-section">

                  <h3>Profile Photo</h3>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    hidden
                  />

                  <div className="profile-upload-actions">

                    <button
                      type="button"
                      className="upload-photo-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={17} />
                      Upload Photo
                    </button>

                    {profile.photo && (
                      <button
                        type="button"
                        className="remove-photo-btn"
                        onClick={removePhoto}
                      >
                        <Trash2 size={16} />
                        Remove Photo
                      </button>
                    )}

                  </div>

                  <p className="upload-help">
                    Select an image from your computer. Maximum size: 2 MB.
                  </p>

                </div>
              )}

              {/* Personal Information */}
              <div className="profile-details">

                <h3>Personal Information</h3>

                <div className="profile-fields">

                  <div className="profile-field">
                    <label>
                      <User size={15} />
                      Full Name
                    </label>

                    <input
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      disabled={!editing}
                      required
                    />
                  </div>

                  <div className="profile-field">
                    <label>
                      <Mail size={15} />
                      Email Address
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      disabled={!editing}
                      required
                    />
                  </div>

                  <div className="profile-field">
                    <label>
                      <Phone size={15} />
                      Mobile Number
                    </label>

                    <input
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>

                  <div className="profile-field">
                    <label>
                      <Shield size={15} />
                      Account Role
                    </label>

                    <input
                      value={profile.role}
                      disabled
                      readOnly
                    />
                  </div>

                </div>

                {editing && (
                  <button
                    type="submit"
                    className="profile-save-btn"
                  >
                    <Save size={17} />
                    Save Changes
                  </button>
                )}

              </div>

            </form>

            {/* Bottom Cards */}
            <div className="profile-bottom-grid">

              <div className="profile-info-card">
                <Lock size={22} />

                <div>
                  <h3>Security</h3>
                  <p>
                    Password settings can be connected
                    when authentication is added.
                  </p>
                </div>
              </div>

              <div className="profile-info-card">
                <Settings size={22} />

                <div>
                  <h3>Account Settings</h3>
                  <p>
                    Manage your GymStreak profile
                    information here.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Profile;
