
import { useState, useEffect } from "react";
import API_URL from "../config.js";

function Login({ onLogin, onRegister, initialEmail = "" }) {
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Automatically update email after registration
    useEffect(() => {
        setEmail(initialEmail);
    }, [initialEmail]);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Login failed");
            }

            const account = result.user;

            // Save User token without removing Admin token
            localStorage.setItem("gymstreakUserToken", result.token);

            localStorage.setItem(
                "gymstreakUser",
                JSON.stringify(account)
            );

            // Set role only for this browser tab
            sessionStorage.setItem("gymstreakTabRole", "user");

            // Login as User
            onLogin?.("user", account);

        } catch (err) {
            console.error("Login Error:", err);

            setError(
                err.message === "Failed to fetch"
                    ? "Server connection failed. Please start the backend."
                    : err.message || "Unable to login."
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <style>{`
                * {
                    box-sizing: border-box;
                }

                .gs-login-page {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 30px 18px;
                    position: relative;
                    overflow: hidden;
                    background: #060b16;
                    color: #f8fafc;
                    font-family: Inter, Arial, sans-serif;
                    isolation: isolate;
                }

                .gs-login-page::before,
                .gs-login-page::after {
                    content: "";
                    position: absolute;
                    width: 420px;
                    height: 420px;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: .27;
                    z-index: -1;
                    animation: gsFloat 9s ease-in-out infinite alternate;
                }

                .gs-login-page::before {
                    background: #087eff;
                    top: -170px;
                    left: -120px;
                }

                .gs-login-page::after {
                    background: #00e5ff;
                    bottom: -180px;
                    right: -100px;
                    animation-delay: 2s;
                }

                .gs-orb {
                    position: absolute;
                    border: 1px solid rgba(0, 210, 255, .17);
                    border-radius: 50%;
                    pointer-events: none;
                    animation: gsSpin 22s linear infinite;
                }

                .gs-orb-one {
                    width: 350px;
                    height: 350px;
                    top: 8%;
                    right: 5%;
                }

                .gs-orb-two {
                    width: 190px;
                    height: 190px;
                    bottom: 8%;
                    left: 5%;
                    animation-direction: reverse;
                }

                .gs-login-card {
                    width: 100%;
                    max-width: 440px;
                    position: relative;
                    z-index: 2;
                    padding: 38px;
                    border: 1px solid rgba(100, 200, 255, .2);
                    border-radius: 25px;
                    background: rgba(13, 23, 42, .83);
                    backdrop-filter: blur(22px);
                    box-shadow:
                        0 25px 80px rgba(0, 0, 0, .55),
                        0 0 35px rgba(0, 160, 255, .10),
                        inset 0 1px rgba(255, 255, 255, .07);
                    animation: gsAppear .8s ease both;
                    transition: transform .3s ease, box-shadow .3s ease;
                }

                .gs-login-card:hover {
                    transform: translateY(-5px);
                    box-shadow:
                        0 30px 90px rgba(0, 0, 0, .6),
                        0 0 45px rgba(0, 190, 255, .16);
                }

                .gs-logo {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 18px;
                    display: grid;
                    place-items: center;
                    border-radius: 19px;
                    background: linear-gradient(135deg, #087eff, #00d9ff);
                    box-shadow: 0 0 35px rgba(0, 190, 255, .35);
                    font-size: 29px;
                    font-weight: 900;
                    color: white;
                    transform: perspective(400px) rotateY(-12deg);
                }

                .gs-brand {
                    text-align: center;
                    font-size: 29px;
                    font-weight: 900;
                    letter-spacing: 1px;
                }

                .gs-brand span {
                    color: #00d9ff;
                }

                .gs-subtitle {
                    text-align: center;
                    color: #91a4bd;
                    font-size: 13px;
                    margin-top: 8px;
                    margin-bottom: 29px;
                }

                .gs-field {
                    margin-bottom: 19px;
                }

                .gs-field label {
                    display: block;
                    color: #d5e3f4;
                    font-size: 13px;
                    font-weight: 650;
                    margin-bottom: 9px;
                }

                .gs-field input {
                    width: 100%;
                    padding: 14px 15px;
                    border-radius: 11px;
                    border: 1px solid #263b55;
                    outline: none;
                    color: white;
                    background: #091526;
                    font-size: 14px;
                    transition: .25s;
                }

                .gs-field input:focus {
                    border-color: #00cfff;
                    box-shadow: 0 0 0 3px rgba(0, 207, 255, .10);
                }

                .gs-field input::placeholder {
                    color: #637891;
                }

                .gs-password {
                    position: relative;
                }

                .gs-password input {
                    padding-right: 65px;
                }

                .gs-show {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    border: 0;
                    color: #00d9ff;
                    background: transparent;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 700;
                }

                .gs-error {
                    padding: 11px 13px;
                    margin-bottom: 17px;
                    border: 1px solid rgba(255, 80, 100, .3);
                    border-radius: 9px;
                    background: rgba(255, 60, 80, .08);
                    color: #ff8796;
                    font-size: 13px;
                }

                .gs-submit {
                    width: 100%;
                    padding: 15px;
                    margin-top: 7px;
                    border: none;
                    border-radius: 11px;
                    background: linear-gradient(110deg, #087eff, #00d9ff);
                    color: white;
                    font-size: 15px;
                    font-weight: 800;
                    cursor: pointer;
                    box-shadow: 0 8px 25px rgba(0, 150, 255, .25);
                    transition: .25s;
                }

                .gs-submit:hover:not(:disabled) {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 32px rgba(0, 190, 255, .4);
                }

                .gs-submit:disabled {
                    opacity: .65;
                    cursor: not-allowed;
                }

                .gs-register {
                    text-align: center;
                    color: #91a4bd;
                    font-size: 13px;
                    margin-top: 24px;
                }

                .gs-register button {
                    border: none;
                    background: transparent;
                    color: #00d9ff;
                    font-weight: 750;
                    cursor: pointer;
                    margin-left: 4px;
                }

                .gs-footer {
                    text-align: center;
                    color: #52657d;
                    font-size: 11px;
                    margin-top: 26px;
                }

                @keyframes gsFloat {
                    from {
                        transform: translate(0, 0) scale(1);
                    }
                    to {
                        transform: translate(45px, -35px) scale(1.15);
                    }
                }

                @keyframes gsSpin {
                    from {
                        transform: rotate(0deg) rotateX(55deg);
                    }
                    to {
                        transform: rotate(360deg) rotateX(55deg);
                    }
                }

                @keyframes gsAppear {
                    from {
                        opacity: 0;
                        transform: perspective(900px) rotateX(12deg) translateY(35px);
                    }
                    to {
                        opacity: 1;
                        transform: perspective(900px) rotateX(0) translateY(0);
                    }
                }

                @media (max-width: 480px) {
                    .gs-login-card {
                        padding: 27px 21px;
                    }

                    .gs-brand {
                        font-size: 25px;
                    }

                    .gs-orb-one {
                        right: -160px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .gs-login-page *,
                    .gs-login-page::before,
                    .gs-login-page::after {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>

            <div className="gs-login-page">
                <div className="gs-orb gs-orb-one"></div>
                <div className="gs-orb gs-orb-two"></div>

                <div className="gs-login-card">
                    <div className="gs-logo">G</div>

                    <div className="gs-brand">
                        GYM<span>STREAK</span>
                    </div>

                    <p className="gs-subtitle">
                        Welcome back! Sign in to continue.
                    </p>

                    <form onSubmit={handleLogin}>
                        <div className="gs-field">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="gs-field">
                            <label>Password</label>

                            <div className="gs-password">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                                <button
                                    type="button"
                                    className="gs-show"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "HIDE" : "SHOW"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="gs-error">{error}</div>
                        )}

                        <button
                            type="submit"
                            className="gs-submit"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "SIGN IN →"}
                        </button>
                    </form>

                    <div className="gs-register">
                        Don't have an account?
                        <button
                            type="button"
                            onClick={onRegister}
                        >
                            Register
                        </button>
                    </div>

                    <div className="gs-register" style={{ marginTop: "14px" }}>
                        Are you an administrator?
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem("gymstreakRole");
                                window.location.href = "/admin";
                            }}
                        >
                            Admin Login
                        </button>
                    </div>

                    <div className="gs-footer">
                        © 2026 GYMSTREAK · FITNESS MANAGEMENT SYSTEM
                    </div>
                </div>
            </div>
        </>
    );
}

export default Login;
