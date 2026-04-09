import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"tenant", phone:"" });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      login(res.data.token, res.data.user);
      toast.success("Account created!");
      navigate(form.role === "owner" ? "/owner" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ 
      minHeight:"100vh", 
      display:"flex", 
      alignItems:"center", 
      justifyContent:"center", 
      backgroundImage:"linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3)), url('https://i.pinimg.com/736x/8c/c8/ea/8cc8ea3675d04baacf8c22782c263e90.jpg')",
      backgroundSize:"cover",
      backgroundPosition:"center",
      backgroundAttachment:"fixed",
      backgroundRepeat:"no-repeat"
    }}>
      <div className="card" style={{ width:"100%", maxWidth:"460px" }}>
        <h2 style={{ textAlign:"center", marginBottom:"28px", color:"#6c5ce7" }}>🏠 Create Account</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" name="name" value={form.name} onChange={handle} placeholder="John Doe" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" name="password" value={form.password} onChange={handle} placeholder="Min 6 characters" required />
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input className="form-control" name="phone" value={form.phone} onChange={handle} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div className="form-group">
            <label>I am a…</label>
            <select className="form-control" name="role" value={form.role} onChange={handle}>
              <option value="tenant">Tenant – looking to rent</option>
              <option value="owner">Owner – listing properties</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width:"100%" }} disabled={loading}>
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>
        <p style={{ textAlign:"center", marginTop:"20px", color:"#636e72", fontSize:"14px" }}>
          Already have one? <Link to="/login" style={{ color:"#6c5ce7", fontWeight:600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}