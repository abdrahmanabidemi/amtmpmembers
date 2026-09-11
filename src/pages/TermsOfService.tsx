import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

export const TermsOfService: React.FC = () => {
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
            Terms of Service
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
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or using the official web portal of the Association of Medical and Traditional Medicine Practitioners (AMTMP), you agree to be bound by these Terms of Service. If you do not agree to these terms, you should refrain from using this portal.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              2. Practitioner Eligibility and Registration
            </h2>
            <p>
              Membership in AMTMP is open only to bona fide practitioners of conventional medical disciplines and certified traditional/natural medicine practices who comply with ethical and professional standards.
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Applicants must provide authentic, verifiable, and accurate personal and professional credentials during registration.</li>
              <li>Submission of fraudulent credentials or misleading information constitutes grounds for immediate disqualification and possible referral to regulatory authorities.</li>
              <li>Approval of membership is subject to independent review by the AMTMP administration.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              3. Official Identity Cards & QR Verification
            </h2>
            <p>
              AMTMP issues digital and printable membership identity cards equipped with unique cryptographically verified QR tokens and verification codes.
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>The ID card remains the official property of AMTMP.</li>
              <li>The card is issued exclusively to the named practitioner and is strictly non-transferable.</li>
              <li>Any alteration, forgery, duplication, or misuse of an AMTMP credential or QR code is strictly prohibited.</li>
              <li>The association reserves the right to revoke, suspend, or invalidate any identity card if the practitioner breaches professional ethics, falls into dues arrears, or is deactivated.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              4. Association Dues & Good Standing
            </h2>
            <p>
              To maintain active membership and an authorized status in the public verification registry, practitioners are required to fulfill statutory monthly or annual membership dues in accordance with association bylaws.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              5. Permitted Use of the Public Registry
            </h2>
            <p>
              The public practitioner registry is provided as a service to the community, healthcare consumers, and regulatory agencies to confirm practitioner accreditation. Automated scraping, data harvesting, or mass extraction of member data is strictly prohibited.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              6. Code of Conduct and Disciplinary Measures
            </h2>
            <p>
              All members must adhere to high standards of medical practice, hygiene, safety, and ethical care. The association reserves the right to deactivate membership, revoke credentials, and remove practitioners from the public directory upon investigation of malpractice or violation of association standards.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800, marginBottom: "0.75rem" }}>
              7. Inquiries and Contact
            </h2>
            <div style={{ backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 800, color: "#0e623a", fontSize: "1.05rem" }}>
                ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS (AMTMP)
              </div>
              <div style={{ marginTop: "0.5rem", color: "#475569" }}>
                National Executive Council & Administrative Secretariat
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
