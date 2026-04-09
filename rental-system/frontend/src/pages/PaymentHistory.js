import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function PaymentHistory() {
  const { user }              = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const endpoint = user?.role === "owner" ? "/payments/owner" : "/payments/my";
    api.get(endpoint)
      .then(r => setPayments(r.data))
      .catch(() => toast.error("Failed to load payments."))
      .finally(() => setLoading(false));
  }, [user]);

  const total = payments.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>💳 {user?.role === "owner" ? "Revenue" : "Payment"} History</h1>
        <p>{user?.role === "owner" ? "All earnings from your properties" : "Your payment records"}</p>
      </div>

      {payments.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: "2rem" }}>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Total {user?.role === "owner" ? "Revenue" : "Paid"}</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>₹{Number(total).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-label">Transactions</div>
            <div className="stat-value">{payments.length}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <h3>No payments yet</h3>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Property</th>
                  {user?.role === "owner" && <th>Tenant</th>}
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: "var(--text-light)" }}>{i + 1}</td>
                    <td><strong>{p.property_title}</strong></td>
                    {user?.role === "owner" && <td>{p.tenant_name}</td>}
                    <td style={{ fontSize: "0.85rem" }}>
                      {new Date(p.start_date).toLocaleDateString()} →<br/>
                      {new Date(p.end_date).toLocaleDateString()}
                    </td>
                    <td>
                      <strong style={{ color: p.status === "completed" ? "var(--success)" : "var(--text)" }}>
                        ₹{Number(p.amount).toLocaleString()}
                      </strong>
                    </td>
                    <td><span className={`status status-${p.status}`}>{p.status}</span></td>
                    <td style={{ fontSize: "0.85rem" }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
