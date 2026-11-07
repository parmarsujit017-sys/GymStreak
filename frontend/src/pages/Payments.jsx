
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const API = "http://localhost:5000/api";

function Payments({ onNavigate }) {
    const [payments, setPayments] = useState([]);
    const [members, setMembers] = useState([]);
    const [memberships, setMemberships] = useState([]);

    const [form, setForm] = useState({
        member_id: "",
        membership_id: "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "UPI",
        payment_status: "Paid",
        transaction_id: "",
        notes: ""
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [paymentRes, memberRes, membershipRes] =
                await Promise.all([
                    fetch(`${API}/payments`),
                    fetch(`${API}/members`),
                    fetch(`${API}/memberships`)
                ]);

            const paymentData = await paymentRes.json();
            const memberData = await memberRes.json();
            const membershipData = await membershipRes.json();

            if (paymentData.success) setPayments(paymentData.data || []);
            if (memberData.success) setMembers(memberData.data || []);
            if (membershipData.success) setMemberships(membershipData.data || []);
        } catch (error) {
            setMessage("Unable to connect to backend.");
        }
    };

    const handleMemberChange = (e) => {
        const memberId = e.target.value;

        setForm({
            ...form,
            member_id: memberId,
            membership_id: "",
            amount: ""
        });
    };

    const handleMembershipChange = (e) => {
        const membershipId = e.target.value;
        const selected = memberships.find(
            (item) => String(item.id) === String(membershipId)
        );

        setForm({
            ...form,
            membership_id: membershipId,
            amount: selected ? selected.amount : ""
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!form.member_id || !form.membership_id || !form.amount) {
            setMessage("Please fill all required fields.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/payments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...form,
                    amount: Number(form.amount)
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Payment failed.");
            }

            setMessage("Payment added successfully!");

            setForm({
                member_id: "",
                membership_id: "",
                amount: "",
                payment_date: new Date().toISOString().split("T")[0],
                payment_method: "UPI",
                payment_status: "Paid",
                transaction_id: "",
                notes: ""
            });

            loadData();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const response = await fetch(`${API}/payments/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ payment_status: status })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Status update failed.");
            }

            setMessage("Payment status updated.");
            loadData();
        } catch (error) {
            setMessage(error.message);
        }
    };

    const filteredPayments = payments.filter((payment) =>
        `${payment.full_name || ""} ${payment.transaction_id || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const totalPaid = payments
        .filter((p) => p.payment_status === "Paid")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalPending = payments
        .filter((p) => p.payment_status === "Pending")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalFailed = payments
        .filter((p) => p.payment_status === "Failed")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return (
        <div className="app-layout">
            <Sidebar activePage="Payments" onNavigate={onNavigate} />

            <main className="main-content">
                <Header title="Payments" onNavigate={onNavigate} />

                <div className="page-content">
                    <div className="section-heading">
                        <div>
                            <h2>Payment Management</h2>
                            <p>Manage gym member payments</p>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <p>Total Paid</p>
                            <h2>₹{totalPaid.toLocaleString("en-IN")}</h2>
                        </div>

                        <div className="stat-card">
                            <p>Pending Amount</p>
                            <h2>₹{totalPending.toLocaleString("en-IN")}</h2>
                        </div>

                        <div className="stat-card">
                            <p>Failed Amount</p>
                            <h2>₹{totalFailed.toLocaleString("en-IN")}</h2>
                        </div>

                        <div className="stat-card">
                            <p>Total Transactions</p>
                            <h2>{payments.length}</h2>
                        </div>
                    </div>

                    <div className="table-card payment-form-card">
                        <div className="section-heading">
                            <div>
                                <h3>Add New Payment</h3>
                                <p>Enter payment details below</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div>
                                    <label>Member *</label>
                                    <select
                                        value={form.member_id}
                                        onChange={handleMemberChange}
                                        required
                                    >
                                        <option value="">Select Member</option>
                                        {members.map((member) => (
                                            <option
                                                key={member.member_id}
                                                value={member.member_id}
                                            >
                                                {member.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Membership *</label>
                                    <select
                                        value={form.membership_id}
                                        onChange={handleMembershipChange}
                                        required
                                        disabled={!form.member_id}
                                    >
                                        <option value="">Select Membership</option>
                                        {memberships
                                            .filter((item) =>
                                                String(item.member_id) === String(form.member_id)
                                            )
                                            .map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.plan_name} - ₹{item.amount}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Amount (₹) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={form.amount}
                                        onChange={(e) =>
                                            setForm({ ...form, amount: e.target.value })
                                        }
                                        placeholder="Enter amount"
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Payment Date *</label>
                                    <input
                                        type="date"
                                        value={form.payment_date}
                                        onChange={(e) =>
                                            setForm({ ...form, payment_date: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Payment Method *</label>
                                    <select
                                        value={form.payment_method}
                                        onChange={(e) =>
                                            setForm({ ...form, payment_method: e.target.value })
                                        }
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Card">Card</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                </div>

                                <div>
                                    <label>Payment Status</label>
                                    <select
                                        value={form.payment_status}
                                        onChange={(e) =>
                                            setForm({ ...form, payment_status: e.target.value })
                                        }
                                    >
                                        <option value="Paid">Paid</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Failed">Failed</option>
                                    </select>
                                </div>

                                <div>
                                    <label>Transaction ID</label>
                                    <input
                                        type="text"
                                        value={form.transaction_id}
                                        onChange={(e) =>
                                            setForm({ ...form, transaction_id: e.target.value })
                                        }
                                        placeholder="Enter transaction ID"
                                    />
                                </div>

                                <div>
                                    <label>Notes</label>
                                    <input
                                        type="text"
                                        value={form.notes}
                                        onChange={(e) =>
                                            setForm({ ...form, notes: e.target.value })
                                        }
                                        placeholder="Optional notes"
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Add Payment"}
                            </button>

                            {message && <p className="member-message">{message}</p>}
                        </form>
                    </div>

                    <div className="table-card">
                        <div className="section-heading">
                            <div className="table-card payment-history-card">
                                <h3>Payment History</h3>
                                <p>All recorded transactions</p>
                            </div>

                            <input
                                type="search"
                                className="member-search"
                                placeholder="Search member or transaction..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="table-wrapper">
                            <table className="payments-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Member</th>
                                        <th>Plan</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                        <th>Update</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredPayments.map((payment) => (
                                        <tr key={payment.payment_id}>
                                            <td>#{payment.payment_id}</td>
                                            <td>{payment.full_name}</td>
                                            <td>{payment.plan_name}</td>
                                            <td>₹{Number(payment.amount).toLocaleString("en-IN")}</td>
                                            <td>
                                                {payment.payment_date
                                                    ? new Date(payment.payment_date).toLocaleDateString("en-IN")
                                                    : "-"}
                                            </td>
                                            <td>{payment.payment_method}</td>
                                            <td>
                                                <span className={`status ${payment.payment_status?.toLowerCase()}`}>
                                                    {payment.payment_status}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    value={payment.payment_status}
                                                    onChange={(e) =>
                                                        updateStatus(payment.payment_id, e.target.value)
                                                    }
                                                >
                                                    <option value="Paid">Paid</option>
                                                    <option value="Pending">Pending</option>
                                                    <option value="Failed">Failed</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredPayments.length === 0 && (
                                        <tr>
                                            <td colSpan="8">No payment records found.</td>
                                        </tr>
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

export default Payments;
