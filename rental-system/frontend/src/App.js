import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Dashboard from "./pages/Dashboard";
import MyBookings from "./pages/MyBookings";
import MyPayments from "./pages/MyPayments";
import Maintenance from "./pages/Maintenance";
import OwnerDashboard from "./pages/OwnerDashboard";
import Admin from "./pages/Admin";

const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: "70px" }}>
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/properties"} replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute roles={["tenant"]}><MyBookings /></ProtectedRoute>} />
          <Route path="/my-payments" element={<ProtectedRoute roles={["tenant"]}><MyPayments /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute roles={["tenant"]}><Maintenance /></ProtectedRoute>} />
          <Route path="/owner" element={<ProtectedRoute roles={["owner"]}><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
