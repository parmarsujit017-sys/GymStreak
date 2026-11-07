
import { useState } from "react";
import API_URL from "../config.js";

function Register({ onRegisterSuccess, onBackToLogin }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
   
async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    if (form.password.length < 6) {
        setError("Password must contain at least 6 characters.");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(`${API_URL}/api/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: form.full_name.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Registration failed.");
        }

        setMessage("Registration successful!");

        setTimeout(() => {
            onRegisterSuccess?.(form.email.trim().toLowerCase());
        }, 1200);

    } catch (err) {
        console.error("Register Error:", err);

        setError(
            err.message === "Failed to fetch"
                ? "Backend server is not connected."
                : err.message
        );
    } finally {
        setLoading(false);
    }
}


  return (
    <div className="register-page">
      <div className="register-glow glow-one"></div>
      <div className="register-glow glow-two"></div>

      <div className="register-card">
        <div className="register-icon">🏋️</div>

        <h1>Join GymStreak</h1>
        <p className="register-subtitle">
          Create your account and start your fitness journey.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            name="full_name"
            type="text"
            placeholder="Enter your full name"
            value={form.full_name}
            onChange={handleChange}
            required
          />

          <label>Email Address</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            name="password"
            type="password"
            placeholder="Create password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <label>Confirm Password</label>
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          {error && <div className="register-error">{error}</div>}
          {message && <div className="register-success">{message}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="register-footer">
          Already have an account?{" "}
          <span onClick={onBackToLogin}>Login</span>
        </p>
      </div>

      <style>{`
        .register-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 25px;
          background: #070b16;
          color: #f1f5f9;
          font-family: Inter, Arial, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .register-glow {
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: .35;
          animation: registerFloat 7s ease-in-out infinite alternate;
        }

        .glow-one {
          background: #06b6d4;
          top: -100px;
          left: -100px;
        }

        .glow-two {
          background: #2563eb;
          bottom: -100px;
          right: -100px;
          animation-delay: 2s;
        }

        .register-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          padding: 35px;
          border: 1px solid rgba(103, 232, 249, .2);
          border-radius: 22px;
          background: rgba(15, 23, 42, .82);
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 70px rgba(0, 0, 0, .45);
          animation: registerAppear .7s ease;
        }

        .register-icon {
          font-size: 38px;
          text-align: center;
          margin-bottom: 12px;
        }

        .register-card h1 {
          text-align: center;
          font-size: 29px;
          margin-bottom: 8px;
          background: linear-gradient(90deg, #fff, #22d3ee);
          background-clip: text;
          color: transparent;
        }

        .register-subtitle {
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
          margin-bottom: 25px;
        }

        .register-card label {
          display: block;
          margin: 14px 0 7px;
          font-size: 13px;
          color: #cbd5e1;
        }

        .register-card input {
          width: 100%;
          padding: 13px 14px;
          border-radius: 10px;
          border: 1px solid #334155;
          outline: none;
          background: #0b1220;
          color: white;
          transition: .3s;
        }

        .register-card input:focus {
          border-color: #22d3ee;
          box-shadow: 0 0 15px rgba(34, 211, 238, .18);
        }

        .register-card button {
          width: 100%;
          padding: 14px;
          margin-top: 22px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(90deg, #0891b2, #2563eb);
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: .3s;
        }

        .register-card button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(6, 182, 212, .3);
        }

        .register-card button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .register-error, .register-success {
          font-size: 13px;
          margin-top: 14px;
          text-align: center;
        }

        .register-error { color: #f87171; }
        .register-success { color: #4ade80; }

        .register-footer {
          text-align: center;
          margin-top: 23px;
          color: #94a3b8;
          font-size: 13px;
        }

        .register-footer span {
          color: #22d3ee;
          cursor: pointer;
          font-weight: 700;
        }

        @keyframes registerFloat {
          from { transform: translate(0, 0); }
          to { transform: translate(40px, 30px); }
        }

        @keyframes registerAppear {
          from { opacity: 0; transform: translateY(25px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 480px) {
          .register-card { padding: 25px 20px; }
        }
      `}</style>
    </div>
  );
}

export default Register;
