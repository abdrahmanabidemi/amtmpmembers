import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useEscapeKey } from "../hooks/useEscapeKey";

type AdminTab = "overview" | "applications" | "members" | "cards" | "dues" | "import_export";

export const AdminDashboard: React.FC = () => {
  const { admin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Applications tab state
  const [applications, setApplications] = useState<any[]>([]);
  const [appFilter, setAppFilter] = useState<"pending" | "rejected">("pending");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Members tab state
  const [members, setMembers] = useState<any[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("all");
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberForm, setEditMemberForm] = useState({ fullName: "", email: "", phone: "" });

  // ID Cards tab state
  const [cards, setCards] = useState<any[]>([]);
  const [cardFilter, setCardFilter] = useState("all");
  const [showIssueCardModal, setShowIssueCardModal] = useState(false);
  const [eligibleMembers, setEligibleMembers] = useState<any[]>([]);
  const [selectedEligibleMemberId, setSelectedEligibleMemberId] = useState<number>(0);

  // Dues tab state
  const [duesRecords, setDuesRecords] = useState<any[]>([]);
  const [duesSummary, setDuesSummary] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showRecordDuesModal, setShowRecordDuesModal] = useState(false);
  const [recordDuesForm, setRecordDuesForm] = useState<{
    memberId: number;
    month: number;
    year: number;
    amount: number | string;
    paymentStatus: "paid" | "unpaid" | "waived";
    paymentDate: string;
    notes: string;
  }>({
    memberId: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 1000,
    paymentStatus: "paid",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Import / Export state
  const [importReport, setImportReport] = useState<any | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Action Confirmation state (Requirement #16)
  const [confirmAction, setConfirmAction] = useState<{
    type: "issue_card" | "revoke_card" | "deactivate_member";
    title: string;
    message: string;
    warningNote?: string;
    confirmLabel: string;
    confirmStyle: "danger" | "primary";
    payload: any;
  } | null>(null);

  // Escape key handler for open dialogs (Requirement #17)
  useEscapeKey(
    () => {
      if (confirmAction) {
        setConfirmAction(null);
      } else if (showIssueCardModal) {
        setShowIssueCardModal(false);
      } else if (showRecordDuesModal) {
        setShowRecordDuesModal(false);
      } else if (showNewMemberModal) {
        setShowNewMemberModal(false);
      } else if (editingMember) {
        setEditingMember(null);
      } else if (showRejectModal) {
        setShowRejectModal(false);
        setSelectedApp(null);
        setRejectionReason("");
      }
    },
    Boolean(
      confirmAction ||
      showIssueCardModal ||
      showRecordDuesModal ||
      showNewMemberModal ||
      editingMember ||
      showRejectModal
    )
  );

  const loadSummary = async () => {
    try {
      const res = await api.getDashboardSummary();
      if (res.success) setStats(res.stats);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard overview metrics.");
    }
  };

  const loadApplications = async (status = appFilter) => {
    try {
      const res = await api.getApplications(status);
      if (res.success) setApplications(res.applications);
    } catch (err: any) {
      setError(err.message || "Failed to load applications.");
    }
  };

  const loadMembers = async (page = memberPage, q = memberQuery, status = memberStatusFilter) => {
    try {
      const res = await api.getMembers({
        page,
        q: q.trim() || undefined,
        status: status === "all" ? undefined : status,
      });
      if (res.success) {
        setMembers(res.members || []);
        if (res.pagination) {
          setMemberTotalPages(res.pagination.totalPages || 1);
          setMemberPage(res.pagination.page || 1);
        } else {
          setMemberTotalPages(1);
          setMemberPage(1);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load members registry.");
      setMembers([]);
      setMemberTotalPages(1);
      setMemberPage(1);
    }
  };

  const loadCards = async (status = cardFilter) => {
    try {
      const res = await api.getIdCards({ status: status === "all" ? undefined : status });
      if (res.success) setCards(res.cards || []);
    } catch (err: any) {
      setError(err.message || "Failed to load ID cards.");
      setCards([]);
    }
  };

  const loadEligibleMembers = async () => {
    try {
      const res = await api.getEligibleCardMembers();
      if (res.success) {
        setEligibleMembers(res.members || []);
      }
    } catch (err: any) {
      // Fallback to active members
      const activeOnly = (members || []).filter((m: any) => m.memberStatus === "active");
      setEligibleMembers(activeOnly);
    }
  };

  const loadDues = async (year = selectedYear) => {
    try {
      const [duesRes, sumRes] = await Promise.all([
        api.getDues({ year }).catch(() => ({ success: true, dues: [] })),
        api.getDuesSummary(year).catch(() => ({ success: true, summary: null })),
      ]);
      if (duesRes && duesRes.success) {
        setDuesRecords(duesRes.dues || []);
      }
      if (sumRes && sumRes.success && sumRes.summary) {
        setDuesSummary(sumRes.summary);
      } else {
        setDuesSummary({
          paidCount: 0,
          unpaidCount: 0,
          waivedCount: 0,
          totalPaidAmount: 0,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dues records.");
      setDuesRecords([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadSummary().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
    if (activeTab === "applications") loadApplications();
    if (activeTab === "members") loadMembers();
    if (activeTab === "cards") loadCards();
    if (activeTab === "dues") loadDues();
  }, [activeTab]);

  // Handlers for Applications
  const handleApproveApp = async (appId: number) => {
    try {
      const res = await api.approveApplication(appId);
      if (res.success) {
        setSuccessMessage(`Application approved successfully. Registration Number assigned: ${res.member.registrationNumber}`);
        loadApplications();
        loadSummary();
      }
    } catch (err: any) {
      setError(err.message || "Failed to approve application.");
    }
  };

  const handleRejectApp = async () => {
    if (!selectedApp) return;
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejecting the application.");
      return;
    }
    try {
      const res = await api.rejectApplication(selectedApp.id, rejectionReason.trim());
      if (res.success) {
        setSuccessMessage("Application rejected with reason recorded.");
        setShowRejectModal(false);
        setSelectedApp(null);
        setRejectionReason("");
        loadApplications();
        loadSummary();
      }
    } catch (err: any) {
      setError(err.message || "Failed to reject application.");
    }
  };

  // Handlers for Members
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createMemberManually(newMemberForm);
      if (res.success) {
        setSuccessMessage(`Member created successfully with Registration Number: ${res.member.registrationNumber}`);
        setShowNewMemberModal(false);
        setNewMemberForm({ fullName: "", email: "", phone: "", password: "" });
        loadMembers(1);
        loadSummary();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create member.");
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const res = await api.updateMember(editingMember.id, editMemberForm);
      if (res.success) {
        setSuccessMessage(`Member profile updated successfully for ${res.member.fullName}.`);
        setEditingMember(null);
        loadMembers();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update member.");
    }
  };

  const promptDeactivateMember = (member: any) => {
    setConfirmAction({
      type: "deactivate_member",
      title: "Confirm Member Deactivation",
      message: `Are you sure you want to deactivate member ${member.fullName} (${member.registrationNumber})?`,
      warningNote: "The member will no longer appear as an active member.",
      confirmLabel: "Deactivate Member",
      confirmStyle: "danger",
      payload: member.id,
    });
  };

  const handleDeactivateMember = async (memberId: number) => {
    try {
      const res = await api.deactivateMember(memberId);
      if (res.success) {
        setSuccessMessage(res.message);
        loadMembers();
        loadSummary();
      }
    } catch (err: any) {
      setError(err.message || "Failed to deactivate member.");
    }
  };

  const handlePhotoUpload = async (memberId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadMemberPhoto(memberId, file);
      if (res.success) {
        setSuccessMessage("Passport photograph uploaded successfully.");
        loadMembers();
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload photograph.");
    }
  };

  // Handlers for ID Cards
  const handleOpenIssueCardModal = async () => {
    await loadEligibleMembers();
    setSelectedEligibleMemberId(0);
    setShowIssueCardModal(true);
  };

  const promptIssueCard = (member: any) => {
    setConfirmAction({
      type: "issue_card",
      title: "Confirm ID Card Issuance",
      message: `Are you sure you want to issue this ID card for ${member.fullName} (${member.registrationNumber})?`,
      confirmLabel: "Issue ID Card",
      confirmStyle: "primary",
      payload: member.id,
    });
  };

  const handleIssueCard = async (memberId: number) => {
    try {
      const res = await api.issueIdCard(memberId);
      if (res.success) {
        setSuccessMessage(`Card issued successfully. Code: ${res.card.verificationCode}`);
        loadCards();
      }
    } catch (err: any) {
      setError(err.message || "Failed to issue card.");
    }
  };

  const promptRevokeCard = (card: any) => {
    setConfirmAction({
      type: "revoke_card",
      title: "Confirm ID Card Revocation",
      message: `Are you sure you want to revoke ID card ${card.verificationCode} for ${card.memberName}?`,
      warningNote: "This will immediately invalidate QR code and code search verification for this practitioner.",
      confirmLabel: "Revoke ID Card",
      confirmStyle: "danger",
      payload: card.id,
    });
  };

  const handleRevokeCard = async (cardId: number) => {
    try {
      const res = await api.revokeIdCard(cardId);
      if (res.success) {
        setSuccessMessage("ID card revoked successfully.");
        loadCards();
      }
    } catch (err: any) {
      setError(err.message || "Failed to revoke card.");
    }
  };

  // Execute Confirmed Actions (Requirement #16)
  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, payload } = confirmAction;
    setConfirmAction(null);

    if (type === "issue_card") {
      await handleIssueCard(payload);
    } else if (type === "revoke_card") {
      await handleRevokeCard(payload);
    } else if (type === "deactivate_member") {
      await handleDeactivateMember(payload);
    }
  };

  // Handlers for Dues
  const handleRecordDues = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordDuesForm.memberId || recordDuesForm.memberId === 0) {
      setError("Please select a valid member to record dues for.");
      return;
    }
    try {
      const parsedAmount = typeof recordDuesForm.amount === "string" 
        ? (recordDuesForm.amount.trim() === "" ? 0 : Number(recordDuesForm.amount))
        : Number(recordDuesForm.amount);

      const res = await api.recordDues({
        ...recordDuesForm,
        amount: isNaN(parsedAmount) ? 0 : parsedAmount,
      });
      if (res.success) {
        setSuccessMessage(res.message);
        setShowRecordDuesModal(false);
        loadDues(selectedYear);
      }
    } catch (err: any) {
      setError(err.message || "Failed to record dues payment.");
    }
  };

  // CSV Member Import
  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setError(null);
    setImportReport(null);

    try {
      const res = await api.importMembersCsv(file);
      if (res.success) {
        setImportReport(res);
        setSuccessMessage(`CSV Import complete: ${res.importedCount} members imported, ${res.skippedCount} skipped.`);
        loadMembers(1);
        loadSummary();
      }
    } catch (err: any) {
      setError(err.message || "Failed to import CSV file. Please verify column headers.");
    } finally {
      setImportLoading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading administration portal..." />;
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto 3rem auto" }}>
      {/* Top Banner — Simplified without system jargon (Requirement #14 & #15) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "1.5rem 2rem",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          borderLeft: "6px solid #0e623a",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.6rem", color: "#0f172a", margin: "0 0 0.25rem 0", fontWeight: 800 }}>
            Welcome, {admin?.name || "Administrator"}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
            Signed in as: <strong>{admin?.email}</strong>
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Administration Portal</span>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0e623a" }}>● Active Session</div>
        </div>
      </div>

      {/* Tabs Navigation — Simple functional labels (Requirement #15) */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "2px solid #e2e8f0",
          marginBottom: "1.5rem",
          overflowX: "auto",
          paddingBottom: "0.25rem",
        }}
      >
        {[
          { id: "overview", label: "Overview" },
          { id: "applications", label: `Applications (${stats?.pendingApplicationsCount ?? 0})` },
          { id: "members", label: `Active Members (${stats?.registeredMembersCount ?? 0})` },
          { id: "cards", label: "ID Cards" },
          { id: "dues", label: "Monthly Dues" },
          { id: "import_export", label: "Data Export / Import" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            style={{
              backgroundColor: activeTab === tab.id ? "#0e623a" : "transparent",
              color: activeTab === tab.id ? "#ffffff" : "#475569",
              border: "none",
              padding: "0.65rem 1.25rem",
              borderRadius: "6px 6px 0 0",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

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

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                Approved Members
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0e623a", marginTop: "0.4rem" }}>
                {stats?.registeredMembersCount ?? 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                Holding official AMTMP IDs
              </div>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                Pending Applications
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#b45309", marginTop: "0.4rem" }}>
                {stats?.pendingApplicationsCount ?? 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                Awaiting administrator review
              </div>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                Registered Accounts
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#1e293b", marginTop: "0.4rem" }}>
                {stats?.memberAccountsCount ?? 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                Total practitioner logins
              </div>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                Administrators
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#475569", marginTop: "0.4rem" }}>
                {stats?.administratorsCount ?? 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                Active administrative accounts
              </div>
            </div>
          </div>

          {/* Operating Guide */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1.2rem", color: "#0f172a", marginTop: 0, fontWeight: 700 }}>
              Operating Instructions
            </h2>
            <ul style={{ color: "#334155", lineHeight: "1.7", fontSize: "0.95rem", paddingLeft: "1.25rem", margin: 0 }}>
              <li><strong>Applications:</strong> Review submitted registrations. Approving an applicant automatically generates their permanent sequential AMTMP Registration Number.</li>
              <li><strong>Active Members:</strong> Search and filter registered practitioners. You can upload/update passport photographs, edit contact details, or deactivate members.</li>
              <li><strong>ID Cards:</strong> Issue official member identification cards with cryptographic QR verification, or instantly revoke compromised cards.</li>
              <li><strong>Monthly Dues:</strong> Record monthly dues payments, view annual totals, and track compliant practitioners.</li>
              <li><strong>Data Export / Import:</strong> Download Excel-compatible CSV reports or batch import practitioners from CSV files.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 2. APPLICATIONS TAB */}
      {activeTab === "applications" && (
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", margin: 0, fontWeight: 700 }}>
              Membership Applications Management
            </h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => { setAppFilter("pending"); loadApplications("pending"); }}
                style={{
                  backgroundColor: appFilter === "pending" ? "#b45309" : "#f1f5f9",
                  color: appFilter === "pending" ? "#ffffff" : "#475569",
                  border: "none",
                  padding: "0.45rem 0.9rem",
                  borderRadius: "4px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Pending
              </button>
              <button
                onClick={() => { setAppFilter("rejected"); loadApplications("rejected"); }}
                style={{
                  backgroundColor: appFilter === "rejected" ? "#dc2626" : "#f1f5f9",
                  color: appFilter === "rejected" ? "#ffffff" : "#475569",
                  border: "none",
                  padding: "0.45rem 0.9rem",
                  borderRadius: "4px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Rejected
              </button>
            </div>
          </div>

          {applications.length === 0 ? (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#64748b" }}>
              No {appFilter} applications found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Applicant Name</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Email</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Phone</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Submitted On</th>
                    {appFilter === "rejected" && <th style={{ padding: "0.75rem 1rem" }}>Rejection Reason</th>}
                    {appFilter === "pending" && <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#0f172a" }}>{app.fullName}</td>
                      <td style={{ padding: "0.85rem 1rem", color: "#475569" }}>{app.email}</td>
                      <td style={{ padding: "0.85rem 1rem", color: "#475569" }}>{app.phone}</td>
                      <td style={{ padding: "0.85rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      {appFilter === "rejected" && (
                        <td style={{ padding: "0.85rem 1rem", color: "#dc2626", fontSize: "0.85rem" }}>
                          {app.rejectionReason || "—"}
                        </td>
                      )}
                      {appFilter === "pending" && (
                        <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                          <button
                            onClick={() => handleApproveApp(app.id)}
                            style={{
                              backgroundColor: "#0e623a",
                              color: "#ffffff",
                              border: "none",
                              padding: "0.4rem 0.85rem",
                              borderRadius: "4px",
                              fontWeight: 700,
                              cursor: "pointer",
                              marginRight: "0.5rem",
                              fontSize: "0.85rem",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { setSelectedApp(app); setShowRejectModal(true); }}
                            style={{
                              backgroundColor: "#dc2626",
                              color: "#ffffff",
                              border: "none",
                              padding: "0.4rem 0.85rem",
                              borderRadius: "4px",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontSize: "0.85rem",
                            }}
                          >
                            Reject
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reject Reason Modal */}
          {showRejectModal && selectedApp && (
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
                if (e.target === e.currentTarget) {
                  setShowRejectModal(false);
                  setSelectedApp(null);
                  setRejectionReason("");
                }
              }}
            >
              <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "8px", maxWidth: "500px", width: "100%" }}>
                <h3 style={{ fontSize: "1.2rem", color: "#0f172a", marginTop: 0 }}>
                  Reject Application: {selectedApp.fullName}
                </h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  Please state the reason for rejecting this application. The applicant will see this reason when logging into their portal.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Practitioner credential could not be verified; please submit valid qualifications."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                    fontSize: "0.95rem",
                    marginBottom: "1rem",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    onClick={() => { setShowRejectModal(false); setSelectedApp(null); setRejectionReason(""); }}
                    style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectApp}
                    style={{ backgroundColor: "#dc2626", color: "#ffffff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "4px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. ACTIVE MEMBERS TAB — Safe pagination & search (Requirement #1) */}
      {activeTab === "members" && (
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", margin: 0, fontWeight: 700 }}>
              Practitioner Registry
            </h2>
            <button
              onClick={() => setShowNewMemberModal(true)}
              style={{
                backgroundColor: "#0e623a",
                color: "#ffffff",
                border: "none",
                padding: "0.55rem 1.2rem",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              + Add Member Manually
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search by name, reg #, email, or phone..."
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") loadMembers(1, memberQuery, memberStatusFilter); }}
              style={{ flex: 1, minWidth: "240px", padding: "0.5rem 0.85rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
            <select
              value={memberStatusFilter}
              onChange={(e) => { setMemberStatusFilter(e.target.value); loadMembers(1, memberQuery, e.target.value); }}
              style={{ padding: "0.5rem 0.85rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <button
              onClick={() => loadMembers(1, memberQuery, memberStatusFilter)}
              style={{ backgroundColor: "#0e623a", color: "#ffffff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
            >
              Search
            </button>
          </div>

          {members.length === 0 ? (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#64748b" }}>
              No members found matching your search.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Practitioner</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Reg. Number</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Contact Details</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Photo</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#0f172a" }}>
                        {m.fullName}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#0e623a", fontWeight: 800 }}>
                        {m.registrationNumber}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#475569", fontSize: "0.85rem" }}>
                        <div>{m.email}</div>
                        <div>{m.phone}</div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            backgroundColor: m.memberStatus === "active" ? "#dcfce7" : "#fee2e2",
                            color: m.memberStatus === "active" ? "#166534" : "#991b1b",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {m.memberStatus}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {m.passportPhotoRef ? (
                            <img
                              src={m.passportPhotoRef}
                              alt={m.fullName}
                              style={{ width: "32px", height: "38px", objectFit: "cover", borderRadius: "3px", border: "1px solid #cbd5e1" }}
                            />
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>None</span>
                          )}
                          <label
                            title="Upload / Change Photo (<= 2MB JPG/PNG)"
                            style={{ cursor: "pointer", color: "#0e623a", fontSize: "0.85rem", fontWeight: 600 }}
                          >
                            📷
                            <input
                              type="file"
                              accept="image/jpeg,image/png"
                              style={{ display: "none" }}
                              onChange={(e) => handlePhotoUpload(m.id, e)}
                            />
                          </label>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem", flexWrap: "wrap" }}>
                          <button
                            onClick={() => promptIssueCard(m)}
                            style={{
                              backgroundColor: "#f0fdf4",
                              color: "#166534",
                              border: "1px solid #bbf7d0",
                              padding: "0.3rem 0.65rem",
                              borderRadius: "4px",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Issue Card
                          </button>
                          <button
                            onClick={() => {
                              setEditingMember(m);
                              setEditMemberForm({ fullName: m.fullName, email: m.email, phone: m.phone });
                            }}
                            style={{
                              backgroundColor: "#f1f5f9",
                              color: "#334155",
                              border: "1px solid #cbd5e1",
                              padding: "0.3rem 0.65rem",
                              borderRadius: "4px",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          {m.memberStatus === "active" && (
                            <button
                              onClick={() => promptDeactivateMember(m)}
                              style={{
                                backgroundColor: "#fee2e2",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                                padding: "0.3rem 0.65rem",
                                borderRadius: "4px",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                              }}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Safe Pagination Controls (Requirement #1) */}
          {(memberTotalPages ?? 1) > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
              <button
                disabled={memberPage <= 1}
                onClick={() => { const p = memberPage - 1; setMemberPage(p); loadMembers(p); }}
                style={{ padding: "0.35rem 0.75rem", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: memberPage <= 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
                Page {memberPage} of {memberTotalPages}
              </span>
              <button
                disabled={memberPage >= memberTotalPages}
                onClick={() => { const p = memberPage + 1; setMemberPage(p); loadMembers(p); }}
                style={{ padding: "0.35rem 0.75rem", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: memberPage >= memberTotalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          )}

          {/* New Member Modal */}
          {showNewMemberModal && (
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
                if (e.target === e.currentTarget) setShowNewMemberModal(false);
              }}
            >
              <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "8px", maxWidth: "480px", width: "100%" }}>
                <h3 style={{ fontSize: "1.2rem", color: "#0f172a", marginTop: 0 }}>
                  Add Member Directly
                </h3>
                <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  A new approved member account will be created immediately with the next sequential AMTMP registration number assigned.
                </p>
                <form onSubmit={handleCreateMember}>
                  <div style={{ marginBottom: "0.85rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.fullName}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ marginBottom: "0.85rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={newMemberForm.email}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ marginBottom: "0.85rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.phone}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                      Account Password (Optional - defaults to MemberPassword2026!)
                    </label>
                    <input
                      type="password"
                      value={newMemberForm.password}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setShowNewMemberModal(false)}
                      style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ backgroundColor: "#0e623a", color: "#ffffff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "4px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Create & Assign Number
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Member Modal */}
          {editingMember && (
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
                if (e.target === e.currentTarget) setEditingMember(null);
              }}
            >
              <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "8px", maxWidth: "480px", width: "100%" }}>
                <h3 style={{ fontSize: "1.2rem", color: "#0f172a", marginTop: 0 }}>
                  Edit Member: {editingMember.registrationNumber}
                </h3>
                <form onSubmit={handleUpdateMember}>
                  <div style={{ marginBottom: "0.85rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editMemberForm.fullName}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, fullName: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ marginBottom: "0.85rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={editMemberForm.email}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={editMemberForm.phone}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setEditingMember(null)}
                      style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ backgroundColor: "#0e623a", color: "#ffffff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "4px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ID CARDS TAB — With "+ Issue ID Card" modal & member names (Requirement #3 & #16) */}
      {activeTab === "cards" && (
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", margin: 0, fontWeight: 700 }}>
              Official ID Cards & QR Verification
            </h2>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <select
                value={cardFilter}
                onChange={(e) => { setCardFilter(e.target.value); loadCards(e.target.value); }}
                style={{ padding: "0.45rem 0.85rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              >
                <option value="all">All Cards</option>
                <option value="active">Active Only</option>
                <option value="revoked">Revoked Only</option>
              </select>
              <button
                onClick={handleOpenIssueCardModal}
                style={{
                  backgroundColor: "#0e623a",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.5rem 1.1rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                + Issue ID Card
              </button>
            </div>
          </div>

          {cards.length === 0 ? (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#64748b" }}>
              No ID cards found. Click "+ Issue ID Card" above to issue a card for an approved member.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Card Code</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Member Name</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Reg. Number</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Issued At</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 700, fontFamily: "monospace" }}>
                        {card.verificationCode}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#0f172a" }}>
                        {card.memberName}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#0e623a", fontWeight: 800 }}>
                        {card.registrationNumber}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            backgroundColor: card.status === "active" ? "#dcfce7" : "#fee2e2",
                            color: card.status === "active" ? "#166534" : "#991b1b",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {card.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                        {new Date(card.issuedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        {card.status === "active" ? (
                          <button
                            onClick={() => promptRevokeCard(card)}
                            style={{
                              backgroundColor: "#dc2626",
                              color: "#ffffff",
                              border: "none",
                              padding: "0.35rem 0.75rem",
                              borderRadius: "4px",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Revoke Card
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Revoked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Issue ID Card Modal — Member Names Displayed (Requirement #3) */}
          {showIssueCardModal && (
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
                if (e.target === e.currentTarget) setShowIssueCardModal(false);
              }}
            >
              <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "8px", maxWidth: "500px", width: "100%" }}>
                <h3 style={{ fontSize: "1.25rem", color: "#0f172a", marginTop: 0 }}>
                  Issue Official ID Card
                </h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: "1.5" }}>
                  Select an approved active practitioner. A unique QR token and verification code will be generated.
                </p>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}>
                    Select Member
                  </label>
                  <select
                    value={selectedEligibleMemberId}
                    onChange={(e) => setSelectedEligibleMemberId(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.95rem",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <option value={0}>-- Select Approved Member --</option>
                    {eligibleMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} — {m.registrationNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowIssueCardModal(false)}
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                      padding: "0.55rem 1.25rem",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={selectedEligibleMemberId === 0}
                    onClick={() => {
                      const selected = eligibleMembers.find((m) => m.id === selectedEligibleMemberId);
                      if (selected) {
                        setShowIssueCardModal(false);
                        promptIssueCard(selected);
                      }
                    }}
                    style={{
                      backgroundColor: selectedEligibleMemberId === 0 ? "#94a3b8" : "#0e623a",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.55rem 1.5rem",
                      borderRadius: "6px",
                      fontWeight: 700,
                      cursor: selectedEligibleMemberId === 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    Continue to Issue
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MONTHLY DUES TAB — Safe rendering & clear empty state (Requirement #2) */}
      {activeTab === "dues" && (
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#0f172a", margin: 0, fontWeight: 700 }}>
              Monthly Membership Dues
            </h2>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(Number(e.target.value)); loadDues(Number(e.target.value)); }}
                style={{ padding: "0.45rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={() => { setShowRecordDuesModal(true); loadMembers(1, "", "active"); }}
                style={{
                  backgroundColor: "#0e623a",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.5rem 1.1rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                + Record Payment
              </button>
            </div>
          </div>

          {/* Dues Summary Widget — Safe fallback properties */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ backgroundColor: "#f0fdf4", padding: "1rem", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Paid Dues</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#166534", marginTop: "0.25rem" }}>
                {duesSummary?.paidCount ?? duesSummary?.paidRecords ?? 0}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#15803d" }}>
                Total: ₦{(duesSummary?.totalPaidAmount ?? duesSummary?.totalCollected ?? 0).toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: "#fef2f2", padding: "1rem", borderRadius: "6px", border: "1px solid #fecaca" }}>
              <div style={{ fontSize: "0.8rem", color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>Unpaid Dues</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#991b1b", marginTop: "0.25rem" }}>
                {duesSummary?.unpaidCount ?? duesSummary?.unpaidRecords ?? 0}
              </div>
            </div>
            <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Waived Dues</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#475569", marginTop: "0.25rem" }}>
                {duesSummary?.waivedCount ?? duesSummary?.waivedRecords ?? 0}
              </div>
            </div>
          </div>

          {duesRecords.length === 0 ? (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#64748b", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                No payment records yet.
              </div>
              <div style={{ marginBottom: "1.25rem", fontSize: "0.95rem" }}>
                There are no recorded dues payments for {selectedYear}.
              </div>
              <button
                onClick={() => { setShowRecordDuesModal(true); loadMembers(1, "", "active"); }}
                style={{
                  backgroundColor: "#0e623a",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.6rem 1.4rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                Record Payment
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Member</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Period</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Amount</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Payment Date</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {duesRecords.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{d.memberName || d.fullName}</div>
                        <div style={{ fontSize: "0.8rem", color: "#0e623a", fontWeight: 800 }}>{d.registrationNumber}</div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#334155", fontWeight: 600 }}>
                        {months[d.month - 1]} {d.year}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>
                        ₦{(d.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            backgroundColor: d.paymentStatus === "paid" ? "#dcfce7" : d.paymentStatus === "unpaid" ? "#fee2e2" : "#f1f5f9",
                            color: d.paymentStatus === "paid" ? "#166534" : d.paymentStatus === "unpaid" ? "#991b1b" : "#475569",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {d.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                        {d.paymentDate ? new Date(d.paymentDate).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                        {d.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Record Dues Modal */}
          {showRecordDuesModal && (
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
                if (e.target === e.currentTarget) setShowRecordDuesModal(false);
              }}
            >
              <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "8px", maxWidth: "480px", width: "100%" }}>
                <h3 style={{ fontSize: "1.2rem", color: "#0f172a", marginTop: 0 }}>
                  Record Practitioner Dues Payment
                </h3>
                <form onSubmit={handleRecordDues}>
                  <div style={{ marginBottom: "0.85rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                      Select Member
                    </label>
                    <select
                      required
                      value={recordDuesForm.memberId}
                      onChange={(e) => setRecordDuesForm({ ...recordDuesForm, memberId: Number(e.target.value) })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                    >
                      <option value={0}>-- Select Member --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} — {m.registrationNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.85rem" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                        Month
                      </label>
                      <select
                        value={recordDuesForm.month}
                        onChange={(e) => setRecordDuesForm({ ...recordDuesForm, month: Number(e.target.value) })}
                        style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                      >
                        {months.map((name, idx) => (
                          <option key={idx + 1} value={idx + 1}>{name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                        Year
                      </label>
                      <input
                        type="number"
                        value={recordDuesForm.year}
                        onChange={(e) => setRecordDuesForm({ ...recordDuesForm, year: Number(e.target.value) })}
                        style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.85rem" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                        Amount (₦)
                      </label>
                      <input
                        type="number"
                        value={recordDuesForm.amount}
                        onChange={(e) => setRecordDuesForm({ ...recordDuesForm, amount: e.target.value })}
                        style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                        Payment Status
                      </label>
                      <select
                        value={recordDuesForm.paymentStatus}
                        onChange={(e) => setRecordDuesForm({ ...recordDuesForm, paymentStatus: e.target.value as any })}
                        style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                      >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="waived">Waived</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                      Notes / Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bank transfer, receipt #1042"
                      value={recordDuesForm.notes}
                      onChange={(e) => setRecordDuesForm({ ...recordDuesForm, notes: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setShowRecordDuesModal(false)}
                      style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ backgroundColor: "#0e623a", color: "#ffffff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "4px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Save Dues Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. DATA EXPORT / IMPORT TAB */}
      {activeTab === "import_export" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Export Section */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1.2rem", color: "#0f172a", marginTop: 0, fontWeight: 700 }}>
              Export System Data (Excel-Compatible CSV)
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: "1.5" }}>
              Export association records in RFC 4180 CSV format with UTF-8 BOM encoding so Microsoft Excel opens special characters seamlessly.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.25rem" }}>
              <a
                href={api.getExportUrl("members")}
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: "#0e623a",
                  color: "#ffffff",
                  textDecoration: "none",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textAlign: "center",
                }}
              >
                Download Members Registry CSV
              </a>

              <a
                href={api.getExportUrl("applications")}
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  textDecoration: "none",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textAlign: "center",
                }}
              >
                Download Pending Applications CSV
              </a>

              <a
                href={api.getExportUrl("dues")}
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: "#334155",
                  color: "#ffffff",
                  textDecoration: "none",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textAlign: "center",
                }}
              >
                Download Monthly Dues CSV
              </a>
            </div>
          </div>

          {/* Import Section */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1.2rem", color: "#0f172a", marginTop: 0, fontWeight: 700 }}>
              Bulk Import Members from CSV
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: "1.5" }}>
              Upload an Excel CSV file containing <code>Full Name</code>, <code>Email</code>, and <code>Phone</code> headers. Duplicate email or phone records are skipped safely.
            </p>

            <div style={{ marginTop: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  border: "2px dashed #cbd5e1",
                  textAlign: "center",
                  cursor: importLoading ? "not-allowed" : "pointer",
                  backgroundColor: "#f8fafc",
                }}
              >
                <span style={{ fontWeight: 700, color: "#0e623a", fontSize: "1rem" }}>
                  {importLoading ? "Processing CSV..." : "Click to Select CSV File to Import"}
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  disabled={importLoading}
                  onChange={handleImportCsv}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {importReport && (
              <div style={{ marginTop: "1.25rem", backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>Import Summary Report:</div>
                <div style={{ fontSize: "0.9rem", color: "#334155" }}>Processed: <strong>{importReport.totalProcessed}</strong></div>
                <div style={{ fontSize: "0.9rem", color: "#166534" }}>Imported: <strong>{importReport.importedCount}</strong></div>
                <div style={{ fontSize: "0.9rem", color: "#b45309" }}>Skipped: <strong>{importReport.skippedCount}</strong></div>
                {importReport.errors && importReport.errors.length > 0 && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#dc2626" }}>
                    {importReport.errors.slice(0, 5).map((e: any, idx: number) => (
                      <div key={idx}>Row {e.row}: {e.reason}</div>
                    ))}
                    {importReport.errors.length > 5 && <div>...and {importReport.errors.length - 5} more issues</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Destructive / Important Actions (Requirement #16) */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={Boolean(confirmAction)}
          title={confirmAction.title}
          message={confirmAction.message}
          warningNote={confirmAction.warningNote}
          confirmLabel={confirmAction.confirmLabel}
          confirmStyle={confirmAction.confirmStyle}
          requireExplicitYes={true}
          onConfirm={executeConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};