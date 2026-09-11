import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { Logo } from "../components/Logo";
import { useEscapeKey } from "../hooks/useEscapeKey";

export const MemberDashboard: React.FC = () => {
  const { memberAccount, memberProfile } = useAuth();
  const [profile, setProfile] = useState<any>(memberProfile);
  const [account, setAccount] = useState<any>(memberAccount);
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Self-Service Edit Contact Info state
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [editForm, setEditForm] = useState({ email: "", phone: "" });
  const [editLoading, setEditLoading] = useState(false);

  // View ID Card Modal state
  const [showCardModal, setShowCardModal] = useState(false);

  // Passport Photo Upload state
  const [photoUploading, setPhotoUploading] = useState(false);

  // Keyboard Escape handlers
  useEscapeKey(() => setShowEditContactModal(false), showEditContactModal);
  useEscapeKey(() => setShowCardModal(false), showCardModal);

  const fetchProfileAndCard = async () => {
    try {
      const res = await api.getMemberMe();
      if (res.success) {
        setAccount(res.account);
        setProfile(res.member);
        setEditForm({
          email: res.account.email,
          phone: res.account.phone,
        });

        if (res.account?.membershipStatus?.toLowerCase() === "approved") {
          const cRes = await api.getMyIdCard();
          if (cRes.success && (cRes.hasCard || cRes.card)) {
            setCardData(cRes);
          } else {
            setCardData(null);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load member profile details.");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProfileAndCard().finally(() => setLoading(false));
  }, []);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.updateMemberProfile(editForm);
      if (res.success) {
        setSuccessMessage("Your contact information has been updated successfully.");
        setAccount(res.account);
        setShowEditContactModal(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update contact details.");
    } finally {
      setEditLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side guardrail: 2 MB limit check
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Photo exceeds the 2 MB limit. Please select a photo under 2 MB.");
      e.target.value = "";
      return;
    }

    setPhotoUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.uploadMemberSelfPhoto(file);
      if (res.success) {
        setSuccessMessage("Passport photograph uploaded successfully.");
        await fetchProfileAndCard();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload photo. Only genuine JPG and PNG files under 2 MB are accepted.");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your membership portal..." />;
  }

  const status = account?.membershipStatus?.toLowerCase() || "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isPending = status === "pending";

  const hasIssuedCard = Boolean(cardData && (cardData.hasCard || cardData.card));
  const cardDetails = cardData?.card || {};
  const memberDetails = cardData?.member || profile || {};
  const qrDataUrl = cardData?.qrCodeDataUrl || cardDetails.qrDataUri;

  return (
    <div style={{ maxWidth: "860px", margin: "1rem auto 3rem auto" }}>
      {/* Header Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          borderLeft: isApproved ? "6px solid #16a34a" : isRejected ? "6px solid #dc2626" : "6px solid #d97706",
          marginBottom: "1.75rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Passport Photo */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "90px",
                  height: "110px",
                  borderRadius: "6px",
                  border: "2px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {profile?.passportPhotoRef || account?.passportPhotoRef ? (
                  <img
                    src={profile?.passportPhotoRef || account?.passportPhotoRef}
                    alt={account?.fullName || "Member"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.75rem", padding: "0.5rem" }}>
                    No Photo
                  </div>
                )}
              </div>

              {/* Photo Upload Trigger (Only for Approved Members) */}
              {isApproved && (
                <label
                  title="Upload / Replace Passport Photograph (Max 2 MB JPG/PNG)"
                  style={{
                    position: "absolute",
                    bottom: "-6px",
                    right: "-6px",
                    backgroundColor: "#0e623a",
                    color: "#ffffff",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    cursor: photoUploading ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                >
                  {photoUploading ? "…" : "📷"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={photoUploading}
                    style={{ display: "none" }}
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <Logo size={36} />
                <span
                  style={{
                    backgroundColor: isApproved ? "#dcfce7" : isRejected ? "#fee2e2" : "#fef3c7",
                    color: isApproved ? "#166534" : isRejected ? "#991b1b" : "#92400e",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {isApproved ? "Approved Member" : isRejected ? "Application Not Approved" : "Application Pending"}
                </span>
              </div>

              <h1 style={{ fontSize: "1.7rem", color: "#0f172a", margin: "0.2rem 0 0.3rem 0", fontWeight: 800 }}>
                {account?.fullName || profile?.fullName || "AMTMP Practitioner"}
              </h1>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
                Email: <strong>{account?.email}</strong> &nbsp;•&nbsp; Phone: <strong>{account?.phone}</strong>
              </p>
            </div>
          </div>

          {/* Registration Number Card (Only if Approved) */}
          {isApproved && profile?.registrationNumber && (
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "2px solid #16a34a",
                padding: "1rem 1.25rem",
                borderRadius: "8px",
                textAlign: "center",
                minWidth: "200px",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#166534", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                Official AMTMP Number
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0e623a", marginTop: "0.35rem", letterSpacing: "1px" }}>
                {profile.registrationNumber}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 600, marginTop: "0.25rem" }}>
                ● Active Official Standing
              </div>
            </div>
          )}
        </div>
      </div>

      <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      {successMessage && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderLeft: "5px solid #16a34a",
            color: "#166534",
            padding: "0.85rem 1.25rem",
            borderRadius: "6px",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{ background: "none", border: "none", color: "#166534", fontWeight: 700, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Pending Application Guidance Box */}
      {isPending && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fef3c7",
            borderLeft: "5px solid #d97706",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "1.75rem",
          }}
        >
          <h2 style={{ fontSize: "1.15rem", color: "#92400e", margin: "0 0 0.5rem 0", fontWeight: 700 }}>
            Application Under Review
          </h2>
          <p style={{ color: "#78350f", margin: 0, lineHeight: "1.6", fontSize: "0.95rem" }}>
            Your membership registration has been received by AMTMP and is awaiting review. Once approved, your official AMTMP Registration Number and member credentials will appear here.
          </p>
        </div>
      )}

      {/* Rejected Application Notice Box */}
      {isRejected && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderLeft: "5px solid #dc2626",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "1.75rem",
          }}
        >
          <h2 style={{ fontSize: "1.15rem", color: "#991b1b", margin: "0 0 0.5rem 0", fontWeight: 700 }}>
            Application Not Approved
          </h2>
          <p style={{ color: "#7f1d1d", margin: "0 0 0.75rem 0", lineHeight: "1.6", fontSize: "0.95rem" }}>
            Your membership application could not be approved at this time.
          </p>
          {account?.rejectionReason && (
            <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "6px", border: "1px solid #fca5a5" }}>
              <div style={{ fontSize: "0.8rem", color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>
                Reason provided by Administrator:
              </div>
              <div style={{ marginTop: "0.3rem", color: "#334155", fontSize: "0.95rem" }}>
                "{account.rejectionReason}"
              </div>
            </div>
          )}
        </div>
      )}

      {/* ID Card Status & Download Section (Only for Approved Members) */}
      {isApproved && (
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.75rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            borderLeft: "6px solid #0e623a",
            marginBottom: "1.75rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                ID Card Status
              </div>
              <h2 style={{ fontSize: "1.3rem", color: "#0f172a", margin: "0.25rem 0 0 0", fontWeight: 800 }}>
                {hasIssuedCard ? "Card Available" : "Not Yet Issued"}
              </h2>
            </div>

            {hasIssuedCard && (
              <div className="no-print" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setShowCardModal(true)}
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#0e623a",
                    border: "1px solid #0e623a",
                    padding: "0.65rem 1.25rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.95rem",
                  }}
                >
                  VIEW ID CARD
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: "#0e623a",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.65rem 1.4rem",
                    borderRadius: "6px",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    boxShadow: "0 2px 4px rgba(14, 98, 58, 0.2)",
                  }}
                >
                  DOWNLOAD ID CARD
                </button>
              </div>
            )}
          </div>

          {hasIssuedCard ? (
            <div>
              <p style={{ color: "#166534", fontSize: "1rem", fontWeight: 600, margin: "0 0 1.25rem 0" }}>
                Your AMTMP Membership ID Card is ready.
              </p>

              {/* Printable ID Card Container (Isolated for print & PDF) */}
              <div
                id="printable-id-card-area"
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                {/* ID Card Front */}
                <div
                  className="id-card-front"
                  style={{
                    width: "420px",
                    maxWidth: "100%",
                    borderRadius: "10px",
                    backgroundColor: "#ffffff",
                    border: "2px solid #0e623a",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    color: "#1e293b",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#0e623a",
                      color: "#ffffff",
                      padding: "0.85rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      borderBottom: "3px solid #d4af37",
                    }}
                  >
                    <Logo size={40} />
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.5px", lineHeight: "1.2" }}>
                        ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "#fef08a", fontWeight: 700, letterSpacing: "0.8px", marginTop: "2px" }}>
                        OFFICIAL PRACTITIONER IDENTIFICATION CARD
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "1.2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div
                      style={{
                        width: "90px",
                        height: "112px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#f8fafc",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {memberDetails.passportPhotoRef || profile?.passportPhotoRef ? (
                        <img
                          src={memberDetails.passportPhotoRef || profile?.passportPhotoRef}
                          alt={memberDetails.fullName || profile?.fullName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", textAlign: "center" }}>Photo</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                        Name of Practitioner
                      </div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {memberDetails.fullName || profile?.fullName}
                      </div>

                      <div style={{ marginTop: "0.45rem" }}>
                        <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                          Registration Number
                        </div>
                        <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0e623a", letterSpacing: "0.5px" }}>
                          {memberDetails.registrationNumber || profile?.registrationNumber}
                        </div>
                      </div>

                      <div style={{ marginTop: "0.4rem", display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "0.62rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                            Status
                          </div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#166534" }}>ACTIVE</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.62rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                            Issued
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#334155", fontWeight: 600 }}>
                            {cardDetails.issuedAt ? new Date(cardDetails.issuedAt).toLocaleDateString() : "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {qrDataUrl && (
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <img
                          src={qrDataUrl}
                          alt="Verification QR"
                          style={{ width: "75px", height: "75px", display: "block" }}
                        />
                        <div style={{ fontSize: "0.55rem", color: "#64748b", fontWeight: 700, marginTop: "2px" }}>
                          SCAN TO VERIFY
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      padding: "0.4rem 1rem",
                      borderTop: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.68rem",
                      color: "#64748b",
                    }}
                  >
                    <span>Card Code: <strong>{cardDetails.verificationCode || "—"}</strong></span>
                    <span>AMTMP Official</span>
                  </div>
                </div>

                {/* ID Card Back */}
                <div
                  className="id-card-back"
                  style={{
                    width: "420px",
                    maxWidth: "100%",
                    borderRadius: "10px",
                    backgroundColor: "#ffffff",
                    border: "2px solid #0e623a",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    color: "#1e293b",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#0e623a",
                      color: "#ffffff",
                      padding: "0.65rem 1rem",
                      textAlign: "center",
                      borderBottom: "3px solid #d4af37",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      letterSpacing: "0.5px",
                    }}
                  >
                    ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS
                  </div>

                  <div style={{ padding: "1.2rem", fontSize: "0.75rem", color: "#334155", lineHeight: "1.5" }}>
                    <p style={{ margin: "0 0 0.6rem 0", fontWeight: 600 }}>
                      This official credential certifies that the bearer is a registered, approved practitioner in good standing with AMTMP.
                    </p>
                    <p style={{ margin: "0 0 0.6rem 0", color: "#64748b" }}>
                      Any alteration or unauthorized possession of this identification invalidates the credential.
                    </p>
                    <p style={{ margin: 0, color: "#64748b" }}>
                      <strong>If found, please return to any AMTMP secretariat office or visit amtmp.org.</strong>
                    </p>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      padding: "0.6rem 1rem",
                      borderTop: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.68rem",
                      color: "#475569",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>National Registrar</div>
                      <div style={{ color: "#94a3b8", fontSize: "0.62rem" }}>Authorized Signature</div>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, color: "#0e623a" }}>
                      AMTMP NATIONAL SECRETARIAT
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "#475569", fontSize: "1rem", margin: 0, lineHeight: "1.5" }}>
              Your membership card has not yet been issued by AMTMP.
            </p>
          )}
        </div>
      )}

      {/* Account Details & Self-Service Edit Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "1.75rem",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h3 style={{ fontSize: "1.15rem", color: "#0f172a", margin: 0, fontWeight: 700 }}>
            Practitioner Account Information
          </h3>
          <button
            onClick={() => setShowEditContactModal(true)}
            style={{
              backgroundColor: "#f1f5f9",
              color: "#0e623a",
              border: "1px solid #cbd5e1",
              padding: "0.4rem 0.9rem",
              borderRadius: "4px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Edit Contact Details
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
              Full Legal Name
            </div>
            <div style={{ fontSize: "1rem", color: "#1e293b", fontWeight: 700, marginTop: "0.25rem" }}>
              {account?.fullName || profile?.fullName || "—"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
              Official name (Admin-managed)
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
              Registered Email
            </div>
            <div style={{ fontSize: "1rem", color: "#1e293b", fontWeight: 600, marginTop: "0.25rem" }}>
              {account?.email || "—"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
              Phone Number
            </div>
            <div style={{ fontSize: "1rem", color: "#1e293b", fontWeight: 600, marginTop: "0.25rem" }}>
              {account?.phone || "—"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
              Application Standing
            </div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                marginTop: "0.25rem",
                color: isApproved ? "#166534" : isRejected ? "#991b1b" : "#d97706",
              }}
            >
              {isApproved ? "Approved Member" : isRejected ? "Not Approved" : "Under Review (Pending)"}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen View ID Card Modal */}
      {showCardModal && hasIssuedCard && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCardModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "10px",
              maxWidth: "920px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", color: "#0f172a", margin: 0, fontWeight: 800 }}>
                AMTMP Official ID Card Preview
              </h3>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              {/* Front Preview */}
              <div
                style={{
                  width: "420px",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #0e623a",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#0e623a",
                    color: "#ffffff",
                    padding: "0.85rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    borderBottom: "3px solid #d4af37",
                  }}
                >
                  <Logo size={40} />
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.5px" }}>
                      ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#fef08a", fontWeight: 700, letterSpacing: "0.8px" }}>
                      OFFICIAL PRACTITIONER IDENTIFICATION CARD
                    </div>
                  </div>
                </div>

                <div style={{ padding: "1.2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div
                    style={{
                      width: "90px",
                      height: "112px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {memberDetails.passportPhotoRef || profile?.passportPhotoRef ? (
                      <img
                        src={memberDetails.passportPhotoRef || profile?.passportPhotoRef}
                        alt={memberDetails.fullName || profile?.fullName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Photo</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Name of Practitioner
                    </div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {memberDetails.fullName || profile?.fullName}
                    </div>

                    <div style={{ marginTop: "0.45rem" }}>
                      <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                        Registration Number
                      </div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0e623a", letterSpacing: "0.5px" }}>
                        {memberDetails.registrationNumber || profile?.registrationNumber}
                      </div>
                    </div>

                    <div style={{ marginTop: "0.4rem", display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                          Status
                        </div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#166534" }}>ACTIVE</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                          Issued
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#334155", fontWeight: 600 }}>
                          {cardDetails.issuedAt ? new Date(cardDetails.issuedAt).toLocaleDateString() : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {qrDataUrl && (
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <img
                        src={qrDataUrl}
                        alt="Verification QR"
                        style={{ width: "75px", height: "75px", display: "block" }}
                      />
                      <div style={{ fontSize: "0.55rem", color: "#64748b", fontWeight: 700, marginTop: "2px" }}>
                        SCAN TO VERIFY
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "0.4rem 1rem",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.68rem",
                    color: "#64748b",
                  }}
                >
                  <span>Card Code: <strong>{cardDetails.verificationCode || "—"}</strong></span>
                  <span>AMTMP Official</span>
                </div>
              </div>

              {/* Back Preview */}
              <div
                style={{
                  width: "420px",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #0e623a",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#0e623a",
                    color: "#ffffff",
                    padding: "0.65rem 1rem",
                    textAlign: "center",
                    borderBottom: "3px solid #d4af37",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                  }}
                >
                  ASSOCIATION OF MEDICAL AND TRADITIONAL MEDICINE PRACTITIONERS
                </div>

                <div style={{ padding: "1.2rem", fontSize: "0.75rem", color: "#334155", lineHeight: "1.5" }}>
                  <p style={{ margin: "0 0 0.6rem 0", fontWeight: 600 }}>
                    This official credential certifies that the bearer is a registered, approved practitioner in good standing with AMTMP.
                  </p>
                  <p style={{ margin: "0 0 0.6rem 0", color: "#64748b" }}>
                    Any alteration or unauthorized possession of this identification invalidates the credential.
                  </p>
                  <p style={{ margin: 0, color: "#64748b" }}>
                    <strong>If found, please return to any AMTMP secretariat office or visit amtmp.org.</strong>
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "0.6rem 1rem",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.68rem",
                    color: "#475569",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>National Registrar</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.62rem" }}>Authorized Signature</div>
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 700, color: "#0e623a" }}>
                    AMTMP NATIONAL SECRETARIAT
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  backgroundColor: "#0e623a",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "6px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                DOWNLOAD ID CARD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditContactModal && (
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
            if (e.target === e.currentTarget) setShowEditContactModal(false);
          }}
        >
          <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "8px", maxWidth: "440px", width: "100%" }}>
            <h3 style={{ fontSize: "1.2rem", color: "#0f172a", marginTop: 0 }}>
              Update Contact Information
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              In accordance with AMTMP security policy, you may update your email and telephone number. Official legal name and registration numbers can only be changed by executive administrators.
            </p>

            <form onSubmit={handleUpdateContact}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowEditContactModal(false)}
                  style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{ backgroundColor: "#0e623a", color: "#ffffff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "4px", fontWeight: 700, cursor: editLoading ? "not-allowed" : "pointer" }}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};