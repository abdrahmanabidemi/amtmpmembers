import React from "react";

export const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = "Loading AMTMP system...",
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid #e2e8f0",
          borderTop: "4px solid #0d5c3a",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ marginTop: "1rem", color: "#4a5568", fontSize: "0.95rem" }}>{message}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
