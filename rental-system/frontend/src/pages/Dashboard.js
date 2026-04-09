import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user.role === "tenant") {
      Promise.all([
        api.get("/bookings/my"),
        api.get("/payments/my"),
        api.get("/notifications"),
      ]).then(([b, p, n]) => {
        setStats({ bookings: b.data.length, payments: p.data.length, spent: p.data.reduce((a,c) => a + parseFloat(c.amount||0), 0) });
        setNotifications(n.data.slice(0, 5));
      });
    }
  }, [user]);

  if (user.role === "owner") return <div className="page"><h2>Welcome back, {user.name}! 👋</h2><p style={{marginTop:12,color:"#636e72"}}>Head to <Link to="/owner" style={{color:"#6c5ce7",fontWeight:600}}>My Listings</Link> to manage your properties.</p></div>;

  return (
    <div className="page">
      <h2 style={{ marginBottom:"24px" }}>Welcome back, {user.name}! 👋</h2>
      {stats && (
        <div className="grid-3" style={{ marginBottom:"28px" }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background:"#f0eeff" }}>📋</div>
            <div><div className="stat-label">My Bookings</div><div className="stat-value">{stats.bookings}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background:"#d1fae5" }}>💳</div>
            <div><div className="stat-label">Payments Made</div><div className="stat-value">{stats.payments}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background:"#fef3c7" }}>💰</div>
            <div><div className="stat-label">Total Spent</div><div className="stat-value">₹{parseFloat(stats.spent).toLocaleString()}</div></div>
          </div>
        </div>
      )}
      <div className="card">
        <h3 style={{ marginBottom:"16px" }}>Recent Notifications</h3>
        {notifications.length === 0 ? (
          <div className="empty-state"><div className="icon">🔔</div><h3>No notifications yet</h3></div>
        ) : notifications.map(n => (
          <div key={n.id} style={{ padding:"12px 0", borderBottom:"1px solid #f0f0f0", display:"flex", gap:"12px", alignItems:"flex-start" }}>
            <span style={{ fontSize:"20px" }}>{n.type === "booking" ? "📋" : n.type === "payment" ? "💳" : n.type === "maintenance" ? "🔧" : "🔔"}</span>
            <div>
              <div style={{ fontWeight:600, fontSize:"14px" }}>{n.title}</div>
              <div style={{ color:"#636e72", fontSize:"13px", marginTop:2 }}>{n.message}</div>
            </div>
            {!n.is_read && <span className="notif-dot" style={{ marginLeft:"auto", flexShrink:0 }}>New</span>}
          </div>
        ))}
      </div>
    </div>
  );
}