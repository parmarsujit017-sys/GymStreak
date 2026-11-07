
import { useEffect, useState } from "react";

import {
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    Layers,
    Clock,
    IndianRupee,
    RefreshCw
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const API = "http://localhost:5000/api/membership-plans";

const emptyForm = {
    plan_name: "",
    duration: "",
    amount: "",
    description: "",
    status: "Active"
};

const primaryButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 20px",
    background: "#22d3ee",
    color: "#07111f",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 14px rgba(34,211,238,0.2)"
};

const inputStyle = {
    width: "100%",
    padding: "12px",
    marginTop: "7px",
    marginBottom: "16px",
    borderRadius: "8px",
    background: "#0b1220",
    border: "1px solid #334155",
    color: "white",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box"
};

const labelStyle = {
    display: "block",
    color: "#cbd5e1",
    fontSize: "14px",
    fontWeight: "500"
};

function Plans({ onNavigate }) {
    const [plans, setPlans] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    // Auto hide success message after 3 seconds
    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [success]);

    const token = localStorage.getItem("gymstreakToken");

    // Load Plans
    async function loadPlans() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(API);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to load plans"
                );
            }

            setPlans(
                Array.isArray(result.data)
                    ? result.data
                    : []
            );

        } catch (err) {
            console.error("Plans Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPlans();
    }, []);

    // Open Add Modal
    function openAddModal() {
        setEditingId(null);
        setForm(emptyForm);
        setError("");
        setShowModal(true);
    }

    // Open Edit Modal
    function openEditModal(plan) {
        setEditingId(plan.plan_id);

        setForm({
            plan_name: plan.plan_name || "",
            duration: plan.duration || "",
            amount: plan.amount || "",
            description: plan.description || "",
            status: plan.status || "Active"
        });

        setError("");
        setShowModal(true);
    }

    // Close Modal
    function closeModal() {
        setShowModal(false);
        setEditingId(null);
        setForm(emptyForm);
        setError("");
    }

    // Handle Input
    function handleChange(e) {
        const { name, value } = e.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    // Add / Update Plan
    async function handleSubmit(e) {
        e.preventDefault();

        if (!token) {
            setError("Admin login required. Please login again.");
            return;
        }

        if (
            !form.plan_name.trim() ||
            !form.duration ||
            !form.amount
        ) {
            setError("Please fill all required fields.");
            return;
        }

        if (
            Number(form.duration) <= 0 ||
            Number(form.amount) <= 0
        ) {
            setError("Duration and amount must be greater than zero.");
            return;
        }

        const isEditing = Boolean(editingId);

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const url = isEditing
                ? `${API}/${editingId}`
                : API;

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan_name: form.plan_name.trim(),
                    duration: Number(form.duration),
                    amount: Number(form.amount),
                    description: form.description.trim(),
                    status: form.status
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to save plan"
                );
            }

            closeModal();

            setSuccess(
                isEditing
                    ? "Membership plan updated successfully."
                    : "Membership plan added successfully."
            );

            await loadPlans();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    // Delete Plan
    async function handleDelete(id) {
        if (!token) {
            setError("Admin login required.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this plan?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            const response = await fetch(`${API}/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to delete plan"
                );
            }

            setSuccess("Membership plan deleted successfully.");

            await loadPlans();

        } catch (err) {
            setError(err.message);
        }
    }

    // Search Plans
    const filteredPlans = plans.filter(plan =>
        plan.plan_name
            ?.toLowerCase()
            .includes(search.toLowerCase())
    );

    // Statistics
    const activePlans = plans.filter(
        plan => plan.status === "Active"
    ).length;

    const inactivePlans = plans.filter(
        plan => plan.status === "Inactive"
    ).length;

    return (
        <div className="app-layout">

            <Sidebar
                onNavigate={onNavigate}
                activePage="Plans"
            />

            <main className="main-content">

                <Header onNavigate={onNavigate} />

                <div className="dashboard-content">

                    {/* Welcome Section */}
                    <div className="welcome-section">

                        <div>
                            <h1>Membership Plans</h1>
                            <p>
                                Manage your gym membership packages.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openAddModal}
                            style={primaryButtonStyle}
                        >
                            <Plus size={18} />
                            Add New Plan
                        </button>

                    </div>

                    {/* Statistics Cards */}
                    <div className="stats-grid">

                        <div className="stat-card">
                            <div>
                                <p>Total Plans</p>
                                <h2>{plans.length}</h2>
                            </div>

                            <Layers
                                size={25}
                                color="#22d3ee"
                            />
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>Active Plans</p>
                                <h2>{activePlans}</h2>
                            </div>

                            <Clock
                                size={25}
                                color="#4ade80"
                            />
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>Inactive Plans</p>
                                <h2>{inactivePlans}</h2>
                            </div>

                            <IndianRupee
                                size={25}
                                color="#c084fc"
                            />
                        </div>

                    </div>

                    {/* Error Message */}
                    {error && !showModal && (
                        <p style={{
                            color: "#f87171",
                            marginTop: 15
                        }}>
                            {error}
                        </p>
                    )}

                    {/* Success Message */}
                    {success && (
                        <p style={{
                            color: "#4ade80",
                            marginTop: 15
                        }}>
                            {success}
                        </p>
                    )}

                    {/* Plans Table */}
                    <div className="table-card">

                        <div className="section-heading">

                            <div>
                                <h3>All Membership Plans</h3>
                                <p>Available gym packages</p>
                            </div>

                            <button
                                type="button"
                                className="view-all"
                                onClick={loadPlans}
                                disabled={loading}
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>

                        </div>

                        {/* Search */}
                        <div style={{
                            padding: "0 20px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10
                        }}>

                            <Search size={18} />

                            <input
                                type="text"
                                placeholder="Search membership plans..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    borderRadius: 8,
                                    background: "#111827",
                                    border: "1px solid #334155",
                                    color: "white",
                                    outline: "none",
                                    boxSizing: "border-box"
                                }}
                            />

                        </div>

                        {/* Table */}
                        <div className="table-wrapper">

                            <table>

                                <thead>
                                    <tr>
                                        <th>Plan ID</th>
                                        <th>Plan Name</th>
                                        <th>Duration</th>
                                        <th>Amount</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {loading ? (
                                        <tr>
                                            <td colSpan="7">
                                                Loading plans...
                                            </td>
                                        </tr>
                                    ) : filteredPlans.length === 0 ? (
                                        <tr>
                                            <td colSpan="7">
                                                No membership plans found.
                                            </td>
                                        </tr>
                                    ) : (

                                        filteredPlans.map(plan => (

                                            <tr key={plan.plan_id}>

                                                <td>
                                                    PL{String(plan.plan_id).padStart(3, "0")}
                                                </td>

                                                <td>{plan.plan_name}</td>

                                                <td>{plan.duration} Days</td>

                                                <td>
                                                    ₹{Number(plan.amount).toLocaleString("en-IN")}
                                                </td>

                                                <td>
                                                    {plan.description || "-"}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`status ${(plan.status || "").toLowerCase()
                                                            }`}
                                                    >
                                                        {plan.status}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div style={{
                                                        display: "flex",
                                                        gap: 8
                                                    }}>

                                                        <button
                                                            type="button"
                                                            className="view-all"
                                                            title="Edit Plan"
                                                            onClick={() => openEditModal(plan)}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="view-all"
                                                            title="Delete Plan"
                                                            onClick={() => handleDelete(plan.plan_id)}
                                                            style={{
                                                                color: "#f87171"
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>

                                                    </div>
                                                </td>

                                            </tr>

                                        ))

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            </main>

            {/* Add / Edit Modal */}
            {showModal && (

                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.75)",
                    display: "grid",
                    placeItems: "center",
                    zIndex: 1000,
                    padding: 15
                }}>

                    <div style={{
                        width: "100%",
                        maxWidth: 500,
                        maxHeight: "90vh",
                        overflowY: "auto",
                        background: "#111827",
                        border: "1px solid #334155",
                        borderRadius: 14,
                        padding: 24,
                        color: "white",
                        boxSizing: "border-box"
                    }}>

                        {/* Modal Header */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 22
                        }}>

                            <h2 style={{
                                fontSize: 20,
                                margin: 0
                            }}>
                                {editingId
                                    ? "Edit Membership Plan"
                                    : "Add Membership Plan"}
                            </h2>

                            <button
                                type="button"
                                onClick={closeModal}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "transparent",
                                    border: "none",
                                    color: "white",
                                    cursor: "pointer"
                                }}
                            >
                                <X size={22} />
                            </button>

                        </div>

                        {/* Plan Form */}
                        <form onSubmit={handleSubmit}>

                            <label style={labelStyle}>
                                Plan Name *
                            </label>

                            <input
                                name="plan_name"
                                value={form.plan_name}
                                onChange={handleChange}
                                placeholder="Example: Monthly Plan"
                                style={inputStyle}
                                required
                            />

                            <label style={labelStyle}>
                                Duration (Days) *
                            </label>

                            <input
                                name="duration"
                                type="number"
                                min="1"
                                value={form.duration}
                                onChange={handleChange}
                                placeholder="30"
                                style={inputStyle}
                                required
                            />

                            <label style={labelStyle}>
                                Amount (₹) *
                            </label>

                            <input
                                name="amount"
                                type="number"
                                min="1"
                                step="0.01"
                                value={form.amount}
                                onChange={handleChange}
                                placeholder="999"
                                style={inputStyle}
                                required
                            />

                            <label style={labelStyle}>
                                Description
                            </label>

                            <input
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Plan details"
                                style={inputStyle}
                            />

                            <label style={labelStyle}>
                                Status
                            </label>

                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>

                            {/* Modal Error */}
                            {error && (
                                <p style={{
                                    color: "#f87171",
                                    fontSize: 13
                                }}>
                                    {error}
                                </p>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    ...primaryButtonStyle,
                                    width: "100%",
                                    padding: "13px",
                                    marginTop: 5,
                                    opacity: saving ? 0.7 : 1,
                                    cursor: saving ? "not-allowed" : "pointer"
                                }}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Plan"
                                        : "Add Plan"}
                            </button>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Plans;
