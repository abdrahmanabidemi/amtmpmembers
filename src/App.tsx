import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Register } from "./pages/Register";
import { PublicSearch } from "./pages/PublicSearch";
import { AdminLogin } from "./pages/AdminLogin";
import { MemberLogin } from "./pages/MemberLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { MemberDashboard } from "./pages/MemberDashboard";
import { PublicVerification } from "./pages/PublicVerification";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<PublicSearch />} />
            <Route path="/verify" element={<PublicVerification />} />
            <Route path="/verify/:token" element={<PublicVerification />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/member/login" element={<MemberLogin />} />
            
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/member/dashboard"
              element={
                <ProtectedRoute requiredRole="member_account">
                  <MemberDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback 404 route */}
            <Route
              path="*"
              element={
                <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <h2 style={{ fontSize: "1.75rem", color: "#0f172a" }}>Page Not Found</h2>
                  <p style={{ color: "#64748b", margin: "0.75rem 0 1.5rem 0" }}>
                    The page you are looking for does not exist in the AMTMP system.
                  </p>
                  <Link
                    to="/"
                    style={{
                      backgroundColor: "#0e623a",
                      color: "#ffffff",
                      padding: "0.6rem 1.25rem",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Return to AMTMP Home
                  </Link>
                </div>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
