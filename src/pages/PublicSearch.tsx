import React, { useState } from "react";
import { api } from "../services/api";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Logo } from "../components/Logo";

export const PublicSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{
    fullName: string;
    registrationNumber: string;
    memberStatus: string;
  }> | null>(null);

  const [searchedQuery, setSearchedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = query.trim();
    if (clean.length < 2) {
      setErrorMessage("Please enter at least 2 characters to search.");
      return;
    }

    setIsLoading(true);
    setSearchedQuery(clean);
    try {
      const res = await api.searchMembers(clean);
      if (res.success) {
        setResults(res.members);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while searching. Please try again.");
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "1.5rem auto 3rem auto" }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          borderTop: "5px solid #0e623a",
          textAlign: "center",
          marginBottom: "1.75rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Logo size={60} style={{ margin: "0 auto 0.75rem auto" }} />
        <span
          style={{
            backgroundColor: "#dcfce7",
            color: "#166534",
            padding: "0.2rem 0.65rem",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Public Practitioner Registry
        </span>
        <h1 style={{ fontSize: "1.75rem", color: "#0f172a", marginTop: "0.6rem", marginBottom: "0.5rem", fontWeight: 800 }}>
          Search for a Registered AMTMP Member
        </h1>
        <p style={{ color: "#475569", fontSize: "1rem", lineHeight: "1.5", maxWidth: "600px", margin: "0 auto" }}>
          Search by member name or AMTMP registration number to find active registered practitioners in the <strong>Association of Medical and Traditional Medicine Practitioners</strong>.
        </p>
      </div>

      {/* Search Input Box */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "1.5rem",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          marginBottom: "1.75rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter practitioner full name or AMTMP registration number (e.g. AMTMP-26-0001)"
            style={{
              flex: 1,
              minWidth: "260px",
              padding: "0.85rem 1rem",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              backgroundColor: "#0e623a",
              color: "#ffffff",
              border: "none",
              padding: "0.85rem 1.75rem",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.65rem" }}>
          Tip: You can search by practitioner surname, first name, or official number format like <code>AMTMP-26-0001</code>.
        </div>
      </div>

      {/* Search Results Display */}
      {isLoading && <LoadingSpinner message="Searching verified AMTMP member database..." />}

      {results !== null && !isLoading && (
        <div>
          {results.length === 0 ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "2rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🔍</div>
              <h3 style={{ fontSize: "1.15rem", color: "#1e293b", margin: "0 0 0.5rem 0" }}>
                No active AMTMP member was found matching your search.
              </h3>
              <p style={{ fontSize: "0.95rem", margin: 0 }}>
                Please verify the spelling of the name or check the registration number (e.g. <code>AMTMP-26-0001</code>). Only currently approved and active practitioners appear in this public registry.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#475569" }}>
                Found <strong>{results.length}</strong> active registered member{results.length === 1 ? "" : "s"} matching "<strong>{searchedQuery}</strong>":
              </div>

              <div style={{ display: "grid", gap: "1rem" }}>
                {results.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#ffffff",
                      padding: "1.25rem 1.5rem",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      borderLeft: "5px solid #16a34a",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1rem",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                        {m.fullName}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                        Official AMTMP Practitioner Record
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                          padding: "0.3rem 0.75rem",
                          borderRadius: "4px",
                          fontWeight: 800,
                          fontSize: "1rem",
                          letterSpacing: "0.5px",
                          display: "inline-block",
                        }}
                      >
                        {m.registrationNumber}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700, marginTop: "0.25rem" }}>
                        ● Active Member in Good Standing
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ID Card Verification link */}
      <div
        style={{
          marginTop: "2rem",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "1.25rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>
            Hold an AMTMP ID Card with a QR Code or Verification Code?
          </div>
          <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Scan the QR code or enter the unique verification code directly.
          </div>
        </div>
        <a
          href="/verify"
          style={{
            backgroundColor: "#0e623a",
            color: "#ffffff",
            padding: "0.5rem 1.1rem",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          Verify ID Card
        </a>
      </div>
    </div>
  );
};
