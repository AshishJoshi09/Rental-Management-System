import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token, res.data.user);
      toast.success("Welcome back!");
      const role = res.data.user.role;
      navigate(role === "admin" ? "/admin" : role === "owner" ? "/owner" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ 
      minHeight:"100vh", 
      display:"flex", 
      alignItems:"center", 
      justifyContent:"center", 
      backgroundImage:"linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.3)), url('https://i.pinimg.com/736x/9b/0b/49/9b0b49fb3b357ea98f486bb2b44c8e2b.jpg')",
      backgroundSize:"cover",
      backgroundPosition:"center",
      backgroundAttachment:"fixed",
      backgroundRepeat:"no-repeat"
    }}>
      <div className="card" style={{ width:"100%", maxWidth:"420px" }}>
        <h2 style={{ textAlign:"center", marginBottom:"28px", color:"#6c5ce7" }}>🏠 Welcome Back</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" style={{ width:"100%" }} disabled={loading}>
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>
        <p style={{ textAlign:"center", marginTop:"20px", color:"#636e72", fontSize:"14px" }}>
          No account? <Link to="/register" style={{ color:"#6c5ce7", fontWeight:600 }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}