
import { useState } from "react";

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Admin login failed.");
      }

      localStorage.setItem("gymstreakToken", data.token);
      localStorage.setItem("gymstreakRole", "admin");
      localStorage.setItem("gymstreakUser", JSON.stringify(data.admin));

      if (onLogin) onLogin("admin", data.admin);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <style>{`
        * { box-sizing: border-box; }

        .admin-login {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 25px;
          background: #070b16;
          color: #f1f5f9;
          font-family: Inter, Arial, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .admin-login::before,
        .admin-login::after {
          content: "";
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          filter: blur(110px);
          opacity: .3;
          pointer-events: none;
          animation: adminFloat 8s infinite alternate;
        }

        .admin-login::before {
          background: #00d9ff;
          top: -150px;
          left: -100px;
        }

        .admin-login::after {
          background: #3155ff;
          bottom: -150px;
          right: -100px;
        }

        .admin-card {
          width: 100%;
          max-width: 440px;
          padding: 42px;
          position: relative;
          z-index: 1;
          border: 1px solid rgba(0,217,255,.25);
          border-radius: 25px;
          background: rgba(15,23,42,.82);
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 80px rgba(0,0,0,.5),
                      0 0 35px rgba(0,217,255,.1);
          animation: adminAppear .7s ease both;
        }

        .admin-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto 20px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          background: linear-gradient(135deg,#00e5ff,#2585ff);
          color: #06111d;
          font-size: 30px;
          font-weight: 900;
          box-shadow: 0 0 30px rgba(0,217,255,.3);
        }

        .admin-card h1 {
          text-align: center;
          font-size: 28px;
          margin-bottom: 8px;
        }

        .admin-subtitle {
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 15px;
        }

        .admin-badge {
          width: fit-content;
          margin: 0 auto 28px;
          padding: 7px 14px;
          border-radius: 30px;
          border: 1px solid rgba(0,217,255,.3);
          color: #00d9ff;
          background: rgba(0,217,255,.08);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .admin-field { margin-bottom: 20px; }

        .admin-field label {
          display: block;
          color: #cbd5e1;
          font-size: 13px;
          margin-bottom: 9px;
        }

        .admin-field input {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          outline: none;
          color: white;
          background: rgba(2,6,23,.65);
          border: 1px solid #263449;
          font-size: 14px;
          transition: .3s;
        }

        .admin-field input:focus {
          border-color: #00d9ff;
          box-shadow: 0 0 0 3px rgba(0,217,255,.1);
        }

        .admin-password { position: relative; }
        .admin-password input { padding-right: 65px; }

        .admin-show {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          color: #00d9ff;
          cursor: pointer;
          font-size: 12px;
        }

        .admin-error {
          padding: 11px;
          border-radius: 9px;
          margin-bottom: 17px;
          color: #fca5a5;
          background: rgba(239,68,68,.1);
          border: 1px solid rgba(239,68,68,.3);
          font-size: 13px;
        }

        .admin-submit {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          color: #06111d;
          font-size: 15px;
          font-weight: 800;
          background: linear-gradient(100deg,#00e5ff,#2585ff);
          box-shadow: 0 8px 25px rgba(0,217,255,.2);
          transition: .3s;
        }

        .admin-submit:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,217,255,.35);
        }

        .admin-submit:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .admin-footer {
          text-align: center;
          color: #64748b;
          font-size: 12px;
          margin-top: 25px;
        }

        @keyframes adminFloat {
          to { transform: translate(40px,35px) scale(1.2); }
        }

        @keyframes adminAppear {
          from { opacity: 0; transform: translateY(25px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media(max-width:480px) {
          .admin-card { padding: 30px 22px; }
        }

        @media(prefers-reduced-motion:reduce) {
          .admin-card, .admin-login::before,
          .admin-login::after { animation: none; }
        }
      `}</style>

      <div className="admin-card">
        <div className="admin-icon">G</div>

        <h1>Admin Login</h1>
        <p className="admin-subtitle">
          Welcome to GymStreak Administration
        </p>

        <div className="admin-badge">AUTHORIZED ADMIN ONLY</div>

        <form onSubmit={handleLogin}>
          <div className="admin-field">
            <label>Admin Email</label>
            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label>Admin Password</label>
            <div className="admin-password">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="admin-show"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {error && <div className="admin-error">{error}</div>}

          <button
            className="admin-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "VERIFYING..." : "ADMIN LOGIN →"}
          </button>
        </form>

        <div className="admin-footer">
          Secure GymStreak Administration Portal
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
