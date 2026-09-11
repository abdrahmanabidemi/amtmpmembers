import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { Logo } from "../components/Logo";

export const PublicVerification: React.FC = () => {
  const { token } = useParams<{ token?: string }>();
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const performVerification = async (paramToken?: string, paramCode?: string) => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      let res;
      if (paramToken) {
        res = await api.verifyByToken(paramToken);
      } else if (paramCode) {
        res = await api.verifyByCode(paramCode.trim());
      } else {
        setLoading(false);
        return;
      }

      if (res.success && res.verified) {
        setResult(res);
      } else {
        setError("Card verification failed. The provided card is either expired, revoked, or not recognized.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or unrecognized verification credential.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      performVerification(token, undefined);
    }
  }, [token]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setError("Please enter a card verification code (e.g. V-XXXX-XXXX-XX).");
      return;
    }
    performVerification(undefined, manualCode.trim());
  };

  return (
    <div style={{ maxWidth: "760px", margin: "1rem auto 3rem auto" }}>
      {/* Title & Branding */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          borderTop: "6px solid #0e623a",
          marginBottom: "1.75rem",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
          <Logo size={64} />
        </div>
        <h1 style={{ fontSize: "1.6rem", color: "#0f172a", margin: "0.25rem 0 0.5rem 0", fontWeight: 800 }}>
          Official AMTMP Credential Verification
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
          ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS
        </p>
      </div>

      {/* Manual Code Input Form */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "1.5rem 2rem",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          marginBottom: "1.75rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", color: "#1e293b", margin: "0 0 0.75rem 0", fontWeight: 700 }}>
          Verify by Card Verification Code
        </h2>
        <form onSubmit={handleManualSearch} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter code (e.g. V-8F4K-92XQ-71)"
            style={{
              flex: 1,
              minWidth: "220px",
              padding: "0.65rem 0.85rem",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
              fontFamily: "monospace",
              textTransform: "uppercase",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#0e623a",
              color: "#ffffff",
              padding: "0.65rem 1.4rem",
              borderRadius: "6px",
              border: "none",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
            }}
          >
            {loading ? "Verifying..." : "Verify Credential"}
          </button>
        </form>
      </div>

      {loading && <LoadingSpinner message="Checking AMTMP verification registry..." />}
      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Verified ID Card Display */}
      {result && result.verified && (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
            borderTop: "6px solid #16a34a",
            boxShadow: "0 4px 12px rgba(22, 163, 74, 0.12)",
            overflow: "hidden",
            marginBottom: "2rem",
          }}
        >
          {/* Verification Banner */}
          <div
            style={{
              backgroundColor: "#f0fdf4",
              padding: "1rem 1.5rem",
              borderBottom: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.4rem", color: "#16a34a" }}>✓</span>
              <span style={{ fontWeight: 800, color: "#166534", fontSize: "1.05rem" }}>
                OFFICIAL AMTMP CREDENTIAL VERIFIED
              </span>
            </div>
            <span
              style={{
                backgroundColor: "#dcfce7",
                color: "#166534",
                padding: "0.25rem 0.65rem",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              Status: Active
            </span>
          </div>

          <div style={{ padding: "1.75rem 2rem" }}>
            <div style={{ display: "flex", gap: "1.75rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* Photo */}
              <div
                style={{
                  width: "120px",
                  height: "140px",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {result.member.passportPhotoRef ? (
                  <img
                    src={result.member.passportPhotoRef}
                    alt={result.member.fullName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "#94a3b8", fontSize: "0.75rem", textAlign: "center", padding: "0.5rem" }}>
                    No Photo on File
                  </span>
                )}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: "240px" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Practitioner Full Legal Name
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", marginTop: "0.15rem" }}>
                  {result.member.fullName}
                </div>

                <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Registration Number
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0e623a", marginTop: "0.15rem" }}>
                      {result.member.registrationNumber}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Membership Standing
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "#166534", marginTop: "0.15rem" }}>
                      {result.member.memberStatus.toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Verification Code
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#334155", marginTop: "0.15rem", fontFamily: "monospace" }}>
                      {result.card.verificationCode}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Card Issue Date
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#475569", marginTop: "0.15rem" }}>
                      {new Date(result.card.issuedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "1.5rem",
                padding: "0.85rem 1rem",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#64748b",
                textAlign: "center",
              }}
            >
              This official practitioner verification record is cryptographically validated and maintained directly by the Association of Medical and Traditional Medicine Practitioners (AMTMP).
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link
          to="/search"
          style={{ color: "#0e623a", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem" }}
        >
          ← Search AMTMP Public Directory
        </Link>
      </div>
    </div>
  );
};