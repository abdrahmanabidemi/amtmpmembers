import React, { useState, useEffect } from "react";
import { useEscapeKey } from "../hooks/useEscapeKey";

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningNote?: string;
  confirmLabel?: string;
  confirmStyle?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  requireExplicitYes?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  warningNote,
  confirmLabel = "Confirm",
  confirmStyle = "primary",
  onConfirm,
  onCancel,
  requireExplicitYes = false,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<"no" | "yes">("yes");

  // Reset choice whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedChoice("yes");
    }
  }, [isOpen]);

  // Pressing Escape key closes the confirmation dialog without performing the action
  useEscapeKey(onCancel, isOpen);

  if (!isOpen) return null;

  const isConfirmed = !requireExplicitYes || selectedChoice === "yes";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "2rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          border: confirmStyle === "danger" ? "2px solid #ef4444" : "2px solid #0e623a",
        }}
      >
        <h3
          style={{
            fontSize: "1.25rem",
            color: confirmStyle === "danger" ? "#b91c1c" : "#0f172a",
            marginTop: 0,
            marginBottom: "0.75rem",
            fontWeight: 800,
          }}
        >
          {title}
        </h3>

        <p style={{ color: "#334155", fontSize: "0.95rem", lineHeight: "1.5", margin: "0 0 1rem 0" }}>
          {message}
        </p>

        {warningNote && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderLeft: "4px solid #dc2626",
              padding: "0.75rem 1rem",
              borderRadius: "4px",
              color: "#991b1b",
              fontSize: "0.88rem",
              fontWeight: 600,
              marginBottom: "1.25rem",
            }}
          >
            {warningNote}
          </div>
        )}

        {requireExplicitYes && (
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}>
              Please select an option to proceed:
            </label>
            <select
              value={selectedChoice}
              onChange={(e) => setSelectedChoice(e.target.value as "no" | "yes")}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "6px",
                border: "2px solid #cbd5e1",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#1e293b",
                backgroundColor: "#f8fafc",
              }}
            >
              <option value="no">No — Cancel action</option>
              <option value="yes">Yes — Proceed with action</option>
            </select>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              backgroundColor: "#f1f5f9",
              color: "#475569",
              border: "1px solid #cbd5e1",
              padding: "0.55rem 1.25rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isConfirmed}
            onClick={() => {
              if (isConfirmed) onConfirm();
            }}
            style={{
              backgroundColor: !isConfirmed
                ? "#94a3b8"
                : confirmStyle === "danger"
                ? "#dc2626"
                : "#0e623a",
              color: "#ffffff",
              border: "none",
              padding: "0.55rem 1.5rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: !isConfirmed ? "not-allowed" : "pointer",
              boxShadow: isConfirmed ? "0 2px 4px rgba(0,0,0,0.15)" : "none",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
