import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";

export default function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ property_id:"", title:"", description:"", priority:"medium" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetch = () => {
    api.get("/maintenance/my").then(r => setRequests(r.data));
    api.get("/bookings/my").then(r => setBookings(r.data.filter(b => b.status === "confirmed")));
  };
  useEffect(() => { fetch(); }, []);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    if (!form.property_id) { toast.error("Select a property."); return; }
    setLoading(true);
    try {
      await api.post("/maintenance", { ...form, property_id: parseInt(form.property_id) });
      toast.success("Request submitted!");
      setForm({ property_id:"", title:"", description:"", priority:"medium" });
      setShowForm(false);
      fetch();
    } catch (err) { toast.error(err.response?.data?.msg || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
        <h2>🔧 Maintenance Requests</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ New Request"}</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom:"24px" }}>
          <h3 style={{ marginBottom:"16px" }}>New Maintenance Request</h3>
          <form onSubmit={submit}>
            <div className="grid-2">
              <div className="form-group">
                <label>Property</label>
                <select className="form-control" name="property_id" value={form.property_id} onChange={handle} required>
                  <option value="">Select a property…</option>
                  {bookings.map(b => <option key={b.id} value={b.property_id}>{b.property_title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" name="priority" value={form.priority} onChange={handle}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Issue Title</label>
              <input className="form-control" name="title" value={form.title} onChange={handle} placeholder="e.g. Water leak in bathroom" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3} name="description" value={form.description} onChange={handle} placeholder="Describe the issue in detail…" />
            </div>
            <button className="btn btn-primary" disabled={loading}>{loading ? "Submitting…" : "Submit Request"}</button>
          </form>
        </div>
      )}

      {requests.length === 0
        ? <div className="empty-state"><div className="icon">🔧</div><h3>No maintenance requests</h3></div>
        : (
          <div className="table-wrap card" style={{ padding:0 }}>
            <table>
              <thead><tr><th>Property</th><th>Issue</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td>{r.property_title}</td>
                    <td><strong>{r.title}</strong>{r.description && <><br/><span style={{ color:"#636e72", fontSize:"13px" }}>{r.description}</span></>}</td>
                    <td><span className={`badge badge-${r.priority === "urgent" ? "cancelled" : r.priority === "high" ? "pending" : "completed"}`}>{r.priority}</span></td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td style={{ fontSize:"13px", color:"#636e72" }}>{new Date(r.created_at).toLocaleDateString()}</td>
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