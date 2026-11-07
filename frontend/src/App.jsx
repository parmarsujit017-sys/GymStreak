
import { useState } from "react";

import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Trainers from "./pages/Trainers";
import Profile from "./pages/Profile";
import Membership from "./pages/Membership";
import Attendance from "./pages/Attendance";
import Payments from "./pages/Payments";
import UserDashboard from "./pages/UserDashboard";
import Plans from "./pages/Plans";

// Get session separately for each browser tab
function getSavedSession() {
    const path = window.location.pathname;
    const tabRole = sessionStorage.getItem("gymstreakTabRole");

    const adminToken = localStorage.getItem("gymstreakToken");
    const userToken = localStorage.getItem("gymstreakUserToken");

    // Admin URL
    if (path === "/admin") {
        if (tabRole === "admin" && adminToken) {
            return {
                role: "admin",
                page: "Dashboard"
            };
        }

        return {
            role: "",
            page: "AdminLogin"
        };
    }

    // User URL
    if (tabRole === "user" && userToken) {
        return {
            role: "user",
            page: "UserDashboard"
        };
    }

    return {
        role: "",
        page: "Login"
    };
}

function App() {
    const [initialSession] = useState(() => getSavedSession());

    const [activePage, setActivePage] = useState(initialSession.page);
    const [role, setRole] = useState(initialSession.role);

    const [registeredEmail, setRegisteredEmail] = useState("");

    // Login Success
    function handleLogin(userRole, account) {
        if (userRole === "admin") {
            // Keep user token untouched
            sessionStorage.setItem("gymstreakTabRole", "admin");

            setRole("admin");
            setActivePage("Dashboard");

            window.history.replaceState({}, "", "/admin");

        } else if (userRole === "user") {
            // Keep admin token untouched
            sessionStorage.setItem("gymstreakTabRole", "user");

            setRole("user");
            setActivePage("UserDashboard");

            window.history.replaceState({}, "", "/");
        }
    }

    // Logout only current tab's account
    function handleLogout() {
        const currentRole =
            sessionStorage.getItem("gymstreakTabRole") || role;

        if (currentRole === "admin") {
            localStorage.removeItem("gymstreakToken");
            localStorage.removeItem("gymstreakAdminToken");

            sessionStorage.removeItem("gymstreakTabRole");

            setRole("");
            setActivePage("AdminLogin");

            window.history.replaceState({}, "", "/admin");

        } else {
            localStorage.removeItem("gymstreakUserToken");
            localStorage.removeItem("gymstreakUser");

            sessionStorage.removeItem("gymstreakTabRole");

            setRole("");
            setActivePage("Login");

            window.history.replaceState({}, "", "/");
        }
    }

    // Navigate Pages
    function handleNavigate(page) {
        if (page === "Logout") {
            handleLogout();
            return;
        }

        setActivePage(page);
    }

    // Admin Login
    if (activePage === "AdminLogin") {
        return <AdminLogin onLogin={handleLogin} />;
    }

    // User Login
    if (activePage === "Login") {
        return (
            <Login
                onLogin={handleLogin}
                onRegister={() => setActivePage("Register")}
                initialEmail={registeredEmail}
            />
        );
    }

    // User Register
    if (activePage === "Register") {
        return (
            <Register
                onRegisterSuccess={(email) => {
                    setRegisteredEmail(email);
                    setActivePage("Login");
                }}
                onBackToLogin={() => setActivePage("Login")}
            />
        );
    }

    // User Dashboard Protection
    if (activePage === "UserDashboard") {
        if (
            role !== "user" ||
            sessionStorage.getItem("gymstreakTabRole") !== "user" ||
            !localStorage.getItem("gymstreakUserToken")
        ) {
            return <Login onLogin={handleLogin} />;
        }

        return <UserDashboard onLogout={handleLogout} />;
    }

    // Admin Pages Protection
    if (
        role !== "admin" ||
        sessionStorage.getItem("gymstreakTabRole") !== "admin" ||
        !localStorage.getItem("gymstreakToken")
    ) {
        return <AdminLogin onLogin={handleLogin} />;
    }

    // Admin Pages
    return (
        <>
            {activePage === "Dashboard" && (
                <Dashboard onNavigate={handleNavigate} />
            )}

            {activePage === "Members" && (
                <Members onNavigate={handleNavigate} />
            )}

            {activePage === "Trainers" && (
                <Trainers onNavigate={handleNavigate} />
            )}

            {activePage === "Profile" && (
                <Profile onNavigate={handleNavigate} />
            )}

            {activePage === "Membership" && (
                <Membership onNavigate={handleNavigate} />
            )}

            {activePage === "Attendance" && (
                <Attendance onNavigate={handleNavigate} />
            )}

            {activePage === "Payments" && (
                <Payments onNavigate={handleNavigate} />
            )}

            {activePage === "Plans" && (
                <Plans onNavigate={handleNavigate} />
            )}
        </>
    );
}

export default App;
