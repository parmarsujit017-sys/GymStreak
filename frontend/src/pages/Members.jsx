
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Users,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle
} from "lucide-react";

const API = "http://localhost:5000/api/members";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  gender: "",
  date_of_birth: "",
  join_date: new Date().toISOString().slice(0, 10),
  membership_plan: "Basic",
  status: "Active"
};

function Members({ onNavigate }) {
  const [members, setMembers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState({});

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(null);
  const [message, setMessage] = useState("");

  // ADMIN TOKEN
  function getAdminToken() {
    return localStorage.getItem("gymstreakToken");
  }

  // LOAD MEMBERS
  async function loadMembers() {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}?search=${encodeURIComponent(search)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load members");
      }

      setMembers(result.data || []);

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // LOAD REGISTERED USERS (ADMIN ONLY)
  async function loadRegisteredUsers() {
    try {
      const token = getAdminToken();

      if (!token) {
        throw new Error("Admin token not found. Please login again.");
      }

      const response = await fetch(
        `${API}/registered-users`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load registered users"
        );
      }

      setRegisteredUsers(result.data || []);

    } catch (error) {
      setMessage(error.message);
    }
  }

  // LOAD DATA
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMembers();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadRegisteredUsers();
  }, []);

  // REFRESH BOTH
  async function refreshData() {
    await Promise.all([
      loadMembers(),
      loadRegisteredUsers()
    ]);
  }

  // FORM CHANGE
  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  // OPEN ADD
  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setMessage("");
  }

  // OPEN EDIT
  function openEdit(member) {
    setForm({
      full_name: member.full_name || "",
      email: member.email || "",
      phone: member.phone || "",
      gender: member.gender || "",
      date_of_birth: member.date_of_birth
        ? String(member.date_of_birth).slice(0, 10)
        : "",
      join_date: member.join_date
        ? String(member.join_date).slice(0, 10)
        : "",
      membership_plan: member.membership_plan || "Basic",
      status: member.status || "Active"
    });

    setEditingId(member.member_id);
    setShowForm(true);
    setMessage("");
  }

  // ADD / UPDATE MEMBER
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
          body: JSON.stringify(form)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Something went wrong"
        );
      }

      setMessage(
        result.message || "Member saved successfully"
      );

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);

      await loadMembers();

    } catch (error) {
      setMessage(error.message);
    }
  }

  // DELETE MEMBER
  async function deleteMember(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this member?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE"
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Delete failed"
        );
      }

      setMessage(
        result.message || "Member deleted successfully"
      );

      await refreshData();

    } catch (error) {
      setMessage(error.message);
    }
  }

  // LINK USER WITH MEMBER
  async function handleLinkUser(memberId) {
    const userId = selectedUsers[memberId];

    if (!userId) {
      setMessage("Please select a registered user.");
      return;
    }

    try {
      setLinkLoading(memberId);
      setMessage("");

      const token = getAdminToken();

      if (!token) {
        throw new Error("Admin token not found. Please login again.");
      }

      const response = await fetch(
        `${API}/${memberId}/link-user`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: Number(userId)
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to link user"
        );
      }

      setMessage(result.message || "User linked successfully");

      setSelectedUsers((previous) => ({
        ...previous,
        [memberId]: ""
      }));

      await loadRegisteredUsers();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLinkLoading(null);
    }
  }

  return (
    <div className="app-layout">

      {/* SIDEBAR */}
      <Sidebar
        onNavigate={onNavigate}
        activePage="Members"
      />

      {/* MAIN CONTENT */}
      <main className="main-content">

        <Header />

        <div className="dashboard-content">

          <div className="members-page">

            {/* PAGE HEADING */}
            <div className="members-heading">

              <div>
                <h1>Member Management</h1>

                <p>
                  Manage your gym members and membership details.
                </p>
              </div>

              <button
                className="add-member-btn"
                onClick={openAdd}
              >
                <Plus size={19} />
                Add Member
              </button>

            </div>

            {/* MESSAGE */}
            {message && (
              <div className="member-message">

                {message}

                <button
                  type="button"
                  onClick={() => setMessage("")}
                >
                  <X size={16} />
                </button>

              </div>
            )}

            {/* SUMMARY */}
            <div className="member-summary">

              <Users size={24} />

              <div>
                <span>Total Registered Members</span>
                <h2>{members.length}</h2>
              </div>

            </div>

            {/* MEMBERS TABLE */}
            <div className="members-table-card">

              <div className="members-toolbar">

                <h3>All Members</h3>

                <div className="member-search">

                  <Search size={18} />

                  <input
                    placeholder="Search name, email or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                </div>

                <button
                  type="button"
                  className="refresh-btn"
                  onClick={refreshData}
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
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Registered Account</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {loading ? (
                      <tr>
                        <td colSpan="8">
                          Loading members...
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan="8">
                          No members found. Add your first member.
                        </td>
                      </tr>
                    ) : (
                      members.map((member) => {

                        const linkedUser = registeredUsers.find(
                          (user) =>
                            Number(user.member_id) ===
                            Number(member.member_id)
                        );

                        const availableUsers = registeredUsers.filter(
                          (user) =>
                            user.member_id === null ||
                            user.member_id === undefined ||
                            Number(user.member_id) ===
                            Number(member.member_id)
                        );

                        return (
                          <tr key={member.member_id}>

                            <td>
                              GS
                              {String(member.member_id).padStart(3, "0")}
                            </td>

                            <td>{member.full_name}</td>

                            <td>{member.email}</td>

                            <td>{member.phone}</td>

                            <td>{member.membership_plan}</td>

                            <td>
                              <span
                                className={`status ${(member.status || "active").toLowerCase()}`}
                              >
                                {member.status || "Active"}
                              </span>
                            </td>

                            {/* REGISTERED ACCOUNT / LINK USER */}
                            <td>

                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                  minWidth: "210px"
                                }}
                              >

                                {linkedUser ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      color: "#22c55e",
                                      fontSize: "13px"
                                    }}
                                  >
                                    <CheckCircle size={16} />

                                    <span>
                                      {linkedUser.full_name}
                                    </span>
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      color: "#f59e0b",
                                      fontSize: "13px"
                                    }}
                                  >
                                    Not Linked
                                  </span>
                                )}

                                <select
                                  value={
                                    selectedUsers[member.member_id] || ""
                                  }
                                  onChange={(e) =>
                                    setSelectedUsers({
                                      ...selectedUsers,
                                      [member.member_id]: e.target.value
                                    })
                                  }
                                  style={{
                                    padding: "8px",
                                    borderRadius: "6px",
                                    width: "100%",
                                    maxWidth: "210px"
                                  }}
                                >

                                  <option value="">
                                    Select Registered User
                                  </option>

                                  {availableUsers.map((user) => (
                                    <option
                                      key={user.user_id}
                                      value={user.user_id}
                                    >
                                      {user.full_name} ({user.email})
                                    </option>
                                  ))}

                                </select>

                                <button
                                  type="button"
                                  className="add-member-btn"
                                  disabled={
                                    !selectedUsers[member.member_id] ||
                                    linkLoading === member.member_id
                                  }
                                  onClick={() =>
                                    handleLinkUser(member.member_id)
                                  }
                                  style={{
                                    padding: "7px 12px",
                                    fontSize: "12px",
                                    width: "fit-content",
                                    opacity:
                                      !selectedUsers[member.member_id]
                                        ? 0.6
                                        : 1
                                  }}
                                >
                                  <LinkIcon size={14} />

                                  {linkLoading === member.member_id
                                    ? "Linking..."
                                    : "Link User"}
                                </button>

                              </div>

                            </td>

                            {/* ACTIONS */}
                            <td>

                              <div className="member-actions">

                                <button
                                  type="button"
                                  className="edit-btn"
                                  onClick={() => openEdit(member)}
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  type="button"
                                  className="delete-btn"
                                  onClick={() =>
                                    deleteMember(member.member_id)
                                  }
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

            {/* ADD / EDIT MODAL */}
            {showForm && (
              <div className="modal-overlay">

                <div className="member-modal">

                  <div className="modal-heading">

                    <div>
                      <h2>
                        {editingId
                          ? "Edit Member"
                          : "Add New Member"}
                      </h2>

                      <p>
                        Enter member information below.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="close-modal"
                      onClick={() => setShowForm(false)}
                    >
                      <X />
                    </button>

                  </div>

                  <form onSubmit={handleSubmit}>

                    <div className="form-grid">

                      <label>
                        Full Name *

                        <input
                          name="full_name"
                          value={form.full_name}
                          onChange={handleChange}
                          placeholder="Enter full name"
                          required
                        />
                      </label>

                      <label>
                        Email *

                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="Enter email"
                          required
                        />
                      </label>

                      <label>
                        Phone *

                        <input
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                          required
                        />
                      </label>

                      <label>
                        Gender

                        <select
                          name="gender"
                          value={form.gender}
                          onChange={handleChange}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>

                      <label>
                        Date of Birth

                        <input
                          type="date"
                          name="date_of_birth"
                          value={form.date_of_birth}
                          onChange={handleChange}
                        />
                      </label>

                      <label>
                        Joining Date *

                        <input
                          type="date"
                          name="join_date"
                          value={form.join_date}
                          onChange={handleChange}
                          required
                        />
                      </label>

                      <label>
                        Membership Plan *

                        <select
                          name="membership_plan"
                          value={form.membership_plan}
                          onChange={handleChange}
                        >
                          <option value="Basic">Basic</option>
                          <option value="Standard">Standard</option>
                          <option value="Premium">Premium</option>
                        </select>
                      </label>

                      <label>
                        Status

                        <select
                          name="status"
                          value={form.status}
                          onChange={handleChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Pending">Pending</option>
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
                        {editingId
                          ? "Update Member"
                          : "Save Member"}
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

export default Members;
