import React from "react";

interface ErrorAlertProps {
  message: string | null;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      style={{
        backgroundColor: "#fef2f2",
        borderLeft: "4px solid #dc2626",
        padding: "1rem",
        borderRadius: "4px",
        marginBottom: "1.25rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ color: "#991b1b", fontSize: "0.95rem", lineHeight: "1.4" }}>
        <strong>Notice:</strong> {message}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            color: "#991b1b",
            cursor: "pointer",
            fontWeight: "bold",
            padding: "0.25rem 0.5rem",
          }}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
};
