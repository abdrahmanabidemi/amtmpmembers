import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

export const PrivacyPolicy: React.FC = () => {
  return (
    <div style={{ maxWidth: "860px", margin: "1.5rem auto 3rem auto" }}>
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          padding: "2.5rem 2rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid #e2e8f0",
          borderTop: "5px solid #0e623a",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Logo size={64} style={{ margin: "0 auto 1rem auto" }} />
          <h1
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              color: "#0f172a",
              margin: "0 0 0.5rem 0",
              fontWeight: 900,
            }}
          >
            Privacy Policy
          </h1>
          <div style={{ fontSize: "0.95rem", color: "#0e623a", fontWeight: 700 }}>
            ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS (AMTMP)
          </div>
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            Official Membership Registry & Practitioner Verification System
          </p>
        </div>

        <div style={{ color: "#334155", lineHeight: "1.7", fontSize: "1rem" }}>
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              1. Introduction
            </h2>
            <p>
              The Association of Medical and Traditional Medicine Practitioners (AMTMP) is dedicated to safeguarding the personal and professional data entrusted to us by our members, registered practitioners, and the public. This Privacy Policy details our practices concerning data collection, processing, confidentiality, and data protection across our official web portal.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              2. Data We Collect
            </h2>
            <p>To administer professional accreditation and maintain the registry of qualified practitioners, AMTMP collects:</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li><strong>Practitioner Identity Information:</strong> Full legal name, professional title, and passport photograph.</li>
              <li><strong>Contact Information:</strong> Valid email address and telephone number.</li>
              <li><strong>Accreditation & Registry Records:</strong> Official AMTMP registration number, admission date, membership status, and administrative notes.</li>
              <li><strong>Association Dues:</strong> Records of payment status, amounts, payment dates, and payment references.</li>
              <li><strong>Verification Data:</strong> Unique card verification codes, QR tokens, and issue/revocation records.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              3. How Your Information is Used
            </h2>
            <p>AMTMP processes practitioner and applicant data strictly for association management:</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Evaluating and verifying membership eligibility and applications.</li>
              <li>Issuing secure, verifiable AMTMP membership identity cards with digital QR verification.</li>
              <li>Providing an authentic public verification registry to assist healthcare seekers, hospitals, and regulatory bodies in identifying certified practitioners.</li>
              <li>Maintaining annual dues and good-standing records.</li>
              <li>Communicating critical association updates and regulatory guidelines.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              4. Public Registry & Privacy Safeguards
            </h2>
            <p>
              Only active, approved practitioners appear in the public verification directory. Publicly queryable records are restricted to:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Practitioner Full Name</li>
              <li>AMTMP Registration Number</li>
              <li>Current Membership Status (Active)</li>
              <li>Credential Verification details when scanning the official physical or digital ID card QR code</li>
            </ul>
            <p style={{ marginTop: "0.5rem" }}>
              Personal telephone numbers, email addresses, and payment transaction details are strictly kept private and are never exposed in public search results.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              5. Data Security Measures
            </h2>
            <p>
              We implement comprehensive security controls including salted password hashing (bcrypt), encrypted session cookies, parameter sanitization, and strict role-based access restrictions to protect member data from unauthorized access or compromise.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              6. Member Access & Corrections
            </h2>
            <p>
              Members may view and update their contact telephone and email address anytime through the Member Portal. For legal name corrections or registry amendments, members may contact association executive leadership.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              7. Contact Information
            </h2>
            <div style={{ backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 800, color: "#0e623a", fontSize: "1.05rem" }}>
                ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS (AMTMP)
              </div>
              <div style={{ marginTop: "0.5rem", color: "#475569" }}>
                National Secretariat & Practitioner Registry
              </div>
              <div style={{ marginTop: "0.25rem" }}>
                Email: <a href="mailto:contact@amtmp.org" style={{ color: "#0e623a", fontWeight: 700 }}>contact@amtmp.org</a>
              </div>
              <div style={{ marginTop: "0.25rem" }}>
                Website: <span style={{ fontWeight: 600 }}>amtmp.org</span>
              </div>
            </div>
          </section>
        </div>

        <div style={{ marginTop: "2.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.5rem", textAlign: "center" }}>
          <Link
            to="/"
            style={{
              backgroundColor: "#0e623a",
              color: "#ffffff",
              padding: "0.65rem 1.75rem",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 700,
              display: "inline-block",
            }}
          >
            Return to AMTMP Home
          </Link>
        </div>
      </div>
    </div>
  );
};
