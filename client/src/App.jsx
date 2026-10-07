import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import { AuthPage } from "./pages/AuthPages.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Policies from "./pages/Policies.jsx";
import Claims from "./pages/Claims.jsx";
import ClaimForm from "./pages/ClaimForm.jsx";
import Verification from "./pages/Verification.jsx";
import Profile from "./pages/Profile.jsx";
import AdminPolicyForm from "./pages/AdminPolicyForm.jsx";
import PolicyCatalog from "./pages/PolicyCatalog.jsx";
import AdminProductForm from "./pages/AdminProductForm.jsx";
import Purchases from "./pages/Purchases.jsx";
import MockPayment from "./pages/MockPayment.jsx";
import Notifications from "./pages/Notifications.jsx";

export default function App() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/register" element={session ? <Navigate to="/dashboard" replace /> : <AuthPage register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/policy-catalog" element={<PolicyCatalog />} />
          <Route path="/payment" element={<MockPayment />} />
          <Route path="/payments" element={<Purchases />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/claims/new" element={<ClaimForm />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<Layout />}>
          <Route path="/admin/policies/new" element={<AdminPolicyForm />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />
          <Route path="/admin/purchases" element={<Purchases />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
