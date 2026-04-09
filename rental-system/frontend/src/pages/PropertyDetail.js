import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const DEFAULT_IMAGES = [
  "https://i.pinimg.com/1200x/a3/75/60/a37560dae01a07d75bf99a4b714c1e25.jpg",
  "https://i.pinimg.com/736x/4e/28/f8/4e28f810d2bf579c7b5aba737df55ee3.jpg",
  "https://i.pinimg.com/1200x/1c/90/07/1c900769d5932b49e07bf766747e30df.jpg",
  "https://i.pinimg.com/736x/7f/94/f2/7f94f261daf16d1314bb869354865e28.jpg",
  "https://i.pinimg.com/736x/92/30/a2/9230a2962760b6cfa74e12c37275cc17.jpg",
  "https://i.pinimg.com/1200x/5e/74/2d/5e742d653092a3b344740bd43f65a1df.jpg",
];

const getDefaultImage = (id) => DEFAULT_IMAGES[(id - 1) % DEFAULT_IMAGES.length];

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [booking, setBooking] = useState({ start_date:"", end_date:"", notes:"" });
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/properties/${id}`).then(r => setProperty(r.data));
    api.get(`/reviews/${id}`).then(r => setReviews(r.data));
  }, [id]);

  useEffect(() => {
    if (!property) return;
    const imageList = typeof property.images === "string" ? JSON.parse(property.images || "[]") : property.images || [];
    setSelectedImage(imageList[0] || getDefaultImage(property.id));
  }, [property]);

  const book = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (user.role !== "tenant") { toast.error("Only tenants can book properties."); return; }
    if (!booking.start_date || !booking.end_date) { toast.error("Select check-in and check-out dates."); return; }
    setLoading(true);
    try {
      const res = await api.post("/bookings", { property_id: parseInt(id), ...booking });
      toast.success(`Booking confirmed! Total: ₹${res.data.total_amount}`);
      navigate("/my-bookings");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Booking failed");
    } finally { setLoading(false); }
  };

  if (!property) return <div className="page"><div className="empty-state"><div className="icon">⏳</div><h3>Loading…</h3></div></div>;

  const imgs = typeof property.images === "string" ? JSON.parse(property.images || "[]") : property.images || [];
  const amenities = typeof property.amenities === "string" ? JSON.parse(property.amenities || "[]") : property.amenities || [];

  return (
    <div className="page">
      <button className="btn btn-outline btn-sm" style={{ marginBottom:"20px" }} onClick={() => navigate(-1)}>← Back</button>

      <div className="grid-2" style={{ gap:"32px", alignItems:"start" }}>
        <div>
          <img src={selectedImage} alt={property.title} style={{ width:"100%", borderRadius:"14px", height:"280px", objectFit:"cover" }} />

          {imgs.length > 1 && (
            <div className="property-gallery" style={{ marginTop:"16px" }}>
              {imgs.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`${property.title} ${idx + 1}`}
                  className={`property-gallery-thumb${src === selectedImage ? " active" : ""}`}
                  onClick={() => setSelectedImage(src)}
                />
              ))}
            </div>
          )}

          <div className="card" style={{ marginTop:"20px" }}>
            <h2 style={{ marginBottom:"8px" }}>{property.title}</h2>
            <p style={{ color:"#636e72", marginBottom:"12px" }}>📍 {property.address}, {property.city}</p>
            <div style={{ display:"flex", gap:"16px", flexWrap:"wrap", marginBottom:"16px", fontSize:"14px" }}>
              <span>🛏 {property.bedrooms} Bedrooms</span>
              <span>🚿 {property.bathrooms} Bathrooms</span>
              {property.area_sqft && <span>📐 {property.area_sqft} sqft</span>}
              <span>🏷️ {property.property_type}</span>
            </div>
            <div style={{ fontSize:"28px", fontWeight:800, color:"#6c5ce7", marginBottom:"16px" }}>
              ₹{parseFloat(property.price_per_month).toLocaleString()} <span style={{ fontSize:"15px", fontWeight:400, color:"#636e72" }}>/month</span>
            </div>
            {property.description && <p style={{ color:"#636e72", lineHeight:1.7 }}>{property.description}</p>}

            {amenities.length > 0 && (
              <div style={{ marginTop:"16px" }}>
                <strong style={{ display:"block", marginBottom:"8px" }}>Amenities</strong>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                  {amenities.map(a => <span key={a} style={{ background:"#f0eeff", color:"#6c5ce7", padding:"4px 12px", borderRadius:"20px", fontSize:"13px" }}>✓ {a}</span>)}
                </div>
              </div>
            )}

            <div style={{ marginTop:"16px", padding:"16px", background:"#f8f9fa", borderRadius:"10px" }}>
              <strong>Owner: </strong>{property.owner_name} &nbsp;|&nbsp; 📞 {property.owner_phone || "N/A"}
            </div>
          </div>

          {/* Reviews */}
          <div className="card" style={{ marginTop:"20px" }}>
            <h3 style={{ marginBottom:"16px" }}>Reviews ({reviews.length}) {parseFloat(property.avg_rating) > 0 && `⭐ ${parseFloat(property.avg_rating).toFixed(1)}`}</h3>
            {reviews.length === 0 ? <p style={{ color:"#636e72" }}>No reviews yet.</p>
              : reviews.map(r => (
                <div key={r.id} style={{ padding:"12px 0", borderBottom:"1px solid #f0f0f0" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                    <strong style={{ fontSize:"14px" }}>{r.reviewer_name}</strong>
                    <span style={{ color:"#f39c12" }}>{"⭐".repeat(r.rating)}</span>
                  </div>
                  {r.comment && <p style={{ color:"#636e72", fontSize:"14px" }}>{r.comment}</p>}
                </div>
              ))
            }
          </div>
        </div>

        {/* Booking Panel */}
        <div className="card" style={{ position:"sticky", top:"90px" }}>
          <h3 style={{ marginBottom:"20px" }}>📅 Book This Property</h3>
          <div className="form-group">
            <label>Check-in Date</label>
            <input className="form-control" type="date" value={booking.start_date} min={new Date().toISOString().split("T")[0]}
              onChange={e => setBooking({ ...booking, start_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Check-out Date</label>
            <input className="form-control" type="date" value={booking.end_date} min={booking.start_date || new Date().toISOString().split("T")[0]}
              onChange={e => setBooking({ ...booking, end_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea className="form-control" rows={3} value={booking.notes}
              onChange={e => setBooking({ ...booking, notes: e.target.value })} placeholder="Any special requests…" />
          </div>
          {booking.start_date && booking.end_date && (
            <div style={{ background:"#f0eeff", padding:"12px", borderRadius:"8px", marginBottom:"16px", fontSize:"14px" }}>
              <strong>Estimated Total: </strong>₹{
                (parseFloat(property.price_per_month) / 30 *
                  Math.max(1, Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / 86400000))).toFixed(0)
              }
            </div>
          )}
          <button className="btn btn-primary" style={{ width:"100%" }} onClick={book} disabled={loading || !property.is_available}>
            {!property.is_available ? "Not Available" : loading ? "Booking…" : "Book Now"}
          </button>
          {!isAuthenticated && <p style={{ textAlign:"center", marginTop:"12px", fontSize:"13px", color:"#636e72" }}>Please <a href="/login" style={{ color:"#6c5ce7" }}>login</a> to book.</p>}
        </div>
      </div>
    </div>
  );
}