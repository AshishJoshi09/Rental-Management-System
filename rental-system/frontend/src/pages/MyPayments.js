import { useEffect, useState } from "react";
import api from "../api";

export default function MyPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/payments/my").then(r => { setPayments(r.data); setLoading(false); }); }, []);

  const total = payments.filter(p => p.status === "completed").reduce((a,c) => a + parseFloat(c.amount||0), 0);

  return (
    <div className="page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
        <h2>Payment History</h2>
        <div className="stat-card" style={{ padding:"12px 20px" }}>
          <div className="stat-icon" style={{ background:"#d1fae5", width:36, height:36, fontSize:16 }}>💰</div>
          <div><div className="stat-label">Total Paid</div><div style={{ fontWeight:800, fontSize:18, color:"#2d3436" }}>₹{total.toLocaleString()}</div></div>
        </div>
      </div>
      {loading ? <div className="empty-state"><div className="icon">⏳</div><h3>Loading…</h3></div>
        : payments.length === 0 ? <div className="empty-state"><div className="icon">💳</div><h3>No payments yet</h3></div>
        : (
          <div className="table-wrap card" style={{ padding:0 }}>
            <table>
              <thead><tr><th>Property</th><th>Period</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.property_title}</strong></td>
                    <td style={{ fontSize:"13px", color:"#636e72" }}>{new Date(p.start_date).toLocaleDateString()} → {new Date(p.end_date).toLocaleDateString()}</td>
                    <td><strong>₹{parseFloat(p.amount).toLocaleString()}</strong></td>
                    <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                    <td style={{ fontSize:"13px", color:"#636e72" }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}