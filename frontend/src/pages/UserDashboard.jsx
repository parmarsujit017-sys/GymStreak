
import { useState, useEffect, useCallback } from "react";
import API_URL from "../config.js";

import {
    LayoutDashboard,
    UserRound,
    CreditCard,
    CalendarCheck,
    Wallet,
    LogOut,
    Menu,
    X,
    Dumbbell,
    ChevronRight,
    Settings,
    Lock,
    RefreshCw,
    Save,
    Clock,
    AlertCircle,
    Layers,
    CheckCircle,
    CreditCard as PayIcon
} from "lucide-react";

// LOAD RAZORPAY CHECKOUT SCRIPT

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const scriptUrl =
            "https://checkout.razorpay.com/v1/checkout.js";

        const existingScript = document.querySelector(
            `script[src="${scriptUrl}"]`
        );

        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;

        script.onload = () => {
            resolve(Boolean(window.Razorpay));
        };

        script.onerror = () => {
            resolve(false);
        };

        document.body.appendChild(script);
    });
};


function UserDashboard({ onLogout }) {
    const [activePage, setActivePage] = useState("Overview");
    const [menuOpen, setMenuOpen] = useState(false);

    const [profile, setProfile] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);

    const [memberships, setMemberships] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [payments, setPayments] = useState([]);

    const [availablePlans, setAvailablePlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [paying, setPaying] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [profileForm, setProfileForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        gender: "",
        date_of_birth: ""
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // MEMBER NAVIGATION
    const navigation = [
        { name: "Overview", icon: LayoutDashboard },
        { name: "Available Plans", icon: Layers },
        { name: "My Membership", icon: CreditCard },
        { name: "My Attendance", icon: CalendarCheck },
        { name: "My Payments", icon: Wallet },
        { name: "Settings", icon: Settings }
    ];

    const getToken = () => {
        return localStorage.getItem("gymstreakUserToken");
    };

    // USER API REQUEST
    const apiRequest = async (endpoint, options = {}) => {
        const token = getToken();

        if (!token) {
            throw new Error("Login session expired. Please login again.");
        }

        const response = await fetch(
            `${API_URL}/api/users${endpoint}`,
            {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    ...options.headers
                }
            }
        );

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error("Invalid server response.");
        }

        if (response.status === 401) {
            onLogout?.();
            throw new Error("Session expired. Please login again.");
        }

        if (!response.ok || result.success === false) {
            throw new Error(result.message || "Something went wrong.");
        }

        return result;
    };

    // PAYMENT API REQUEST
    const paymentRequest = async (endpoint, body) => {
        const token = getToken();

        if (!token) {
            throw new Error("Login session expired. Please login again.");
        }

        const response = await fetch(
            `${API_URL}/api/payments${endpoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            }
        );

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error("Invalid payment server response.");
        }

        if (response.status === 401) {
            onLogout?.();
            throw new Error("Session expired. Please login again.");
        }

        if (!response.ok || result.success === false) {
            throw new Error(result.message || "Payment request failed.");
        }

        return result;
    };

    // FETCH ALL USER DATA
    const fetchUserData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [
                dashboardResult,
                profileResult,
                membershipsResult,
                attendanceResult,
                paymentsResult
            ] = await Promise.all([
                apiRequest("/dashboard"),
                apiRequest("/me"),
                apiRequest("/memberships"),
                apiRequest("/attendance"),
                apiRequest("/payments")
            ]);

            const userProfile = profileResult.data || {};

            const dashboard = {
                ...(dashboardResult.data || {}),
                linked:
                    dashboardResult.linked ??
                    dashboardResult.data?.linked ??
                    Boolean(userProfile.member_id)
            };

            setDashboardData(dashboard);
            setProfile(userProfile);

            setProfileForm({
                full_name:
                    userProfile.full_name ||
                    userProfile.user_name ||
                    "",
                email: userProfile.email || "",
                phone:
                    userProfile.phone ||
                    userProfile.member?.phone ||
                    "",
                gender:
                    userProfile.gender ||
                    userProfile.member?.gender ||
                    "",
                date_of_birth:
                    userProfile.date_of_birth
                        ? String(userProfile.date_of_birth).slice(0, 10)
                        : userProfile.member?.date_of_birth
                            ? String(userProfile.member.date_of_birth).slice(0, 10)
                            : ""
            });

            setMemberships(membershipsResult.data || []);
            setAttendance(attendanceResult.data || []);
            setPayments(paymentsResult.data || []);

        } catch (err) {
            console.error("Dashboard Error:", err);
            setError(err.message || "Unable to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }, [onLogout]);

    // FETCH AVAILABLE PLANS
    const fetchAvailablePlans = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/membership-plans`
            );

            const result = await response.json();

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message || "Unable to load membership plans."
                );
            }

            setAvailablePlans(
                (result.data || []).filter(
                    (plan) => plan.status === "Active"
                )
            );

        } catch (err) {
            console.error("Available Plans Error:", err);
            setError(err.message || "Unable to load plans.");
        }
    }, []);

    useEffect(() => {
        fetchUserData();
        fetchAvailablePlans();
    }, [fetchUserData, fetchAvailablePlans]);

    // FORMAT DATE
    const formatDate = (date) => {
        if (!date) return "—";

        const value = String(date).slice(0, 10);
        const parsed = new Date(`${value}T00:00:00`);

        if (Number.isNaN(parsed.getTime())) return value;

        return parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    // FORMAT MONEY
    const formatMoney = (amount) => {
        return `₹${Number(amount || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 2
        })}`;
    };

    // CHANGE PAGE
    const changePage = (page) => {
        setActivePage(page);
        setMenuOpen(false);
        setError("");
        setSuccess("");
    };

    // REFRESH DATA
    const handleRefreshData = async () => {
        await Promise.all([
            fetchUserData(),
            fetchAvailablePlans()
        ]);
    };

    // PROFILE INPUT CHANGE
    const handleProfileChange = (e) => {
        setProfileForm((previous) => ({
            ...previous,
            [e.target.name]: e.target.value
        }));
    };

    // SAVE PROFILE
    const handleProfileSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const result = await apiRequest("/profile", {
                method: "PUT",
                body: JSON.stringify(profileForm)
            });

            const storedUser = JSON.parse(
                localStorage.getItem("gymstreakUser") || "{}"
            );

            localStorage.setItem(
                "gymstreakUser",
                JSON.stringify({
                    ...storedUser,
                    full_name: profileForm.full_name,
                    email: profileForm.email
                })
            );

            setSuccess(
                result.message || "Profile updated successfully!"
            );

            await fetchUserData();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // CHANGE PASSWORD
    const handlePasswordChange = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (passwordForm.newPassword.length < 6) {
                throw new Error(
                    "New password must contain at least 6 characters."
                );
            }

            if (
                passwordForm.newPassword !==
                passwordForm.confirmPassword
            ) {
                throw new Error(
                    "New password and confirm password do not match."
                );
            }

            const result = await apiRequest("/password", {
                method: "PUT",
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            setSuccess(
                result.message || "Password changed successfully!"
            );

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // SELECT MEMBERSHIP PLAN
    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setError("");
        setSuccess(`${plan.plan_name} selected successfully.`);
    };

    // RAZORPAY TEST MODE PAYMENT

    // RAZORPAY TEST MODE PAYMENT
    const handlePayment = async () => {
        if (!selectedPlan) {
            setError("Please select a membership plan first.");
            return;
        }

        // GET MEMBER ID
        const memberId =
            profile?.member_id ||
            profile?.member?.member_id ||
            dashboardData?.member_id ||
            dashboardData?.member?.member_id;

        if (!memberId) {
            setError(
                "Your account is not linked to a gym member record. Please contact the gym admin."
            );
            return;
        }

        try {
            setPaying(true);
            setError("");
            setSuccess("");

            // LOAD RAZORPAY SCRIPT
            const scriptLoaded = await loadRazorpayScript();

            if (!scriptLoaded || !window.Razorpay) {
                throw new Error(
                    "Unable to load Razorpay Checkout. Please check your internet connection."
                );
            }

            // STEP 1: CREATE ORDER
            const orderResult = await paymentRequest(
                "/razorpay/order",
                {
                    plan_id: selectedPlan.plan_id
                }
            );

            if (
                !orderResult.key_id ||
                !orderResult.key_id.startsWith("rzp_test_")
            ) {
                throw new Error(
                    "Razorpay Test Mode key is not configured. Check backend configuration."
                );
            }

            if (
                !orderResult.order_id ||
                !Number(orderResult.amount)
            ) {
                throw new Error(
                    "Invalid order details received from server."
                );
            }

            // STEP 2: RAZORPAY OPTIONS
            const options = {
                key: orderResult.key_id,
                amount: orderResult.amount,
                currency: orderResult.currency || "INR",
                name: "GymStreak",

                description: `${orderResult.plan?.plan_name ||
                    selectedPlan.plan_name
                    } Membership`,

                order_id: orderResult.order_id,

                prefill: {
                    name: profile?.full_name || "",
                    email: profile?.email || ""
                },

                theme: {
                    color: "#06b6d4"
                },

                modal: {
                    ondismiss: () => {
                        setPaying(false);
                        setSuccess("");
                    }
                },

                // STEP 3: VERIFY PAYMENT
                handler: async (paymentResponse) => {
                    try {
                        setError("");
                        setSuccess("Verifying payment...");

                        const verifyResult = await paymentRequest(
                            "/razorpay/verify",
                            {
                                razorpay_order_id:
                                    paymentResponse.razorpay_order_id,

                                razorpay_payment_id:
                                    paymentResponse.razorpay_payment_id,

                                razorpay_signature:
                                    paymentResponse.razorpay_signature
                            }
                        );

                        // PAYMENT VERIFIED
                        setSelectedPlan(null);

                        setSuccess(
                            verifyResult.message ||
                            "Payment verified and membership activated successfully!"
                        );

                        // REFRESH MEMBERSHIP AND PAYMENT HISTORY
                        await fetchUserData();
                        await fetchAvailablePlans();

                        setActivePage("My Membership");

                    } catch (verifyError) {
                        console.error(
                            "Payment Verification Error:",
                            verifyError
                        );

                        setError(
                            verifyError.message ||
                            "Payment verification failed. Please contact the gym admin."
                        );
                    } finally {
                        setPaying(false);
                    }
                }
            };

            // STEP 4: CREATE CHECKOUT INSTANCE ONLY ONCE
            const razorpayCheckout = new window.Razorpay(options);

            razorpayCheckout.on("payment.failed", (response) => {
                console.error(
                    "Razorpay Payment Failed:",
                    response.error
                );

                setError(
                    response.error?.description ||
                    "Payment was not completed. Please try again."
                );

                setPaying(false);
            });

            // STEP 5: OPEN CHECKOUT
            razorpayCheckout.open();

        } catch (err) {
            console.error("Payment Error:", err);

            setError(
                err.message || "Unable to start payment."
            );

            setPaying(false);
        }
    };

// CURRENT MEMBERSHIP
const currentMembership =
    dashboardData?.membership || memberships[0] || null;

const userName =
    profile?.full_name ||
    profile?.user_name ||
    "Member";

// DASHBOARD STATISTICS
const statCards = [
    {
        title: "Membership",
        value: currentMembership?.plan_name || "No Plan",
        subtitle: currentMembership
            ? currentMembership.status
            : "No membership found",
        icon: CreditCard,
        color: "cyan",
        page: "My Membership"
    },
    {
        title: "Total Attendance",
        value: dashboardData?.total_attendance ?? attendance.length,
        subtitle: `${dashboardData?.present_days || 0} Present`,
        icon: CalendarCheck,
        color: "green",
        page: "My Attendance"
    },
    {
        title: "Total Paid",
        value: formatMoney(dashboardData?.total_paid || 0),
        subtitle: `${dashboardData?.total_payments || payments.length} Payments`,
        icon: Wallet,
        color: "purple",
        page: "My Payments"
    }
];

// OVERVIEW
function renderOverview() {
    return (
        <>
            <div className="user-welcome">
                <div>
                    <h1>Welcome, {userName} 👋</h1>
                    <p>Welcome to your GymStreak member account.</p>
                </div>

                <div className="user-online">
                    <span></span> Account Active
                </div>
            </div>

            {!dashboardData?.linked && (
                <div className="user-notice">
                    <AlertCircle size={19} />
                    Your account is not linked to a gym member record yet.
                    Contact your gym admin to link your membership.
                </div>
            )}

            <div className="user-stats">
                {statCards.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div className="user-stat-card" key={item.title}>
                            <div className={`user-stat-icon ${item.color}`}>
                                <Icon />
                            </div>

                            <h3>{item.title}</h3>
                            <div className="user-stat-value">{item.value}</div>
                            <p>{item.subtitle}</p>

                            <button onClick={() => changePage(item.page)}>
                                View Details <ChevronRight size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="user-panel">
                <h2>Current Membership</h2>
                <p className="user-muted">
                    Your current gym membership details
                </p>

                {currentMembership ? (
                    <div className="user-info-grid">
                        <div>
                            <span>Plan Name</span>
                            <strong>{currentMembership.plan_name}</strong>
                        </div>

                        <div>
                            <span>Start Date</span>
                            <strong>{formatDate(currentMembership.start_date)}</strong>
                        </div>

                        <div>
                            <span>Expiry Date</span>
                            <strong>{formatDate(currentMembership.end_date)}</strong>
                        </div>

                        <div>
                            <span>Amount</span>
                            <strong>{formatMoney(currentMembership.amount)}</strong>
                        </div>

                        <div>
                            <span>Membership Status</span>
                            <strong>{currentMembership.status}</strong>
                        </div>

                        <div>
                            <span>Payment Status</span>
                            <strong>{currentMembership.payment_status}</strong>
                        </div>
                    </div>
                ) : (
                    <p className="user-empty">
                        No membership record available.
                    </p>
                )}
            </div>

            <div className="user-panel">
                <h2>Recent Attendance</h2>
                <p className="user-muted">Your latest gym visits</p>

                {renderAttendanceTable(
                    (dashboardData?.recent_attendance || attendance).slice(0, 5)
                )}
            </div>
        </>
    );
}

// AVAILABLE PLANS
function renderAvailablePlans() {
    return (
        <div className="user-panel">
            <h2>Available Membership Plans</h2>

            <p className="user-muted">
                Choose a membership plan for your gym account.
            </p>

            {availablePlans.length === 0 ? (
                <p className="user-empty">
                    No active membership plans available right now.
                </p>
            ) : (
                <div className="user-stats user-plans-grid">
                    {availablePlans.map((plan) => (
                        <div
                            className={`user-stat-card ${selectedPlan?.plan_id === plan.plan_id
                                ? "selected-plan-card"
                                : ""
                                }`}
                            key={plan.plan_id}
                        >
                            <div className="user-stat-icon cyan">
                                <Layers />
                            </div>

                            <h3>{plan.plan_name}</h3>

                            <div className="user-stat-value">
                                {formatMoney(plan.amount)}
                            </div>

                            <p>Duration: {plan.duration} Days</p>

                            <p>
                                {plan.description || "Gym Membership Plan"}
                            </p>

                            <button
                                onClick={() => handleSelectPlan(plan)}
                            >
                                {selectedPlan?.plan_id === plan.plan_id
                                    ? "Selected"
                                    : "Choose Plan"}
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {selectedPlan && (
                <div className="user-selected-plan">
                    <h3>
                        <CheckCircle size={18} />
                        Selected Plan
                    </h3>

                    <div className="user-info-grid">
                        <div>
                            <span>Plan Name</span>
                            <strong>{selectedPlan.plan_name}</strong>
                        </div>

                        <div>
                            <span>Duration</span>
                            <strong>{selectedPlan.duration} Days</strong>
                        </div>

                        <div>
                            <span>Amount</span>
                            <strong>{formatMoney(selectedPlan.amount)}</strong>
                        </div>
                    </div>

                    <p className="user-help">
                        Continue to Razorpay Test Checkout to complete
                        your membership test transaction.
                    </p>

                    <button
                        className="user-pay-btn"
                        onClick={handlePayment}
                        disabled={paying}
                    >
                        <PayIcon size={18} />
                        {paying ? "Processing..." : "Pay Now"}
                    </button>

                    <p className="user-test-note">
                        Test Mode only. Do not use real payment details.
                    </p>
                </div>
            )}
        </div>
    );
}

// PROFILE
function renderProfile() {
    return (
        <div className="user-panel">
            <h2>My Profile</h2>
            <p className="user-muted">
                View and update your registered account information.
            </p>

            <form className="user-form" onSubmit={handleProfileSave}>
                <div className="user-form-grid">
                    <div className="user-field">
                        <label>Full Name</label>
                        <input
                            name="full_name"
                            value={profileForm.full_name}
                            onChange={handleProfileChange}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div className="user-field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={profileForm.email}
                            onChange={handleProfileChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="user-field">
                        <label>Phone Number</label>
                        <input
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileChange}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="user-field">
                        <label>Gender</label>
                        <select
                            name="gender"
                            value={profileForm.gender}
                            onChange={handleProfileChange}
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="user-field">
                        <label>Date of Birth</label>
                        <input
                            type="date"
                            name="date_of_birth"
                            value={profileForm.date_of_birth}
                            onChange={handleProfileChange}
                        />
                    </div>

                    <div className="user-field">
                        <label>User ID</label>
                        <input value={profile?.user_id || ""} disabled />
                    </div>
                </div>

                {!profile?.member_id && (
                    <p className="user-help">
                        Your account is not linked to a member record yet.
                    </p>
                )}

                <button className="user-primary-btn" disabled={saving}>
                    <Save size={17} />
                    {saving ? "Saving..." : "Save Profile"}
                </button>
            </form>
        </div>
    );
}

// MEMBERSHIP HISTORY
function renderMemberships() {
    return (
        <div className="user-panel">
            <h2>My Membership</h2>
            <p className="user-muted">
                Your gym membership and plan history.
            </p>

            {memberships.length === 0 ? (
                <p className="user-empty">
                    No membership records found.
                </p>
            ) : (
                <div className="user-table-wrap">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Plan</th>
                                <th>Duration</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {memberships.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.plan_name}</td>
                                    <td>{item.duration} Days</td>
                                    <td>{formatDate(item.start_date)}</td>
                                    <td>{formatDate(item.end_date)}</td>
                                    <td>{formatMoney(item.amount)}</td>
                                    <td>
                                        <span className={`user-badge ${String(item.payment_status).toLowerCase()}`}>
                                            {item.payment_status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`user-badge ${String(item.status).toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ATTENDANCE TABLE
function renderAttendanceTable(rows) {
    if (!rows || rows.length === 0) {
        return (
            <p className="user-empty">
                No attendance records found.
            </p>
        );
    }

    return (
        <div className="user-table-wrap">
            <table className="user-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((item) => (
                        <tr key={item.attendance_id}>
                            <td>{formatDate(item.attendance_date)}</td>
                            <td>{item.check_in || "—"}</td>
                            <td>
                                <span className={`user-badge ${String(item.status).toLowerCase()}`}>
                                    {item.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ATTENDANCE HISTORY
function renderAttendance() {
    return (
        <div className="user-panel">
            <h2>My Attendance</h2>
            <p className="user-muted">
                Your complete gym attendance history.
            </p>

            <div className="user-mini-stats">
                <div>
                    <span>Total Visits</span>
                    <strong>{dashboardData?.total_attendance || attendance.length}</strong>
                </div>

                <div>
                    <span>Present</span>
                    <strong>{dashboardData?.present_days || 0}</strong>
                </div>

                <div>
                    <span>Late</span>
                    <strong>{dashboardData?.late_days || 0}</strong>
                </div>

                <div>
                    <span>Absent</span>
                    <strong>{dashboardData?.absent_days || 0}</strong>
                </div>
            </div>

            {renderAttendanceTable(attendance)}
        </div>
    );
}

// PAYMENT HISTORY
function renderPayments() {
    return (
        <div className="user-panel">
            <h2>My Payments</h2>
            <p className="user-muted">
                Your payment transaction history.
            </p>

            <div className="user-mini-stats">
                <div>
                    <span>Total Paid</span>
                    <strong>{formatMoney(dashboardData?.total_paid || 0)}</strong>
                </div>

                <div>
                    <span>Total Transactions</span>
                    <strong>{payments.length}</strong>
                </div>
            </div>

            {payments.length === 0 ? (
                <p className="user-empty">
                    No payment records found.
                </p>
            ) : (
                <div className="user-table-wrap">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Payment ID</th>
                                <th>Plan</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Method</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {payments.map((item) => (
                                <tr key={item.payment_id}>
                                    <td>#{item.payment_id}</td>
                                    <td>{item.plan_name || "—"}</td>
                                    <td>{formatMoney(item.amount)}</td>
                                    <td>{formatDate(item.payment_date)}</td>
                                    <td>{item.payment_method}</td>
                                    <td>
                                        <span className={`user-badge ${String(item.payment_status).toLowerCase()}`}>
                                            {item.payment_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// SETTINGS
function renderSettings() {
    return (
        <>
            <div className="user-panel">
                <div className="user-settings-heading">
                    <div>
                        <h2>Account Settings</h2>
                        <p className="user-muted">
                            Manage your GymStreak account.
                        </p>
                    </div>

                    <Settings size={25} />
                </div>

                <div className="user-settings-item">
                    <div className="user-settings-icon">
                        <UserRound />
                    </div>

                    <div>
                        <strong>Profile Information</strong>
                        <p>Update your name, email and personal details.</p>
                    </div>

                    <button onClick={() => changePage("My Profile")}>
                        Edit Profile <ChevronRight size={16} />
                    </button>
                </div>

                <div className="user-settings-item">
                    <div className="user-settings-icon">
                        <Lock />
                    </div>

                    <div>
                        <strong>Change Password</strong>
                        <p>Change your account login password.</p>
                    </div>
                </div>
            </div>

            <div className="user-panel">
                <h2>Change Password</h2>
                <p className="user-muted">
                    Enter your current password and choose a new password.
                </p>

                <form className="user-form" onSubmit={handlePasswordChange}>
                    <div className="user-form-grid">
                        <div className="user-field">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) =>
                                    setPasswordForm((previous) => ({
                                        ...previous,
                                        currentPassword: e.target.value
                                    }))
                                }
                                placeholder="Current password"
                                required
                            />
                        </div>

                        <div className="user-field">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                    setPasswordForm((previous) => ({
                                        ...previous,
                                        newPassword: e.target.value
                                    }))
                                }
                                placeholder="Minimum 6 characters"
                                minLength={6}
                                required
                            />
                        </div>

                        <div className="user-field">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                    setPasswordForm((previous) => ({
                                        ...previous,
                                        confirmPassword: e.target.value
                                    }))
                                }
                                placeholder="Confirm new password"
                                minLength={6}
                                required
                            />
                        </div>
                    </div>

                    <button className="user-primary-btn" disabled={saving}>
                        <Lock size={17} />
                        {saving ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>

            <div className="user-panel user-danger-panel">
                <h2>Logout</h2>
                <p className="user-muted">
                    Logout from your GymStreak member account.
                </p>

                <button className="user-danger-btn" onClick={onLogout}>
                    <LogOut size={17} /> Logout Account
                </button>
            </div>
        </>
    );
}

// PAGE CONTENT
function renderContent() {
    switch (activePage) {
        case "Available Plans":
            return renderAvailablePlans();

        case "My Profile":
            return renderProfile();

        case "My Membership":
            return renderMemberships();

        case "My Attendance":
            return renderAttendance();

        case "My Payments":
            return renderPayments();

        case "Settings":
            return renderSettings();

        default:
            return renderOverview();
    }
}

return (
    <div className="user-app">
        <style>{`
                .user-app, .user-app * { box-sizing: border-box; }

                .user-app {
                    min-height: 100vh;
                    display: flex;
                    background: #070b16;
                    color: #f1f5f9;
                    font-family: Inter, Arial, sans-serif;
                }

                .user-sidebar {
                    width: 255px;
                    min-height: 100vh;
                    padding: 25px 17px;
                    background: #0c1424;
                    border-right: 1px solid #1e293b;
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                }

                .user-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 5px 10px 30px;
                    font-size: 20px;
                    font-weight: 900;
                }

                .user-brand-icon {
                    width: 42px;
                    height: 42px;
                    display: grid;
                    place-items: center;
                    border-radius: 13px;
                    background: linear-gradient(135deg, #087eff, #00d9ff);
                }

                .user-brand span { color: #00d9ff; }

                .user-nav-label {
                    padding: 10px;
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                }

                .user-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                }

                .user-nav button {
                    display: flex;
                    align-items: center;
                    gap: 13px;
                    width: 100%;
                    padding: 13px;
                    border: 0;
                    border-radius: 10px;
                    background: transparent;
                    color: #94a3b8;
                    text-align: left;
                    cursor: pointer;
                    font-size: 14px;
                }

                .user-nav button.active,
                .user-nav button:hover {
                    background: rgba(0, 190, 255, .12);
                    color: #00d9ff;
                }

                .user-logout {
                    margin-top: auto;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    padding: 13px;
                    border: 1px solid #273449;
                    border-radius: 10px;
                    background: transparent;
                    color: #fb7185;
                    cursor: pointer;
                }

                .user-main { flex: 1; min-width: 0; }

                .user-topbar {
                    min-height: 75px;
                    padding: 15px 30px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid #1e293b;
                    background: #0c1424;
                }

                .user-topbar h3 { font-size: 16px; }

                .user-account {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    padding: 5px 10px;
                    border: 1px solid transparent;
                    border-radius: 10px;
                    background: transparent;
                    color: #cbd5e1;
                    font-size: 13px;
                    cursor: pointer;
                }

                .user-account:hover {
                    border-color: #155e75;
                    background: #164e6333;
                }

                .user-avatar {
                    width: 38px;
                    height: 38px;
                    display: grid;
                    place-items: center;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #087eff, #00d9ff);
                    color: white;
                    font-weight: 800;
                }

                .user-content {
                    max-width: 1450px;
                    margin: auto;
                    padding: 32px;
                }

                .user-welcome {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .user-welcome h1 { font-size: 27px; margin-bottom: 9px; }

                .user-welcome p, .user-muted {
                    color: #94a3b8;
                    font-size: 13px;
                }

                .user-online { color: #4ade80; font-size: 12px; }

                .user-online span {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    margin-right: 7px;
                    border-radius: 50%;
                    background: #4ade80;
                }

                .user-stats {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 20px;
                    margin-bottom: 25px;
                }

                .user-stat-card, .user-panel {
                    padding: 23px;
                    border: 1px solid #1e293b;
                    border-radius: 16px;
                    background: #0c1424;
                    margin-bottom: 22px;
                }

                .user-stat-icon {
                    width: 45px;
                    height: 45px;
                    display: grid;
                    place-items: center;
                    border-radius: 12px;
                    margin-bottom: 18px;
                }

                .user-stat-icon svg { width: 21px; }
                .user-stat-icon.cyan { color: #22d3ee; background: #164e6333; }
                .user-stat-icon.green { color: #4ade80; background: #14532d55; }
                .user-stat-icon.purple { color: #c084fc; background: #581c8755; }

                .user-stat-card h3 { font-size: 16px; margin-bottom: 8px; }
                .user-stat-card p { color: #94a3b8; font-size: 12px; margin: 8px 0 18px; }

                .user-stat-value {
                    font-size: 23px;
                    font-weight: 800;
                    overflow-wrap: anywhere;
                }

                .user-stat-card button {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    border: 0;
                    background: transparent;
                    color: #22d3ee;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 700;
                }

                .selected-plan-card {
                    border-color: #0891b2;
                    box-shadow: 0 0 0 1px #0891b2;
                }

                .user-selected-plan {
                    margin-top: 25px;
                    padding: 20px;
                    border: 1px solid #155e75;
                    border-radius: 12px;
                    background: #164e6333;
                }

                .user-selected-plan h3 {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    margin-bottom: 10px;
                    color: #22d3ee;
                }

                .user-pay-btn {
                    display: inline-flex !important;
                    align-items: center;
                    justify-content: center;
                    gap: 9px !important;
                    margin-top: 20px;
                    padding: 13px 24px;
                    border: 0 !important;
                    border-radius: 9px;
                    background: linear-gradient(135deg, #087eff, #06b6d4) !important;
                    color: white !important;
                    font-size: 14px !important;
                    font-weight: 800 !important;
                    cursor: pointer;
                }

                .user-pay-btn:disabled {
                    opacity: .6;
                    cursor: wait;
                }

                .user-test-note {
                    margin-top: 12px !important;
                    color: #facc15 !important;
                    font-size: 11px !important;
                }

                .user-info-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 15px;
                    margin-top: 24px;
                }

                .user-info-grid div {
                    padding: 16px;
                    border: 1px solid #263449;
                    border-radius: 10px;
                    background: #091222;
                    min-width: 0;
                }

                .user-info-grid span {
                    display: block;
                    color: #94a3b8;
                    font-size: 12px;
                    margin-bottom: 9px;
                }

                .user-info-grid strong {
                    display: block;
                    overflow-wrap: anywhere;
                    font-size: 14px;
                }

                .user-form { margin-top: 25px; }

                .user-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 18px;
                    margin-bottom: 22px;
                }

                .user-field { display: flex; flex-direction: column; gap: 8px; }

                .user-field label {
                    color: #cbd5e1;
                    font-size: 13px;
                    font-weight: 600;
                }

                .user-field input, .user-field select {
                    width: 100%;
                    min-width: 0;
                    padding: 13px 14px;
                    border: 1px solid #29374d;
                    border-radius: 9px;
                    outline: none;
                    background: #091222;
                    color: #f1f5f9;
                    font-size: 13px;
                }

                .user-field input:focus, .user-field select:focus {
                    border-color: #06b6d4;
                }

                .user-field input:disabled {
                    opacity: .6;
                    cursor: not-allowed;
                }

                .user-primary-btn, .user-danger-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 9px;
                    padding: 12px 18px;
                    border: 0;
                    border-radius: 9px;
                    background: linear-gradient(135deg, #087eff, #06b6d4);
                    color: white;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .user-primary-btn:disabled { opacity: .6; cursor: wait; }

                .user-danger-btn {
                    background: #7f1d1d;
                    margin-top: 18px;
                }

                .user-table-wrap { width: 100%; overflow-x: auto; margin-top: 22px; }

                .user-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 650px;
                    font-size: 13px;
                }

                .user-table th {
                    padding: 14px;
                    text-align: left;
                    background: #091222;
                    color: #94a3b8;
                    font-weight: 700;
                    white-space: nowrap;
                }

                .user-table td {
                    padding: 15px 14px;
                    border-bottom: 1px solid #1e293b;
                    color: #cbd5e1;
                    white-space: nowrap;
                }

                .user-badge {
                    display: inline-block;
                    padding: 5px 10px;
                    border-radius: 20px;
                    background: #334155;
                    color: #e2e8f0;
                    font-size: 11px;
                    font-weight: 700;
                }

                .user-badge.paid, .user-badge.active, .user-badge.present {
                    background: #14532d;
                    color: #86efac;
                }

                .user-badge.pending, .user-badge.late {
                    background: #713f12;
                    color: #fde68a;
                }

                .user-badge.failed, .user-badge.expired,
                .user-badge.cancelled, .user-badge.absent {
                    background: #7f1d1d;
                    color: #fca5a5;
                }

                .user-mini-stats {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 13px;
                    margin: 22px 0;
                }

                .user-mini-stats div {
                    padding: 16px;
                    background: #091222;
                    border: 1px solid #263449;
                    border-radius: 10px;
                }

                .user-mini-stats span {
                    display: block;
                    color: #94a3b8;
                    font-size: 12px;
                    margin-bottom: 9px;
                }

                .user-mini-stats strong { font-size: 20px; }

                .user-empty, .user-help {
                    color: #94a3b8;
                    font-size: 13px;
                    margin-top: 22px;
                }

                .user-notice {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 15px;
                    margin-bottom: 20px;
                    border: 1px solid #854d0e;
                    border-radius: 10px;
                    background: #42200655;
                    color: #fde68a;
                    font-size: 13px;
                }

                .user-settings-heading {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #22d3ee;
                }

                .user-settings-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 18px 0;
                    margin-top: 15px;
                    border-top: 1px solid #263449;
                }

                .user-settings-icon {
                    width: 42px;
                    height: 42px;
                    display: grid;
                    place-items: center;
                    border-radius: 10px;
                    background: #164e6333;
                    color: #22d3ee;
                    flex-shrink: 0;
                }

                .user-settings-item strong { font-size: 14px; }
                .user-settings-item p { color: #94a3b8; font-size: 12px; margin-top: 5px; }

                .user-settings-item button {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    border: 0;
                    background: transparent;
                    color: #22d3ee;
                    cursor: pointer;
                    white-space: nowrap;
                }

                .user-danger-panel { border-color: #7f1d1d; }
                .user-error { color: #fca5a5; font-size: 13px; margin-bottom: 18px; }
                .user-success { color: #86efac; font-size: 13px; margin-bottom: 18px; }

                .user-mobile-menu { display: none; }

                .user-loading {
                    min-height: 300px;
                    display: grid;
                    place-items: center;
                    color: #22d3ee;
                    font-size: 14px;
                }

                .user-refresh {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    border: 1px solid #263449;
                    border-radius: 8px;
                    background: #091222;
                    color: #22d3ee;
                    padding: 9px 13px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .user-refresh:disabled {
                    opacity: .6;
                    cursor: wait;
                }

                @media (max-width: 900px) {
                    .user-sidebar { width: 215px; }
                    .user-stats { grid-template-columns: 1fr 1fr; }
                    .user-info-grid { grid-template-columns: 1fr 1fr; }
                }

                @media (max-width: 650px) {
                    .user-sidebar {
                        display: none;
                        position: fixed;
                        z-index: 10;
                        top: 0;
                        bottom: 0;
                        left: 0;
                        width: 260px;
                    }

                    .user-sidebar.open { display: flex; }
                    .user-mobile-menu { display: block; }
                    .user-content { padding: 22px 16px; }
                    .user-topbar { padding: 14px 17px; }

                    .user-stats, .user-info-grid, .user-form-grid {
                        grid-template-columns: 1fr;
                    }

                    .user-mini-stats { grid-template-columns: 1fr 1fr; }
                    .user-welcome { align-items: flex-start; flex-direction: column; }
                    .user-welcome h1 { font-size: 22px; }
                    .user-settings-item { flex-wrap: wrap; }
                    .user-settings-item button { margin-left: 0; }
                }
            `}</style>

        <aside className={`user-sidebar ${menuOpen ? "open" : ""}`}>
            <div className="user-brand">
                <div className="user-brand-icon">
                    <Dumbbell />
                </div>

                <div>GYM<span>STREAK</span></div>
            </div>

            <div className="user-nav-label">MEMBER MENU</div>

            <nav className="user-nav">
                {navigation.map((item) => {
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.name}
                            className={activePage === item.name ? "active" : ""}
                            onClick={() => changePage(item.name)}
                        >
                            <Icon size={19} />
                            {item.name}
                        </button>
                    );
                })}
            </nav>

            <button className="user-logout" onClick={onLogout}>
                <LogOut size={18} /> Logout
            </button>
        </aside>

        <main className="user-main">
            <header className="user-topbar">
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                    }}
                >
                    <button
                        className="user-mobile-menu"
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            background: "transparent",
                            border: 0,
                            color: "white",
                            cursor: "pointer"
                        }}
                    >
                        {menuOpen ? <X /> : <Menu />}
                    </button>

                    <h3>{activePage}</h3>
                </div>

                {/* CLICK PROFILE AREA TO OPEN MY PROFILE */}
                <button
                    className="user-account"
                    onClick={() => changePage("My Profile")}
                    title="View My Profile"
                >
                    <div className="user-avatar">
                        {userName.charAt(0).toUpperCase()}
                    </div>

                    <span>{userName}</span>
                    <ChevronRight size={16} />
                </button>
            </header>

            <section className="user-content">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: 15
                    }}
                >
                    <button
                        className="user-refresh"
                        onClick={handleRefreshData}
                        disabled={loading || paying}
                    >
                        <RefreshCw size={15} />
                        {loading ? "Loading..." : "Refresh Data"}
                    </button>
                </div>

                {error && <p className="user-error">{error}</p>}
                {success && <p className="user-success">{success}</p>}

                {loading ? (
                    <div className="user-loading">
                        <Clock size={19} />
                        &nbsp; Loading your account...
                    </div>
                ) : (
                    renderContent()
                )}
            </section>
        </main>
    </div>
);
}

export default UserDashboard;
