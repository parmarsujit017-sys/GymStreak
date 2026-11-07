import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Dumbbell
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const API = "http://localhost:5000/api/trainers";

const emptyForm = {
  trainer_name: "",
  email: "",
  phone: "",
  gender: "Male",
  specialization: "",
  experience: 0,
  salary: 0,
  joining_date: "",
  status: "Active"
};

// Safe JSON response handling
async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Server JSON response aapto nathi. Status: ${response.status}. Backend route check karo.`
    );
  }
}

function Trainers({ onNavigate }) {
  const [trainers, setTrainers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // GET - Load Trainers
  async function loadTrainers() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(API);
      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Failed to load trainers");
      }

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : null;

      if (!data) {
        throw new Error("Invalid trainers data received from server");
      }

      setTrainers(data);
    } catch (error) {
      setMessage(error.message || "Unable to load trainers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrainers();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
    setMessage("");
  }

  function openEditModal(trainer) {
    setEditingId(trainer.id);

    setForm({
      trainer_name: trainer.trainer_name || "",
      email: trainer.email || "",
      phone: trainer.phone || "",
      gender: trainer.gender || "Male",
      specialization: trainer.specialization || "",
      experience: trainer.experience ?? 0,
      salary: trainer.salary ?? 0,
      joining_date: trainer.joining_date
        ? String(trainer.joining_date).slice(0, 10)
        : "",
      status: trainer.status || "Active"
    });

    setShowModal(true);
    setMessage("");
  }

  // POST / PUT - Save Trainer
  async function saveTrainer(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...form,
            experience: Number(form.experience) || 0,
            salary: Number(form.salary) || 0
          })
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Unable to save trainer");
      }

      const wasEditing = Boolean(editingId);

      setShowModal(false);
      setForm({ ...emptyForm });
      setEditingId(null);

      setMessage(
        wasEditing
          ? "Trainer updated successfully!"
          : "Trainer added successfully!"
      );

      await loadTrainers();
    } catch (error) {
      setMessage(error.message || "Unable to save trainer");
    } finally {
      setSaving(false);
    }
  }

  // DELETE - Remove Trainer
  async function deleteTrainer(id) {
    if (!window.confirm("Are you sure you want to delete this trainer?")) {
      return;
    }

    try {
      setMessage("");

      const response = await fetch(`${API}/${id}`, {
        method: "DELETE"
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete trainer");
      }

      setMessage("Trainer deleted successfully!");
      await loadTrainers();
    } catch (error) {
      setMessage(error.message || "Unable to delete trainer");
    }
  }

  // Search
  const filteredTrainers = trainers.filter(trainer =>
    [
      trainer.trainer_name,
      trainer.email,
      trainer.phone,
      trainer.specialization,
      trainer.status
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const activeCount = trainers.filter(
    trainer => trainer.status === "Active"
  ).length;

  const inactiveCount = trainers.filter(
    trainer => trainer.status === "Inactive"
  ).length;

  return (
    <div className="app-layout">
      <Sidebar onNavigate={onNavigate} activePage="Trainers" />

      <main className="main-content">
        <Header onNavigate={onNavigate} />

        <div className="dashboard-content trainers-page">

          <div className="trainers-heading">
            <div>
              <h1>Trainers Management</h1>
              <p>Manage your gym trainers and their information</p>
            </div>

            <button className="add-trainer-btn" onClick={openAddModal}>
              <UserPlus size={18} />
              Add Trainer
            </button>
          </div>

          {message && (
            <div className="trainer-message">
              {message}
              <button onClick={() => setMessage("")}>
                <X size={16} />
              </button>
            </div>
          )}

          <div className="trainer-stats">

            <div className="trainer-stat-card">
              <Users size={25} />
              <div>
                <p>Total Trainers</p>
                <h2>{trainers.length}</h2>
              </div>
            </div>

            <div className="trainer-stat-card">
              <UserPlus size={25} />
              <div>
                <p>Active Trainers</p>
                <h2>{activeCount}</h2>
              </div>
            </div>

            <div className="trainer-stat-card">
              <Dumbbell size={25} />
              <div>
                <p>Inactive Trainers</p>
                <h2>{inactiveCount}</h2>
              </div>
            </div>

          </div>

          <div className="trainers-table-card">

            <div className="trainers-toolbar">
              <h3>All Trainers</h3>

              <div className="trainer-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search trainers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <button
                className="trainer-refresh-btn"
                onClick={loadTrainers}
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Trainer Name</th>
                    <th>Contact</th>
                    <th>Specialization</th>
                    <th>Experience</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="trainer-empty">
                        Loading trainers...
                      </td>
                    </tr>
                  ) : filteredTrainers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="trainer-empty">
                        No trainers found
                      </td>
                    </tr>
                  ) : (
                    filteredTrainers.map(trainer => (
                      <tr key={trainer.id}>
                        <td>
                          TR{String(trainer.id).padStart(3, "0")}
                        </td>

                        <td>
                          <div className="trainer-name-cell">
                            <div className="trainer-avatar">
                              <Users size={19} />
                            </div>
                            <strong>{trainer.trainer_name}</strong>
                          </div>
                        </td>

                        <td>
                          {trainer.email}
                          <br />
                          <small>{trainer.phone}</small>
                        </td>

                        <td>{trainer.specialization}</td>

                        <td>{trainer.experience} Years</td>

                        <td>
                          ₹{Number(trainer.salary || 0).toLocaleString("en-IN")}
                        </td>

                        <td>
                          <span
                            className={`status ${(trainer.status || "").toLowerCase()}`}
                          >
                            {trainer.status}
                          </span>
                        </td>

                        <td>
                          <div className="member-actions">
                            <button
                              className="edit-btn"
                              onClick={() => openEditModal(trainer)}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() => deleteTrainer(trainer.id)}
                              title="Delete"
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

      {showModal && (
        <div className="modal-overlay">
          <div className="member-modal">

            <div className="modal-heading">
              <div>
                <h2>{editingId ? "Edit Trainer" : "Add New Trainer"}</h2>
                <p>Enter trainer details below</p>
              </div>

              <button
                className="close-modal"
                onClick={() => setShowModal(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveTrainer}>
              <div className="form-grid">

                <label>
                  Trainer Name
                  <input
                    name="trainer_name"
                    value={form.trainer_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </label>

                <label>
                  Email
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
                  Phone
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
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Specialization
                  <input
                    name="specialization"
                    value={form.specialization}
                    onChange={handleChange}
                    placeholder="Yoga, Cardio, Weight Training"
                    required
                  />
                </label>

                <label>
                  Experience (Years)
                  <input
                    type="number"
                    min="0"
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Salary (₹)
                  <input
                    type="number"
                    min="0"
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Joining Date
                  <input
                    type="date"
                    name="joining_date"
                    value={form.joining_date}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </label>

              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-trainer-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Trainer"
                      : "Save Trainer"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Trainers;