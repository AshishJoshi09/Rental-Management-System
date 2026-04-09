import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const TYPES = ["", "apartment", "house", "villa", "studio", "commercial"];
const DEFAULT_IMAGES = [
  "https://i.pinimg.com/736x/a4/d1/cf/a4d1cf062362d942b48ca94e07eaa714.jpg",
  "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cm9vbXN8ZW58MHx8MHx8fDA%3D",
  "https://i.pinimg.com/1200x/16/c6/44/16c644ae4c12c94da1eae1e5309a704d.jpg",
  "https://i.pinimg.com/736x/5b/22/49/5b22497427f6080b0e2c36620ab70004.jpg",
  "https://i.pinimg.com/736x/5f/08/39/5f08393aeb2a13a99c6eb685e470fc9c.jpg",
  "https://i.pinimg.com/1200x/ec/8e/61/ec8e619b40b492bb8ef7145e8ae07d3a.jpg",
];

const getDefaultImage = (id) => DEFAULT_IMAGES[(id - 1) % DEFAULT_IMAGES.length];

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
            const mainImage = imgs[0] || getDefaultImage(p.id);
            return (
              <div key={p.id} className="property-card" onClick={() => navigate(`/properties/${p.id}`)}>
                <img src={mainImage} alt={p.title} />
                {imgs.length > 1 && (
                  <div className="property-card-gallery">
                    {imgs.slice(1, 4).map((src, idx) => (
                      <img key={idx} src={src} alt={`${p.title} ${idx + 2}`} className="property-card-thumb" />
                    ))}
                  </div>
                )}
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