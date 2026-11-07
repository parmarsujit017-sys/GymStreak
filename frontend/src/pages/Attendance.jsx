
import { useEffect, useState } from "react";

import {
    CalendarCheck,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    Save,
    RefreshCw,
    Users
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const API = "http://localhost:5000/api/attendance";
const MEMBERS_API = "http://localhost:5000/api/members";

// Get local date
function getLocalDate() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Safe API response
async function readApiResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    if (!contentType.includes("application/json")) {
        throw new Error(
            `Invalid API response. HTTP ${response.status}. Check backend API.`
        );
    }

    let result;

    try {
        result = JSON.parse(text);
    } catch {
        throw new Error("Backend returned invalid JSON.");
    }

    if (!response.ok) {
        throw new Error(
            result.message || `Request failed: ${response.status}`
        );
    }

    return result;
}

// Handle API array formats
function getArrayData(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.data)) return result.data;

    return [];
}

function Attendance({ onNavigate }) {

    // Data
    const [records, setRecords] = useState([]);
    const [members, setMembers] = useState([]);

    // Form states
    const [memberId, setMemberId] = useState("");
    const [attendanceDate, setAttendanceDate] = useState(getLocalDate());
    const [status, setStatus] = useState("Present");
    const [checkIn, setCheckIn] = useState("");

    // UI states
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    // Load members and attendance
    async function loadData() {
        setLoading(true);

        try {
            const [attendanceResponse, membersResponse] =
                await Promise.all([
                    fetch(API, {
                        headers: { Accept: "application/json" }
                    }),
                    fetch(MEMBERS_API, {
                        headers: { Accept: "application/json" }
                    })
                ]);

            const [attendanceResult, membersResult] =
                await Promise.all([
                    readApiResponse(attendanceResponse),
                    readApiResponse(membersResponse)
                ]);

            setRecords(getArrayData(attendanceResult));
            setMembers(getArrayData(membersResult));

        } catch (error) {
            setMessage(error.message);
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // Save attendance
    async function saveAttendance(e) {
        e.preventDefault();

        setMessage("");
        setMessageType("");

        if (!memberId || !attendanceDate || !status) {
            setMessage("Please select member, date and status.");
            setMessageType("error");
            return;
        }

        if (status !== "Absent" && !checkIn) {
            setMessage("Please select check in time.");
            setMessageType("error");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    member_id: memberId,
                    attendance_date: attendanceDate,
                    status: status,
                    check_in: status === "Absent" ? null : checkIn
                })
            });

            const result = await readApiResponse(response);

            setMessage(
                result.message || "Attendance saved successfully!"
            );
            setMessageType("success");

            // Reset form
            setMemberId("");
            setAttendanceDate(getLocalDate());
            setStatus("Present");
            setCheckIn("");

            // Refresh records
            await loadData();

        } catch (error) {
            setMessage(error.message);
            setMessageType("error");
        } finally {
            setSaving(false);
        }
    }

    // Search records
    const filteredRecords = records.filter(record => {
        const date = String(record.attendance_date || "").slice(0, 10);
        const name = String(record.full_name || "").toLowerCase();
        const searchValue = search.toLowerCase();

        return (
            date.includes(searchValue) ||
            name.includes(searchValue) ||
            String(record.status || "").toLowerCase().includes(searchValue)
        );
    });

    // Statistics
    const totalRecords = records.length;

    const totalPresent = records.filter(
        record => record.status === "Present"
    ).length;

    const totalAbsent = records.filter(
        record => record.status === "Absent"
    ).length;

    const totalLate = records.filter(
        record => record.status === "Late"
    ).length;

    return (
        <div className="app-layout">

            <Sidebar
                onNavigate={onNavigate}
                activePage="Attendance"
            />

            <main className="main-content">

                <Header onNavigate={onNavigate} />

                <div className="dashboard-content">

                    {/* Page Heading */}
                    <div className="welcome-section">
                        <div>
                            <h1>Attendance Management</h1>
                            <p>
                                Manage and track your gym's daily attendance.
                            </p>
                        </div>

                        <span className="live-status">
                            ● Attendance System
                        </span>
                    </div>

                    {/* Statistics */}
                    <div className="stats-grid">

                        <div className="stat-card">
                            <div className="stat-info">
                                <p>Total Records</p>
                                <h2>{totalRecords}</h2>
                            </div>
                            <CalendarCheck color="#22d3ee" size={28} />
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <p>Total Present</p>
                                <h2>{totalPresent}</h2>
                            </div>
                            <CheckCircle color="#4ade80" size={28} />
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <p>Total Absent</p>
                                <h2>{totalAbsent}</h2>
                            </div>
                            <XCircle color="#f87171" size={28} />
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <p>Total Late</p>
                                <h2>{totalLate}</h2>
                            </div>
                            <Clock color="#fb923c" size={28} />
                        </div>

                    </div>

                    {/* Mark Attendance */}
                    <div className="table-card">

                        <div className="section-heading">
                            <div>
                                <h3>Mark Attendance</h3>
                                <p>
                                    Select a member and mark their attendance.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={saveAttendance}>

                            <div className="attendance-form-grid">

                                {/* Member Dropdown */}
                                <div>
                                    <label>Choose Member</label>

                                    <select
                                        value={memberId}
                                        onChange={e => setMemberId(e.target.value)}
                                        required
                                    >
                                        <option value="">
                                            Select Member
                                        </option>

                                        {members.map(member => (
                                            <option
                                                key={member.member_id}
                                                value={member.member_id}
                                            >
                                                {member.full_name}
                                            </option>
                                        ))}
                                    </select>

                                    {members.length === 0 && (
                                        <small>
                                            No members found. Check Members API.
                                        </small>
                                    )}
                                </div>

                                {/* Date */}
                                <div>
                                    <label>Attendance Date</label>

                                    <input
                                        type="date"
                                        value={attendanceDate}
                                        onChange={e =>
                                            setAttendanceDate(e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label>Attendance Status</label>

                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value)}
                                        required
                                    >
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Late">Late</option>
                                    </select>
                                </div>

                                {/* Check In */}
                                <div>
                                    <label>Check In Time</label>

                                    <input
                                        type="time"
                                        value={checkIn}
                                        onChange={e => setCheckIn(e.target.value)}
                                        disabled={status === "Absent"}
                                        required={status !== "Absent"}
                                    />
                                </div>

                            </div>

                            {/* Save Button */}
                            <button
                                type="submit"
                                className="view-all attendance-save"
                                disabled={saving || loading}
                            >
                                <Save size={17} />

                                {saving ? "Saving..." : "Save Attendance"}
                            </button>

                        </form>

                        {/* Message */}
                        {message && (
                            <div
                                className={`attendance-message ${
                                    messageType === "error"
                                        ? "attendance-error"
                                        : "attendance-success"
                                }`}
                            >
                                {message}
                            </div>
                        )}

                    </div>

                    {/* Attendance Records */}
                    <div className="table-card">

                        <div className="section-heading">

                            <div>
                                <h3>Attendance Records</h3>
                                <p>
                                    All registered daily attendance details.
                                </p>
                            </div>

                            {/* Search and Refresh */}
                            <div className="attendance-toolbar">

                                <div className="attendance-search">
                                    <Search size={17} />

                                    <input
                                        type="text"
                                        placeholder="Search member, date or status..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="refresh-btn"
                                    onClick={loadData}
                                    disabled={loading}
                                    title="Refresh records"
                                >
                                    <RefreshCw size={18} />
                                </button>

                            </div>

                        </div>

                        {/* Table */}
                        <div className="table-wrapper">

                            <table>

                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Member Name</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Check In</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {loading ? (
                                        <tr>
                                            <td colSpan="5">
                                                Loading attendance...
                                            </td>
                                        </tr>
                                    ) : filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan="5">
                                                No attendance records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRecords.map(record => (
                                            <tr key={record.attendance_id}>
                                                <td>{record.attendance_id}</td>

                                                <td>
                                                    {record.full_name || "--"}
                                                </td>

                                                <td>
                                                    {String(
                                                        record.attendance_date || ""
                                                    ).slice(0, 10)}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`status ${
                                                            record.status === "Present"
                                                                ? "active"
                                                                : record.status === "Absent"
                                                                ? "inactive"
                                                                : "pending"
                                                        }`}
                                                    >
                                                        {record.status}
                                                    </span>
                                                </td>

                                                <td>
                                                    {record.check_in || "--"}
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

        </div>
    );
}

export default Attendance;
