
import {
  Users,
  UserCheck,
  IndianRupee,
  CalendarCheck,
  ArrowUpRight
} from "lucide-react";

import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import AttendanceChart from "../components/AttendanceChart";

const API = "http://localhost:5000/api/members";
const MEMBERSHIP_API = "http://localhost:5000/api/memberships";
const ATTENDANCE_API = "http://localhost:5000/api/attendance";

// Get local date
function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Normalize API date according to local timezone
function normalizeDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Dashboard({ onNavigate }) {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load Dashboard Data
  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [
        memberResponse,
        membershipResponse,
        attendanceResponse
      ] = await Promise.all([
        fetch(API),
        fetch(MEMBERSHIP_API),
        fetch(ATTENDANCE_API)
      ]);

      const [
        memberResult,
        membershipResult,
        attendanceResult
      ] = await Promise.all([
        memberResponse.json(),
        membershipResponse.json(),
        attendanceResponse.json()
      ]);

      if (!memberResponse.ok) {
        throw new Error(
          memberResult.message || "Failed to load members"
        );
      }

      if (!membershipResponse.ok) {
        throw new Error(
          membershipResult.message || "Failed to load memberships"
        );
      }

      if (!attendanceResponse.ok) {
        throw new Error(
          attendanceResult.message || "Failed to load attendance"
        );
      }

      setMembers(
        Array.isArray(memberResult.data)
          ? memberResult.data
          : []
      );

      setMemberships(
        Array.isArray(membershipResult.data)
          ? membershipResult.data
          : []
      );

      setAttendanceRecords(
        Array.isArray(attendanceResult.data)
          ? attendanceResult.data
          : []
      );

    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Current Date and Month
  const today = getLocalDate();
  const currentMonth = today.slice(0, 7);

  // Monthly Revenue
  const monthlyRevenue = memberships
    .filter(membership => {
      const paymentDate = String(
        membership.start_date || ""
      ).slice(0, 7);

      return (
        membership.payment_status?.toLowerCase() === "paid" &&
        paymentDate === currentMonth
      );
    })
    .reduce((total, membership) => {
      return total + Number(membership.amount || 0);
    }, 0);

  // Today's Attendance Records
  const todayRecords = attendanceRecords.filter(
    record => normalizeDate(record.attendance_date) === today
  );

  const todayPresent = todayRecords.filter(
    record => record.status?.toLowerCase() === "present"
  ).length;

  const todayLate = todayRecords.filter(
    record => record.status?.toLowerCase() === "late"
  ).length;

  const todayAttendance = todayPresent + todayLate;

  // Recent Members
  const recentMembers = [...members].sort(
    (a, b) => Number(b.member_id) - Number(a.member_id)
  );

  return (
    <div className="app-layout">

      <Sidebar
        onNavigate={onNavigate}
        activePage="Dashboard"
      />

      <main className="main-content">

        <Header onNavigate={onNavigate} />

        <div className="dashboard-content">

          {/* Welcome Section */}
          <div className="welcome-section">
            <div>
              <h1>Welcome to GymStreak 👋</h1>
              <p>
                Here's your gym's performance at a glance.
              </p>
            </div>

            <span className="live-status">
              ● System Online
            </span>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">

            {/* Total Members */}
            <StatCard
              title="Total Members"
              value={
                loading
                  ? "Loading..."
                  : members.length.toLocaleString("en-IN")
              }
              change="Registered Members"
              icon={Users}
              color="#22d3ee"
            />

            {/* Active Members */}
            <StatCard
              title="Active Members"
              value={
                loading
                  ? "Loading..."
                  : members.filter(
                      member =>
                        member.status?.toLowerCase() === "active"
                    ).length.toLocaleString("en-IN")
              }
              change="Currently Active"
              icon={UserCheck}
              color="#4ade80"
            />

            {/* Monthly Revenue */}
            <StatCard
              title="Monthly Revenue"
              value={
                loading
                  ? "Loading..."
                  : `₹${monthlyRevenue.toLocaleString("en-IN")}`
              }
              change="Paid memberships this month"
              icon={IndianRupee}
              color="#c084fc"
            />

            {/* Today's Attendance */}
            <StatCard
              title="Today's Attendance"
              value={
                loading
                  ? "Loading..."
                  : todayAttendance.toLocaleString("en-IN")
              }
              change={
                loading
                  ? "Loading attendance..."
                  : `${todayPresent} Present • ${todayLate} Late`
              }
              icon={CalendarCheck}
              color="#fb923c"
            />

          </div>

          {/* Error Message */}
          {error && (
            <p style={{ color: "#f87171" }}>
              {error}
            </p>
          )}

          {/* Attendance Chart */}
          <AttendanceChart />

          {/* Recent Members */}
          <div className="table-card">

            <div className="section-heading">

              <div>
                <h3>Recent Members</h3>
                <p>
                  Latest registered gym members
                </p>
              </div>

              <button
                className="view-all"
                onClick={() => onNavigate("Members")}
              >
                View All
                <ArrowUpRight size={16} />
              </button>

            </div>

            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Membership</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {loading ? (
                    <tr>
                      <td colSpan="4">
                        Loading members...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="4">
                        {error}
                      </td>
                    </tr>
                  ) : recentMembers.length === 0 ? (
                    <tr>
                      <td colSpan="4">
                        No members found. Add your first member.
                      </td>
                    </tr>
                  ) : (
                    recentMembers.slice(0, 5).map(member => (
                      <tr key={member.member_id}>

                        <td>
                          GS{String(member.member_id).padStart(3, "0")}
                        </td>

                        <td>
                          {member.full_name}
                        </td>

                        <td>
                          {member.membership_plan}
                        </td>

                        <td>
                          <span
                            className={`status ${
                              (member.status || "").toLowerCase()
                            }`}
                          >
                            {member.status}
                          </span>
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

export default Dashboard;
