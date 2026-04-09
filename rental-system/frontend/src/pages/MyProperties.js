import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";

export function MyProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);

  const load = async () => {
    try { const { data } = await api.get("/properties/owner/my"); setProperties(data); }
    catch { toast.error("Failed to load properties."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleAvailability = async (p) => {
    try {
      await api.put(`/properties/${p.id}`, { is_available: !p.is_available });
      toast.success("Updated!");
      load();
    } catch { toast.error("Failed."); }
  };

  const deleteProperty = async (id) => {
    if (!window.confirm("Delete this property? This cannot be undone.")) return;
    try {
      await api.delete(`/properties/${id}`);
      toast.success("Property deleted.");
      load();
    } catch { toast.error("Failed to delete."); }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>🏠 My Listings</h1>
          <p>{properties.length} properties</p>
        </div>
        <Link to="/owner/add-property" className="btn btn-primary">+ Add New</Link>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : properties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h3>No properties yet</h3>
          <p>Add your first property to start getting tenants.</p>
          <Link to="/owner/add-property" className="btn btn-primary" style={{ marginTop: "1rem" }}>+ Add Property</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {properties.map(p => (
            <div key={p.id} className="card">
              <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span className="property-card-badge badge-available" style={{ textTransform: "capitalize" }}>{p.property_type}</span>
                    <span className={`property-card-badge ${p.is_available ? "badge-available" : "badge-unavailable"}`}>
                      {p.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 700 }}>{p.title}</h3>
                  <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>📍 {p.city}, {p.state}</p>
                  <div style={{ display: "flex", gap: "1.5rem", marginTop: 6, fontSize: "0.85rem", color: "var(--text-light)" }}>
                    <span>🛏 {p.bedrooms} bed</span>
                    <span>🚿 {p.bathrooms} bath</span>
                    <span style={{ color: "var(--primary)", fontWeight: 700 }}>₹{Number(p.price_per_month).toLocaleString()}/mo</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link to={`/properties/${p.id}`} className="btn btn-secondary btn-sm">👁 View</Link>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleAvailability(p)}>
                    {p.is_available ? "Mark Unavailable" : "Mark Available"}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteProperty(p.id)}>🗑 Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const AMENITY_OPTIONS = ["WiFi","Parking","AC","Gym","Swimming Pool","Security","Power Backup","Lift","CCTV","Garden","Pet Friendly","Furnished","Semi-Furnished"];

export default function AddProperty() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", address: "", city: "", state: "", zip: "",
    price_per_month: "", bedrooms: 1, bathrooms: 1, area_sqft: "",
    property_type: "apartment", amenities: [], is_available: true,
  });

  const handle = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const toggleAmenity = (a) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a]
    }));
  };

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, price_per_month: Number(form.price_per_month), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), area_sqft: form.area_sqft ? Number(form.area_sqft) : null };
      await api.post("/properties", payload);
      toast.success("Property listed successfully!");
      navigate("/owner/properties");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to add property.");
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>➕ Add New Property</h1>
        <p>List your property on RentEase</p>
      </div>

      <div style={{ maxWidth: 720 }}>
        <form onSubmit={submit} className="card">
          <div className="card-body">
            <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>📋 Basic Information</h3>
            <div className="form-group">
              <label className="form-label">Property Title *</label>
              <input name="title" className="form-control" placeholder="e.g. Modern 2BHK near Metro" value={form.title} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-control" rows="3" placeholder="Describe your property..." value={form.description} onChange={handle} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Property Type *</label>
                <select name="property_type" className="form-control" value={form.property_type} onChange={handle}>
                  {["apartment","house","villa","studio","commercial"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Rent (₹) *</label>
                <input name="price_per_month" type="number" className="form-control" placeholder="15000" value={form.price_per_month} onChange={handle} required />
              </div>
            </div>
            <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <div className="form-group">
                <label className="form-label">Bedrooms</label>
                <input name="bedrooms" type="number" min="0" className="form-control" value={form.bedrooms} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Bathrooms</label>
                <input name="bathrooms" type="number" min="0" className="form-control" value={form.bathrooms} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Area (sq ft)</label>
                <input name="area_sqft" type="number" className="form-control" placeholder="850" value={form.area_sqft} onChange={handle} />
              </div>
            </div>

            <h3 style={{ fontWeight: 700, margin: "1.5rem 0 1.25rem" }}>📍 Location</h3>
            <div className="form-group">
              <label className="form-label">Full Address *</label>
              <input name="address" className="form-control" placeholder="House No, Street, Area" value={form.address} onChange={handle} required />
            </div>
            <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input name="city" className="form-control" placeholder="Dehradun" value={form.city} onChange={handle} required />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input name="state" className="form-control" placeholder="Uttarakhand" value={form.state} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input name="zip" className="form-control" placeholder="248001" value={form.zip} onChange={handle} />
              </div>
            </div>

            <h3 style={{ fontWeight: 700, margin: "1.5rem 0 1rem" }}>✨ Amenities</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AMENITY_OPTIONS.map(a => (
                <button key={a} type="button"
                  onClick={() => toggleAmenity(a)}
                  style={{ padding: "6px 14px", borderRadius: 20, border: `2px solid ${form.amenities.includes(a) ? "var(--primary)" : "var(--border)"}`, background: form.amenities.includes(a) ? "#eff6ff" : "#fff", color: form.amenities.includes(a) ? "var(--primary)" : "var(--text-light)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}>
                  {form.amenities.includes(a) ? "✓ " : ""}{a}
                </button>
              ))}
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="avail" name="is_available" checked={form.is_available} onChange={handle} style={{ width: 18, height: 18, cursor: "pointer" }} />
              <label htmlFor="avail" style={{ fontWeight: 600, cursor: "pointer" }}>Mark as Available Immediately</label>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving..." : "🏠 List Property"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate("/owner/properties")}>Cancel</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
