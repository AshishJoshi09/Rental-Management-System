import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get("/admin/stats").then(r => setStats(r.data));
    api.get("/admin/users").then(r => setUsers(r.data));
    api.get("/admin/bookings").then(r => setBookings(r.data));
    api.get("/admin/payments").then(r => setPayments(r.data));
  }, []);

  const changeRole = async (id, role) => {
    await api.put(`/admin/users/${id}/role`, { role });
    toast.success("Role updated.");
    api.get("/admin/users").then(r => setUsers(r.data));
  };

  const deleteUser = async id => {
    if (!window.confirm("Delete this user and all their data?")) return;
    await api.delete(`/admin/users/${id}`);
    toast.success("User deleted.");
    api.get("/admin/users").then(r => setUsers(r.data));
  };

  return (
    <div className="page">
      <h2 style={{ marginBottom:"24px" }}>⚙️ Admin Control Panel</h2>

      {stats && (
        <div className="grid-4" style={{ marginBottom:"28px" }}>
          {[
            { label:"Total Users", value:stats.total_users, icon:"👥", bg:"#f0eeff" },
            { label:"Properties", value:stats.total_properties, icon:"🏠", bg:"#d1fae5" },
            { label:"Bookings", value:stats.total_bookings, icon:"📋", bg:"#fef3c7" },
            { label:"Revenue", value:`₹${parseFloat(stats.total_revenue||0).toLocaleString()}`, icon:"💰", bg:"#fee2e2" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background:s.bg }}>{s.icon}</div>
              <div><div className="stat-label">{s.label}</div><div className="stat-value" style={{ fontSize:"22px" }}>{s.value}</div></div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
        {["overview","users","bookings","payments"].map(t => (
          <button key={t} className={`btn ${tab===t?"btn-primary":"btn-outline"} btn-sm`} style={{ textTransform:"capitalize" }} onClick={()=>setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="card">
          <h3>Platform Summary</h3>
          <p style={{ marginTop:12, color:"#636e72", lineHeight:1.8 }}>
            Managing <strong>{stats?.total_users}</strong> users, <strong>{stats?.total_properties}</strong> properties,
            and <strong>{stats?.total_bookings}</strong> bookings. Total platform revenue:
            <strong> ₹{parseFloat(stats?.total_revenue||0).toLocaleString()}</strong>.
          </p>
        </div>
      )}

      {tab === "users" && (
        <div className="table-wrap card" style={{ padding:0 }}>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td style={{ color:"#636e72" }}>{u.email}</td>
                  <td>
                    <select className="form-control" style={{ padding:"4px 8px", fontSize:"13px", width:"auto" }}
                      value={u.role} onChange={e => changeRole(u.id, e.target.value)}>
                      <option value="tenant">Tenant</option>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ fontSize:"13px", color:"#636e72" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "bookings" && (
        <div className="table-wrap card" style={{ padding:0 }}>
          <table>
            <thead><tr><th>Tenant</th><th>Property</th><th>Dates</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>{b.tenant_name}</td>
                  <td>{b.property_title}</td>
                  <td style={{ fontSize:"13px" }}>{new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}</td>
                  <td>₹{parseFloat(b.total_amount).toLocaleString()}</td>
                  <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "payments" && (
        <div className="table-wrap card" style={{ padding:0 }}>
          <table>
            <thead><tr><th>User</th><th>Property</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{p.user_name}</td>
                  <td>{p.property_title}</td>
                  <td><strong>₹{parseFloat(p.amount).toLocaleString()}</strong></td>
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                  <td style={{ fontSize:"13px", color:"#636e72" }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}