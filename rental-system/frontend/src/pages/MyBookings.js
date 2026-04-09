import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null); // tracks which booking is being paid

  const load = () =>
    api.get("/bookings/my")
      .then(r => { setBookings(r.data); setLoading(false); })
      .catch(() => { toast.error("Failed to load bookings."); setLoading(false); });

  useEffect(() => { load(); }, []);

  const cancel = async id => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.put(`/bookings/${id}/status`, { status: "cancelled" });
      toast.success("Booking cancelled.");
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to cancel.");
    }
  };

  const loadRazorpayScript = () =>
    new Promise(resolve => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePay = async booking => {
    setPayingId(booking.id);
    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load payment gateway. Check your internet connection.");
        return;
      }

      // 2. Create order on backend
      const { data } = await api.post("/payments/create-order", { booking_id: booking.id });

      // 3. Open Razorpay checkout
      const options = {
        key:         data.key_id,
        amount:      data.amount,
        currency:    data.currency,
        name:        "RentEase",
        description: `Payment for ${booking.property_title}`,
        order_id:    data.order_id,
        handler: async response => {
          try {
            await api.post("/payments/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              booking_id:          booking.id,
            });
            toast.success("✅ Payment successful! Booking confirmed.");
            load();
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: {
          name:  user?.name  || "",
          email: user?.email || "",
        },
        notes: {
          booking_id:  booking.id,
          property:    booking.property_title,
        },
        theme:  { color: "#2563eb" },
        modal: {
          ondismiss: () => toast.info("Payment cancelled."),
        },
      };

      new window.Razorpay(options).open();

    } catch (err) {
      toast.error(err.response?.data?.msg || "Payment initiation failed.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>📅 My Bookings</h1>
        <p>{bookings.length} booking{bookings.length !== 1 ? "s" : ""} found</p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No bookings yet</h3>
          <p>Browse properties and make your first booking!</p>
          <a href="/properties" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Browse Properties
          </a>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.property_title}</strong>
                      <br />
                      <span style={{ color: "var(--text-light)", fontSize: "13px" }}>
                        📍 {b.city}
                      </span>
                    </td>
                    <td>{new Date(b.start_date).toLocaleDateString()}</td>
                    <td>{new Date(b.end_date).toLocaleDateString()}</td>
                    <td>
                      <strong style={{ color: "var(--primary)" }}>
                        ₹{parseFloat(b.total_amount).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <span className={`status status-${b.status}`}>{b.status}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>

                        {/* Pay button — only for confirmed + unpaid bookings */}
                        {b.status === "confirmed" && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handlePay(b)}
                            disabled={payingId === b.id}
                          >
                            {payingId === b.id ? "Opening…" : `💳 Pay ₹${Number(b.total_amount).toLocaleString()}`}
                          </button>
                        )}

                        {/* Cancel button — pending or confirmed */}
                        {["pending", "confirmed"].includes(b.status) && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => cancel(b.id)}
                          >
                            Cancel
                          </button>
                        )}

                        {/* Completed label */}
                        {b.status === "completed" && (
                          <span style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: 600 }}>
                            ✅ Paid
                          </span>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}