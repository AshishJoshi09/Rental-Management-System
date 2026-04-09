import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const TYPES = ["", "apartment", "house", "villa", "studio", "commercial"];

export default function Properties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city:"", min_price:"", max_price:"", bedrooms:"", property_type:"", search:"" });

  const fetchProps = async () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ""));
    const res = await api.get("/properties", { params });
    setProperties(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchProps(); }, []);

  const handle = e => setFilters({ ...filters, [e.target.name]: e.target.value });
  const reset = () => { setFilters({ city:"", min_price:"", max_price:"", bedrooms:"", property_type:"", search:"" }); };

  return (
    <div className="page">
      <h2 style={{ marginBottom:"8px" }}>Find Your Perfect Home</h2>
      <p style={{ color:"#636e72", marginBottom:"24px" }}>{properties.length} properties available</p>

      {/* Filters */}
      <div className="card" style={{ marginBottom:"28px" }}>
        <div className="grid-3" style={{ gap:"12px", marginBottom:"12px" }}>
          <input className="form-control" name="search" placeholder="🔍 Search by name or address…" value={filters.search} onChange={handle} />
          <input className="form-control" name="city" placeholder="📍 City" value={filters.city} onChange={handle} />
          <select className="form-control" name="property_type" value={filters.property_type} onChange={handle}>
            <option value="">All Types</option>
            {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
        <div className="grid-3" style={{ gap:"12px" }}>
          <input className="form-control" name="min_price" type="number" placeholder="Min Price / month" value={filters.min_price} onChange={handle} />
          <input className="form-control" name="max_price" type="number" placeholder="Max Price / month" value={filters.max_price} onChange={handle} />
          <select className="form-control" name="bedrooms" value={filters.bedrooms} onChange={handle}>
            <option value="">Any Bedrooms</option>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} BHK</option>)}
          </select>
        </div>
        <div style={{ marginTop:"12px", display:"flex", gap:"10px" }}>
          <button className="btn btn-primary" onClick={fetchProps}>Search</button>
          <button className="btn btn-outline" onClick={() => { reset(); setTimeout(fetchProps, 0); }}>Reset</button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="icon">⏳</div><h3>Loading properties…</h3></div>
      ) : properties.length === 0 ? (
        <div className="empty-state"><div className="icon">🏚️</div><h3>No properties found</h3></div>
      ) : (
        <div className="grid-3">
          {properties.map(p => {
            const imgs = typeof p.images === "string" ? JSON.parse(p.images || "[]") : p.images || [];
            return (
              <div key={p.id} className="property-card" onClick={() => navigate(`/properties/${p.id}`)}>
                {imgs[0] ? <img src={imgs[0]} alt={p.title} /> : <div className="property-img-placeholder">🏠</div>}
                <div className="property-card-body">
                  <div className="property-card-title">{p.title}</div>
                  <div className="property-card-city">📍 {p.city}{p.state ? `, ${p.state}` : ""}</div>
                  <div className="property-card-price">₹{parseFloat(p.price_per_month).toLocaleString()} <span style={{ fontSize:"13px", fontWeight:400, color:"#636e72" }}>/month</span></div>
                  <div className="property-card-meta">
                    <span>🛏 {p.bedrooms} bed</span>
                    <span>🚿 {p.bathrooms} bath</span>
                    {p.area_sqft && <span>📐 {p.area_sqft} sqft</span>}
                    {parseFloat(p.avg_rating) > 0 && <span>⭐ {parseFloat(p.avg_rating).toFixed(1)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}