import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Logo } from "../components/Logo";

export const Home: React.FC = () => {
  const [quickQuery, setQuickQuery] = useState("");
  const [quickResults, setQuickResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);

    const term = quickQuery.trim();
    if (term.length < 2) {
      setQuickError("Please enter at least 2 characters to search.");
      return;
    }

    setSearching(true);
    try {
      const res = await api.searchMembers(term);
      if (res.success) {
        setQuickResults(res.members);
      }
    } catch (err: any) {
      setQuickError(err.message || "Search failed. Please try again.");
      setQuickResults(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ maxWidth: "960px", margin: "1rem auto 3rem auto" }}>
      {/* Association Hero Banner */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          padding: "2.5rem 2rem",
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          border: "1px solid #e2e8f0",
          borderTop: "6px solid #0e623a",
          marginBottom: "2.25rem",
          textAlign: "center",
        }}
      >
        <Logo size={88} style={{ margin: "0 auto 1.25rem auto" }} />

        <h1
          style={{
            fontSize: "clamp(1.5rem, 3.5vw, 2.1rem)",
            color: "#0f172a",
            marginTop: "0.5rem",
            marginBottom: "0.5rem",
            fontWeight: 900,
            lineHeight: "1.25",
          }}
        >
          ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS
        </h1>

        <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0e623a", letterSpacing: "1px", marginBottom: "1rem" }}>
          AMTMP
        </div>

        <p style={{ fontSize: "1.1rem", color: "#475569", lineHeight: "1.6", maxWidth: "720px", margin: "0 auto" }}>
          Official membership management and practitioner directory for the <strong>Association of Medical and Traditional Medicine Practitioners (AMTMP)</strong>.
        </p>
      </div>

      {/* 4 Primary Action Cards with Large Clear Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* 1. Become a Member */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.75rem",
            borderRadius: "8px",
            border: "2px solid #0e623a",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 2px 4px rgba(14,98,58,0.08)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#0e623a", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
              New Practitioners
            </div>
            <h2 style={{ fontSize: "1.35rem", color: "#0f172a", margin: "0.4rem 0 0.6rem 0", fontWeight: 800 }}>
              Become a Member
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5" }}>
              For medical and traditional medicine practitioners who want to register and submit their membership application to AMTMP.
            </p>
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <Link
              to="/register"
              style={{
                display: "block",
                textAlign: "center",
                backgroundColor: "#0e623a",
                color: "#ffffff",
                padding: "0.85rem 1rem",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "1.05rem",
              }}
            >
              Apply for Membership
            </Link>
          </div>
        </div>

        {/* 2. Member Login */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.75rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
              Registered Members
            </div>
            <h2 style={{ fontSize: "1.35rem", color: "#0f172a", margin: "0.4rem 0 0.6rem 0", fontWeight: 800 }}>
              Member Login
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5" }}>
              For existing or pending members to log in, review application status, and view official registration records.
            </p>
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <Link
              to="/member/login"
              style={{
                display: "block",
                textAlign: "center",
                backgroundColor: "#166534",
                color: "#ffffff",
                padding: "0.85rem 1rem",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "1.05rem",
              }}
            >
              Sign In to Member Portal
            </Link>
          </div>
        </div>

        {/* 3. Search Member */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.75rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
              Public Registry
            </div>
            <h2 style={{ fontSize: "1.35rem", color: "#0f172a", margin: "0.4rem 0 0.6rem 0", fontWeight: 800 }}>
              Search Member
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5" }}>
              Find registered medical and traditional medicine practitioners in the official AMTMP member directory.
            </p>
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <Link
              to="/search"
              style={{
                display: "block",
                textAlign: "center",
                backgroundColor: "#0284c7",
                color: "#ffffff",
                padding: "0.85rem 1rem",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "1.05rem",
              }}
            >
              Search Registered Members
            </Link>
          </div>
        </div>
      </div>

      {/* Embedded Quick Search Section */}
      <div
        id="verification"
        style={{
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "2rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.4rem", color: "#0f172a", margin: "0 0 0.4rem 0", fontWeight: 800 }}>
            Search for a Registered AMTMP Member
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}>
            Search the public registry by practitioner full name or official AMTMP registration number (e.g. <code>AMTMP-26-0001</code>)
          </p>
        </div>

        {quickError && (
          <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem" }}>
            {quickError}
          </div>
        )}

        <form onSubmit={handleQuickSearch} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Enter name or AMTMP registration number"
            style={{
              flex: 1,
              minWidth: "240px",
              padding: "0.85rem 1rem",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{
              backgroundColor: "#0e623a",
              color: "#ffffff",
              border: "none",
              padding: "0.85rem 1.75rem",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: searching ? "not-allowed" : "pointer",
            }}
          >
            {searching ? "Searching..." : "SEARCH"}
          </button>
        </form>

        {quickResults !== null && (
          <div style={{ marginTop: "1.5rem" }}>
            {quickResults.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "1.25rem",
                  borderRadius: "6px",
                  textAlign: "center",
                  color: "#64748b",
                  border: "1px dashed #cbd5e1",
                }}
              >
                No active AMTMP member was found matching your search.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {quickResults.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      padding: "1rem 1.25rem",
                      borderRadius: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "#166534", fontSize: "1.05rem" }}>
                        {m.fullName}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#15803d" }}>
                        Verified AMTMP Practitioner
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: "#0e623a", fontSize: "1rem" }}>
                        {m.registrationNumber}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>
                        Active Member
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
