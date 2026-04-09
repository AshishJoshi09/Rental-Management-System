import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";

const INIT = { title:"", description:"", address:"", city:"", state:"", zip:"", price_per_month:"", bedrooms:1, bathrooms:1, area_sqft:"", property_type:"apartment", is_available:true };

export default function OwnerDashboard() {
  const [tab, setTab] = useState("listings");
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);

  const fetchAll = () => {
    api.get("/properties/owner/my").then(r => setProperties(r.data));
    api.get("/bookings/owner").then(r => setBookings(r.data));
    api.get("/maintenance/owner").then(r => setMaintenance(r.data));
  };
  useEffect(() => { fetchAll(); }, []);

  const handle = e => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const openEdit = p => {
    setEditing(p.id);
    const imgs = typeof p.images === "string" ? JSON.parse(p.images||"[]") : p.images||[];
    const amen = typeof p.amenities === "string" ? JSON.parse(p.amenities||"[]") : p.amenities||[];
    setForm({ ...p, images: imgs.join(","), amenities: amen.join(",") });
    setShowForm(true);
  };

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form,
      price_per_month: parseFloat(form.price_per_month),
      bedrooms: parseInt(form.bedrooms),
      bathrooms: parseInt(form.bathrooms),
      area_sqft: form.area_sqft ? parseInt(form.area_sqft) : null,
      images: form.images ? form.images.split(",").map(s=>s.trim()).filter(Boolean) : [],
      amenities: form.amenities ? form.amenities.split(",").map(s=>s.trim()).filter(Boolean) : [],
    };
    try {
      if (editing) { await api.put(`/properties/${editing}`, payload); toast.success("Property updated!"); }
      else { await api.post("/properties", payload); toast.success("Property listed!"); }
      setForm(INIT); setEditing(null); setShowForm(false); fetchAll();
    } catch (err) { toast.error(err.response?.data?.msg || "Failed"); }
    finally { setLoading(false); }
  };

  const deleteP = async id => {
    if (!window.confirm("Delete this property?")) return;
    await api.delete(`/properties/${id}`);
    toast.success("Deleted."); fetchAll();
  };

  const updateBooking = async (id, status) => {
    await api.put(`/bookings/${id}/status`, { status });
    toast.success(`Booking ${status}.`); fetchAll();
  };

  const updateMaint = async (id, status) => {
    await api.put(`/maintenance/${id}/status`, { status });
    toast.success("Status updated."); fetchAll();
  };

  const totalRevenue = bookings.filter(b=>b.status==="completed").reduce((a,c)=>a+parseFloat(c.total_amount||0),0);

  return (
    <div className="page">
      <h2 style={{ marginBottom:"24px" }}>Owner Dashboard</h2>

      <div className="grid-4" style={{ marginBottom:"28px" }}>
        {[
          { label:"Listings", value:properties.length, icon:"🏠", bg:"#f0eeff" },
          { label:"Total Bookings", value:bookings.length, icon:"📋", bg:"#d1fae5" },
          { label:"Pending", value:bookings.filter(b=>b.status==="pending").length, icon:"⏳", bg:"#fef3c7" },
          { label:"Revenue", value:`₹${totalRevenue.toLocaleString()}`, icon:"💰", bg:"#fee2e2" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background:s.bg }}>{s.icon}</div>
            <div><div className="stat-label">{s.label}</div><div className="stat-value" style={{ fontSize:s.label==="Revenue"?"18px":"26px" }}>{s.value}</div></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
        {["listings","bookings","maintenance"].map(t => (
          <button key={t} className={`btn ${tab===t?"btn-primary":"btn-outline"} btn-sm`} style={{ textTransform:"capitalize" }} onClick={()=>setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "listings" && (
        <>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
            <button className="btn btn-success" onClick={() => { setEditing(null); setForm(INIT); setShowForm(!showForm); }}>
              {showForm ? "Cancel" : "+ Add Property"}
            </button>
          </div>

          {showForm && (
            <div className="card" style={{ marginBottom:"24px" }}>
              <h3 style={{ marginBottom:"16px" }}>{editing ? "Edit Property" : "Add New Property"}</h3>
              <form onSubmit={submit}>
                <div className="grid-2">
                  <div className="form-group"><label>Title *</label><input className="form-control" name="title" value={form.title} onChange={handle} required /></div>
                  <div className="form-group"><label>City *</label><input className="form-control" name="city" value={form.city} onChange={handle} required /></div>
                  <div className="form-group"><label>Address *</label><input className="form-control" name="address" value={form.address} onChange={handle} required /></div>
                  <div className="form-group"><label>State</label><input className="form-control" name="state" value={form.state} onChange={handle} /></div>
                  <div className="form-group"><label>Price / month (₹) *</label><input className="form-control" type="number" name="price_per_month" value={form.price_per_month} onChange={handle} required /></div>
                  <div className="form-group"><label>Type</label>
                    <select className="form-control" name="property_type" value={form.property_type} onChange={handle}>
                      {["apartment","house","villa","studio","commercial"].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Bedrooms</label><input className="form-control" type="number" name="bedrooms" value={form.bedrooms} onChange={handle} min={0} /></div>
                  <div className="form-group"><label>Bathrooms</label><input className="form-control" type="number" name="bathrooms" value={form.bathrooms} onChange={handle} min={0} /></div>
                  <div className="form-group"><label>Area (sqft)</label><input className="form-control" type="number" name="area_sqft" value={form.area_sqft} onChange={handle} /></div>
                  <div className="form-group"><label>Zip</label><input className="form-control" name="zip" value={form.zip} onChange={handle} /></div>
                </div>
                <div className="form-group"><label>Description</label><textarea className="form-control" rows={3} name="description" value={form.description} onChange={handle} /></div>
                <div className="form-group"><label>Image URLs (comma-separated)</label><input className="form-control" name="images" value={form.images} onChange={handle} placeholder="https://…, https://…" /></div>
                <div className="form-group"><label>Amenities (comma-separated)</label><input className="form-control" name="amenities" value={form.amenities} onChange={handle} placeholder="WiFi, Parking, AC, Gym" /></div>
                <div className="form-group" style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <input type="checkbox" name="is_available" checked={form.is_available} onChange={handle} id="avail" />
                  <label htmlFor="avail" style={{ margin:0 }}>Available for booking</label>
                </div>
                <button className="btn btn-primary" disabled={loading}>{loading ? "Saving…" : editing ? "Update Property" : "Add Property"}</button>
              </form>
            </div>
          )}

          {properties.length === 0 ? <div className="empty-state"><div className="icon">🏚️</div><h3>No listings yet</h3></div>
            : properties.map(p => (
              <div key={p.id} className="card" style={{ marginBottom:"12px", display:"flex", alignItems:"center", gap:"16px" }}>
                <div style={{ fontSize:"32px" }}>🏠</div>
                <div style={{ flex:1 }}>
                  <strong>{p.title}</strong> — {p.city}
                  <div style={{ color:"#636e72", fontSize:"13px" }}>₹{parseFloat(p.price_per_month).toLocaleString()}/mo · {p.bedrooms} bed · {p.property_type}</div>
                </div>
                <span className={`badge badge-${p.is_available?"confirmed":"cancelled"}`}>{p.is_available?"Available":"Unavailable"}</span>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteP(p.id)}>Delete</button>
              </div>
            ))}
        </>
      )}

      {tab === "bookings" && (
        bookings.length === 0 ? <div className="empty-state"><div className="icon">📋</div><h3>No bookings yet</h3></div>
        : <div className="table-wrap card" style={{ padding:0 }}>
            <table>
              <thead><tr><th>Tenant</th><th>Property</th><th>Dates</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.tenant_name}</strong><br/><span style={{ fontSize:"12px", color:"#636e72" }}>{b.tenant_email}</span></td>
                    <td>{b.property_title}</td>
                    <td style={{ fontSize:"13px" }}>{new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}</td>
                    <td><strong>₹{parseFloat(b.total_amount).toLocaleString()}</strong></td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    <td style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                      {b.status === "pending" && <>
                        <button className="btn btn-success btn-sm" onClick={() => updateBooking(b.id,"confirmed")}>Confirm</button>
                        <button className="btn btn-danger btn-sm" onClick={() => updateBooking(b.id,"cancelled")}>Cancel</button>
                      </>}
                      {b.status === "confirmed" && <button className="btn btn-outline btn-sm" onClick={() => updateBooking(b.id,"completed")}>Mark Done</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}

      {tab === "maintenance" && (
        maintenance.length === 0 ? <div className="empty-state"><div className="icon">🔧</div><h3>No maintenance requests</h3></div>
        : <div className="table-wrap card" style={{ padding:0 }}>
            <table>
              <thead><tr><th>Tenant</th><th>Property</th><th>Issue</th><th>Priority</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {maintenance.map(m => (
                  <tr key={m.id}>
                    <td>{m.tenant_name}</td>
                    <td>{m.property_title}</td>
                    <td><strong>{m.title}</strong></td>
                    <td><span className={`badge badge-${m.priority==="urgent"?"cancelled":m.priority==="high"?"pending":"completed"}`}>{m.priority}</span></td>
                    <td><span className={`badge badge-${m.status}`}>{m.status}</span></td>
                    <td>
                      <select className="form-control" style={{ padding:"4px 8px", fontSize:"13px" }}
                        value={m.status} onChange={e => updateMaint(m.id, e.target.value)}>
                        {["open","in_progress","resolved","closed"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}
    </div>
  );
}