import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { ErrorAlert } from "../components/ErrorAlert";
import { Logo } from "../components/Logo";

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations with plain language
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!phone.trim() || phone.trim().length < 7) {
      setErrorMessage("Please enter a valid phone number.");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match. Please enter them again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.registerMember({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
      });

      if (res.success) {
        setRegistrationSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to complete registration. Please check your information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div style={{ maxWidth: "520px", margin: "3rem auto" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "2.5rem 2rem",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
            borderTop: "5px solid #0e623a",
            textAlign: "center",
          }}
        >
          <Logo size={64} style={{ margin: "0 auto 1.25rem auto" }} />
          <div style={{ fontSize: "2.5rem", color: "#166534", marginBottom: "0.5rem" }}>✓</div>
          <h1 style={{ fontSize: "1.6rem", color: "#166534", margin: "0 0 0.75rem 0", fontWeight: 800 }}>
            Registration Successful
          </h1>
          <p style={{ color: "#334155", fontSize: "1.05rem", lineHeight: "1.6", margin: "0 0 1rem 0" }}>
            Your application has been received and is being reviewed by AMTMP.
          </p>
          <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: "1.5", margin: "0 0 1.75rem 0", fontWeight: 600 }}>
            Next step: Log in to your member account to check your application status.
          </p>
          <Link
            to="/member/login"
            style={{
              display: "inline-block",
              backgroundColor: "#0e623a",
              color: "#ffffff",
              padding: "0.85rem 2rem",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "0 2px 4px rgba(14, 98, 58, 0.2)",
            }}
          >
            MEMBER LOGIN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "520px", margin: "1.5rem auto 3rem auto" }}>
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
          <Logo size={64} style={{ margin: "0 auto 0.75rem auto" }} />
          <h1 style={{ fontSize: "1.6rem", color: "#0f172a", marginTop: "0.6rem", marginBottom: "0.25rem", fontWeight: 800 }}>
            Become an AMTMP Member
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5" }}>
            Submit your details to apply for membership in the Association of Medical and Traditional Medicine Practitioners.
          </p>
        </div>

        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                  Full Name <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Amina Bello"
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
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Enter your full legal name as it should appear on official AMTMP records.
                </span>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                  Email Address <span style={{ color: "#dc2626" }}>*</span>
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

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                  Phone Number <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
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

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                  Password <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
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

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                  Confirm Password <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
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
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "0.9rem",
                  backgroundColor: isSubmitting ? "#64748b" : "#0e623a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Submitting Application..." : "Submit Membership Application"}
              </button>
            </form>

            <div style={{ marginTop: "1.75rem", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "1rem", fontSize: "0.9rem" }}>
              <span style={{ color: "#64748b" }}>Already registered? </span>
              <Link to="/member/login" style={{ color: "#0e623a", fontWeight: 700, textDecoration: "none" }}>
                Sign In to Member Portal
              </Link>
            </div>
      </div>
    </div>
  );
};
