import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userType, admin, memberAccount, logoutAdmin, logoutMember } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (userType === "admin") {
      await logoutAdmin();
      navigate("/admin/login");
    } else if (userType === "member_account") {
      await logoutMember();
      navigate("/member/login");
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: "#1e293b" }}>
      {/* Association Header */}
      <header style={{ backgroundColor: "#0e623a", color: "#ffffff", borderBottom: "4px solid #d4af37", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          
          {/* Logo and Association Name */}
          <Link to="/" onClick={closeMenu} style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "#ffffff", gap: "0.9rem", maxWidth: "calc(100% - 60px)" }}>
            <Logo size={48} />
            <div>
              <div style={{ fontSize: "clamp(0.85rem, 2.2vw, 1.1rem)", fontWeight: "900", letterSpacing: "0.3px", lineHeight: "1.25" }}>
                ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.9, marginTop: "2px", letterSpacing: "1px", color: "#fef08a", fontWeight: 700 }}>
                AMTMP MEMBERSHIP SYSTEM
              </div>
            </div>
          </Link>

          {/* Hamburger toggle for mobile devices */}
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          {/* Navigation links */}
          <nav className={`desktop-nav ${mobileMenuOpen ? "is-open" : ""}`}>
            <Link
              to="/"
              onClick={closeMenu}
              style={{
                color: "#ffffff",
                textDecoration: "none",
                padding: "0.45rem 0.75rem",
                borderRadius: "4px",
                fontSize: "0.95rem",
                fontWeight: location.pathname === "/" ? 700 : 500,
                backgroundColor: location.pathname === "/" ? "rgba(255,255,255,0.12)" : "transparent",
              }}
            >
              Home
            </Link>

            <Link
              to="/search"
              onClick={closeMenu}
              style={{
                color: "#ffffff",
                textDecoration: "none",
                padding: "0.45rem 0.75rem",
                borderRadius: "4px",
                fontSize: "0.95rem",
                fontWeight: location.pathname === "/search" ? 700 : 500,
                backgroundColor: location.pathname === "/search" ? "rgba(255,255,255,0.12)" : "transparent",
              }}
            >
              Search Member
            </Link>

            {userType === "admin" ? (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={closeMenu}
                  style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#ffffff", textDecoration: "none", padding: "0.45rem 0.85rem", borderRadius: "4px", fontSize: "0.95rem", fontWeight: 700 }}
                >
                  Admin ({admin?.name || "Admin"})
                </Link>
                <button
                  onClick={() => { closeMenu(); handleLogout(); }}
                  style={{ backgroundColor: "#dc2626", color: "#ffffff", border: "none", padding: "0.45rem 0.85rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700 }}
                >
                  Log Out
                </button>
              </>
            ) : userType === "member_account" ? (
              <>
                <Link
                  to="/member/dashboard"
                  onClick={closeMenu}
                  style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#ffffff", textDecoration: "none", padding: "0.45rem 0.85rem", borderRadius: "4px", fontSize: "0.95rem", fontWeight: 700 }}
                >
                  Member Dashboard {memberAccount?.fullName ? `(${memberAccount.fullName.split(" ")[0]})` : ""}
                </Link>
                <button
                  onClick={() => { closeMenu(); handleLogout(); }}
                  style={{ backgroundColor: "#dc2626", color: "#ffffff", border: "none", padding: "0.45rem 0.85rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700 }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  style={{ backgroundColor: "#d4af37", color: "#0f172a", textDecoration: "none", padding: "0.45rem 0.85rem", borderRadius: "4px", fontSize: "0.9rem", fontWeight: 800 }}
                >
                  Become a Member
                </Link>
                <Link
                  to="/member/login"
                  onClick={closeMenu}
                  style={{ backgroundColor: "#ffffff", color: "#0e623a", textDecoration: "none", padding: "0.45rem 0.85rem", borderRadius: "4px", fontSize: "0.9rem", fontWeight: 700 }}
                >
                  Member Login
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "1.5rem 1.25rem", boxSizing: "border-box" }}>
        {children}
      </main>

      {/* Professional Footer */}
      <footer style={{ backgroundColor: "#0f172a", color: "#94a3b8", padding: "2.5rem 1.25rem 1.5rem 1.25rem", borderTop: "1px solid #334155", marginTop: "auto", fontSize: "0.875rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
            {/* Column 1: Association Info */}
            <div>
              <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "1rem", lineHeight: "1.4" }}>
                ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS
              </div>
              <div style={{ marginTop: "6px", color: "#64748b", fontSize: "0.85rem", lineHeight: "1.5" }}>
                Official national membership management, accreditation registry, and practitioner credential verification system.
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                Quick Links
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <Link to="/" style={{ color: "#94a3b8", textDecoration: "none" }}>Home</Link>
                <Link to="/search" style={{ color: "#94a3b8", textDecoration: "none" }}>Search Member</Link>
                <Link to="/register" style={{ color: "#94a3b8", textDecoration: "none" }}>Become a Member</Link>
                <Link to="/member/login" style={{ color: "#94a3b8", textDecoration: "none" }}>Member Login</Link>
              </div>
            </div>

            {/* Column 3: Legal & Support */}
            <div>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                Legal & Governance
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <Link to="/privacy" style={{ color: "#94a3b8", textDecoration: "none" }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: "#94a3b8", textDecoration: "none" }}>Terms of Service</Link>
                <a href="mailto:contact@amtmp.org" style={{ color: "#94a3b8", textDecoration: "none" }}>
                  Contact Us: contact@amtmp.org
                </a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #1e293b", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", fontSize: "0.8rem", color: "#64748b" }}>
            <div>
              © {new Date().getFullYear()} AMTMP. All rights reserved. Association of Medical and Traditional Medicine Practitioners.
            </div>
            <div>
              Official Registry Portal
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
