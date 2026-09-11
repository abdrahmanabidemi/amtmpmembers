import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorAlert } from "../components/ErrorAlert";
import { Logo } from "../components/Logo";
import { useEscapeKey } from "../hooks/useEscapeKey";

export const MemberLogin: React.FC = () => {
  const { loginMember } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Pressing Escape closes Forgot Password modal
  useEscapeKey(() => setShowForgotPassword(false), showForgotPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both your registered email address and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginMember({ email: email.trim(), password });
      navigate("/member/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "The email or password is incorrect. Please try again.");
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
          borderTop: "5px solid #0e623a",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <Logo size={60} style={{ margin: "0 auto 0.75rem auto" }} />
          <h1 style={{ fontSize: "1.6rem", color: "#0f172a", marginTop: "0.4rem", marginBottom: "0.25rem", fontWeight: 800 }}>
            Member Login
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}>
            Sign in to access your membership status and association profile.
          </p>
        </div>

        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
              Registered Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="practitioner@example.com"
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

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#334155" }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0e623a",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Forgot Password?
              </button>
            </div>
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
              backgroundColor: isSubmitting ? "#64748b" : "#0e623a",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              marginTop: "0.5rem",
            }}
          >
            {isSubmitting ? "SIGNING IN..." : "LOGIN"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "1rem", fontSize: "0.9rem" }}>
          <span style={{ color: "#64748b" }}>Not yet registered? </span>
          <Link to="/register" style={{ color: "#0e623a", fontWeight: 700, textDecoration: "none" }}>
            Apply for Membership
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal (Requirement #19) */}
      {showForgotPassword && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForgotPassword(false);
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ fontSize: "1.25rem", color: "#0f172a", marginTop: 0, marginBottom: "0.75rem", fontWeight: 800 }}>
              Forgot your password?
            </h3>
            <p style={{ color: "#334155", fontSize: "0.95rem", lineHeight: "1.6", margin: "0 0 1.5rem 0" }}>
              Please contact the AMTMP administrator to reset your account password.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                style={{
                  backgroundColor: "#0e623a",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
