import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorAlert } from "../components/ErrorAlert";
import { Logo } from "../components/Logo";

export const AdminLogin: React.FC = () => {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both your administrator email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginAdmin({ email: email.trim(), password });
      navigate("/admin/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid administrator credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "460px", margin: "2rem auto 3rem auto" }}>
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "2.25rem 2rem",
          borderRadius: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
          borderTop: "5px solid #1e293b",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <Logo size={60} style={{ margin: "0 auto 0.75rem auto" }} />
          <h1 style={{ fontSize: "1.6rem", color: "#0f172a", marginTop: "0.4rem", marginBottom: "0.25rem", fontWeight: 800 }}>
            Admin Login
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}>
            Sign in to manage AMTMP member records and applications.
          </p>
        </div>

        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@amtmp.org"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  paddingRight: "2.75rem",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: "1.1rem",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "0.85rem",
              backgroundColor: isSubmitting ? "#64748b" : "#1e293b",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
            }}
          >
            {isSubmitting ? "SIGNING IN..." : "LOGIN"}
          </button>
        </form>

        <div style={{ marginTop: "1.75rem", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "1rem", fontSize: "0.85rem" }}>
          <span style={{ color: "#64748b" }}>Are you an AMTMP member? </span>
          <Link to="/member/login" style={{ color: "#0e623a", fontWeight: 700, textDecoration: "none" }}>
            Go to Member Login
          </Link>
        </div>
      </div>
    </div>
  );
};
