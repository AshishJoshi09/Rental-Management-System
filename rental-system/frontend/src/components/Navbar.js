import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/notifications/unread-count").then(r => setUnread(r.data.count)).catch(() => {});
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const navLinks = isAuthenticated
    ? user.role === "admin"
      ? [{ to: "/admin", label: "Admin Panel" }, { to: "/properties", label: "Properties" }]
      : user.role === "owner"
      ? [{ to: "/owner", label: "My Listings" }, { to: "/properties", label: "Browse" }]
      : [{ to: "/properties", label: "Browse" }, { to: "/my-bookings", label: "Bookings" }, { to: "/my-payments", label: "Payments" }, { to: "/maintenance", label: "Maintenance" }]
    : [{ to: "/properties", label: "Browse Properties" }];

  const S = {
    nav: { position:"fixed", top:0, left:0, right:0, zIndex:1000, background:"#fff", boxShadow:"0 2px 12px rgba(0,0,0,.08)", height:"70px" },
    inner: { maxWidth:"1200px", margin:"0 auto", padding:"0 20px", height:"100%", display:"flex", alignItems:"center", gap:"24px" },
    logo: { fontSize:"20px", fontWeight:800, color:"#6c5ce7", textDecoration:"none" },
    link: { padding:"6px 14px", borderRadius:"8px", textDecoration:"none", fontSize:"14px", fontWeight:600, color:"#636e72" },
    active: { background:"#f0eeff", color:"#6c5ce7" },
    roleTag: { background:"#f0eeff", color:"#6c5ce7", padding:"2px 8px", borderRadius:"20px", fontSize:"11px", fontWeight:700, textTransform:"uppercase" },
  };

  return (
    <nav style={S.nav}>
      <div style={S.inner}>
        <Link to="/" style={S.logo}>🏠 RentEase</Link>
        <div style={{ display:"flex", gap:"4px", flex:1 }}>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} style={{ ...S.link, ...(location.pathname.startsWith(l.to) ? S.active : {}) }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          {isAuthenticated ? (
            <>
              <span style={{ fontSize:"14px", color:"#636e72" }}>
                Hi, {user.name?.split(" ")[0]} &nbsp;
                <span style={S.roleTag}>{user.role}</span>
              </span>
              {unread > 0 && <span className="notif-dot">{unread}</span>}
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}