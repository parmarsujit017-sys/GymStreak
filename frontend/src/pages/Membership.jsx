
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  CreditCard,
  Users,
  CheckCircle,
  Clock
} from "lucide-react";

const API = "http://localhost:5000/api/memberships";
const MEMBER_API = "http://localhost:5000/api/members";

const emptyForm = {
  member_id: "",
  plan_name: "Monthly",
  duration: 30,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  amount: "",
  payment_status: "Pending",
  status: "Active",
  payment_method: "Cash"
};

function Membership({ onNavigate }) {
  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Safe JSON response
  async function getResult(response) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      throw new Error(
        `Backend JSON response aapto nathi. Status: ${response.status}. Route check karo.`
      );
    }

    return response.json();
  }

  // Load Memberships
  async function loadMemberships() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API);
      const result = await getResult(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load memberships");
      }

      setMemberships(result.data || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load Members
  async function loadMembers() {
    try {
      const response = await fetch(MEMBER_API);
      const result = await getResult(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load members");
      }

      setMembers(result.data || []);

    } catch (err) {
      console.error("Member loading error:", err);
    }
  }

  useEffect(() => {
    loadMemberships();
    loadMembers();
  }, []);

  // Calculate End Date
  function calculateEndDate(start, duration) {
    if (!start || !duration) return "";

    const date = new Date(start + "T00:00:00");
    date.setDate(date.getDate() + Number(duration));

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  // Form Change
  function handleChange(e) {
    const { name, value } = e.target;

    setForm(prev => {
      const updated = { ...prev, [name]: value };

      if (name === "plan_name") {
        const durations = {
          Monthly: 30,
          Quarterly: 90,
          "Half Yearly": 180,
          Yearly: 365
        };

        updated.duration = durations[value];
      }

      if (name === "start_date" || name === "duration") {
        updated.end_date = calculateEndDate(
          name === "start_date" ? value : updated.start_date,
          name === "duration" ? value : updated.duration
        );
      }

      return updated;
    });
  }

  // Add Form
  function openAdd() {
    const start = new Date().toISOString().slice(0, 10);

    setForm({
      ...emptyForm,
      start_date: start,
      end_date: calculateEndDate(start, 30)
    });

    setEditingId(null);
    setShowForm(true);
    setMessage("");
  }

  // Edit Form
  function openEdit(item) {
    setForm({
      member_id: String(item.member_id),
      plan_name: item.plan_name || "Monthly",
      duration: item.duration || 30,
      start_date: String(item.start_date).slice(0, 10),
      end_date: String(item.end_date).slice(0, 10),
      amount: item.amount,
      payment_status: item.payment_status || "Pending",
      status: item.status || "Active",
      payment_method: item.payment_method || "Cash"
    });

    setEditingId(item.id);
    setShowForm(true);
    setMessage("");
  }

  // Save / Update
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...form,
            member_id: Number(form.member_id),
            duration: Number(form.duration),
            amount: Number(form.amount)
          })
        }
      );

      const result = await getResult(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Membership save failed");
      }

      setMessage(result.message);
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadMemberships();

    } catch (err) {
      setError(err.message);
    }
  }

  // Delete
  async function deleteMembership(id) {
    if (!window.confirm("Are you sure you want to delete this membership?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE"
      });

      const result = await getResult(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Delete failed");
      }

      setMessage(result.message);
      await loadMemberships();

    } catch (err) {
      setError(err.message);
    }
  }

  // Search
  const filteredMemberships = memberships.filter(item => {
    const member = members.find(
      m => Number(m.member_id) === Number(item.member_id)
    );

    const name = member?.full_name || "";

    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      String(item.id).includes(search) ||
      String(item.plan_name).toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeCount = memberships.filter(
    item => item.status === "Active"
  ).length;

  const paidCount = memberships.filter(
    item => item.payment_status === "Paid"
  ).length;

  const pendingCount = memberships.filter(
    item => item.payment_status === "Pending"
  ).length;

  return (
    <div className="app-layout">

      <Sidebar
        onNavigate={onNavigate}
        activePage="Membership"
      />

      <main className="main-content">

        <Header />

        <div className="dashboard-content">

          <div className="members-page">

            {/* Heading */}
            <div className="members-heading">
              <div>
                <h1>Membership Management</h1>
                <p>Manage gym membership plans and payments.</p>
              </div>

              <button
                className="add-member-btn"
                onClick={openAdd}
              >
                <Plus size={19} />
                Add Membership
              </button>
            </div>

            {/* Messages */}
            {message && (
              <div className="member-message">
                {message}
                <button onClick={() => setMessage("")}>
                  <X size={16} />
                </button>
              </div>
            )}

            {error && (
              <div className="member-message">
                {error}
                <button onClick={() => setError("")}>
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Statistics */}
            <div className="stats-grid">

              <div className="table-card">
                <Users size={25} color="#22d3ee" />
                <p>Total Memberships</p>
                <h2>{memberships.length}</h2>
              </div>

              <div className="table-card">
                <CheckCircle size={25} color="#4ade80" />
                <p>Active Memberships</p>
                <h2>{activeCount}</h2>
              </div>

              <div className="table-card">
                <CreditCard size={25} color="#c084fc" />
                <p>Paid Memberships</p>
                <h2>{paidCount}</h2>
              </div>

              <div className="table-card">
                <Clock size={25} color="#fb923c" />
                <p>Pending Payments</p>
                <h2>{pendingCount}</h2>
              </div>

            </div>

            {/* Table */}
            <div className="members-table-card">

              <div className="members-toolbar">

                <h3>All Memberships</h3>

                <div className="member-search">
                  <Search size={18} />

                  <input
                    placeholder="Search membership..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <button
                  className="refresh-btn"
                  onClick={() => {
                    loadMemberships();
                    loadMembers();
                  }}
                  title="Refresh"
                >
                  <RefreshCw size={18} />
                </button>

              </div>

              <div className="table-wrapper">

                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Member Name</th>
                      <th>Plan</th>
                      <th>Duration</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {loading ? (
                      <tr>
                        <td colSpan="10">Loading memberships...</td>
                      </tr>
                    ) : filteredMemberships.length === 0 ? (
                      <tr>
                        <td colSpan="10">
                          No memberships found. Add your first membership.
                        </td>
                      </tr>
                    ) : (
                      filteredMemberships.map(item => {
                        const member = members.find(
                          m => Number(m.member_id) === Number(item.member_id)
                        );

                        return (
                          <tr key={item.id}>
                            <td>GS{String(item.id).padStart(3, "0")}</td>

                            <td>
                              {member?.full_name || `Member #${item.member_id}`}
                            </td>

                            <td>{item.plan_name}</td>
                            <td>{item.duration} Days</td>
                            <td>{String(item.start_date).slice(0, 10)}</td>
                            <td>{String(item.end_date).slice(0, 10)}</td>

                            <td>
                              ₹{Number(item.amount).toLocaleString("en-IN")}
                            </td>

                            <td>
                              <span className={`status ${
                                (item.payment_status || "").toLowerCase()
                              }`}>
                                {item.payment_status}
                              </span>
                            </td>

                            <td>
                              <span className={`status ${
                                (item.status || "").toLowerCase()
                              }`}>
                                {item.status}
                              </span>
                            </td>

                            <td>
                              <div className="member-actions">

                                <button
                                  className="edit-btn"
                                  onClick={() => openEdit(item)}
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  className="delete-btn"
                                  onClick={() => deleteMembership(item.id)}
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>

                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}

                  </tbody>
                </table>

              </div>
            </div>

            {/* Add / Edit Modal */}
            {showForm && (
              <div className="modal-overlay">

                <div className="member-modal">

                  <div className="modal-heading">
                    <div>
                      <h2>
                        {editingId ? "Edit Membership" : "Add Membership"}
                      </h2>
                      <p>Enter membership details below.</p>
                    </div>

                    <button
                      className="close-modal"
                      onClick={() => setShowForm(false)}
                    >
                      <X />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit}>

                    <div className="form-grid">

                      <label>
                        Select Member *
                        <select
                          name="member_id"
                          value={form.member_id}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Member</option>

                          {members.map(member => (
                            <option
                              key={member.member_id}
                              value={member.member_id}
                            >
                              {member.full_name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Membership Plan *
                        <select
                          name="plan_name"
                          value={form.plan_name}
                          onChange={handleChange}
                        >
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Half Yearly">Half Yearly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </label>

                      <label>
                        Duration (Days)
                        <input
                          type="number"
                          name="duration"
                          min="1"
                          value={form.duration}
                          onChange={handleChange}
                          required
                        />
                      </label>

                      <label>
                        Amount (₹) *
                        <input
                          type="number"
                          name="amount"
                          min="0"
                          step="0.01"
                          value={form.amount}
                          onChange={handleChange}
                          placeholder="Enter amount"
                          required
                        />
                      </label>

                      <label>
                        Start Date *
                        <input
                          type="date"
                          name="start_date"
                          value={form.start_date}
                          onChange={handleChange}
                          required
                        />
                      </label>

                      <label>
                        End Date *
                        <input
                          type="date"
                          name="end_date"
                          value={form.end_date}
                          onChange={handleChange}
                          required
                        />
                      </label>

                      <label>
                        Payment Status
                        <select
                          name="payment_status"
                          value={form.payment_status}
                          onChange={handleChange}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </label>

                      <label>
                        Payment Method
                        <select
                          name="payment_method"
                          value={form.payment_method}
                          onChange={handleChange}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </label>

                      <label>
                        Membership Status
                        <select
                          name="status"
                          value={form.status}
                          onChange={handleChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Expired">Expired</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </label>

                    </div>

                    <div className="modal-buttons">

                      <button
                        type="button"
                        className="view-all"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="add-member-btn"
                      >
                        {editingId ? "Update Membership" : "Save Membership"}
                      </button>

                    </div>

                  </form>

                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default Membership;
