import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProtectedRouteProps {
  requiredRole: "admin" | "member_account";
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const { userType, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying authorization..." />;
  }

  if (requiredRole === "admin") {
    if (userType !== "admin") {
      return <Navigate to="/admin/login" replace />;
    }
  }

  if (requiredRole === "member_account") {
    if (userType !== "member_account") {
      return <Navigate to="/member/login" replace />;
    }
  }

  return children;
};
