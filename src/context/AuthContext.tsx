import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  accountStatus: string;
}

export interface MemberAccountUser {
  id: number;
  email: string;
  phone?: string | null;
  membershipStatus: string;
}

export interface MemberProfile {
  id: number;
  fullName: string;
  registrationNumber?: string | null;
  memberStatus: string;
  approvalDate?: string | null;
}

interface AuthContextType {
  userType: "admin" | "member_account" | null;
  admin: AdminUser | null;
  memberAccount: MemberAccountUser | null;
  memberProfile: MemberProfile | null;
  loading: boolean;
  loginAdmin: (creds: { email: string; password: string }) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  loginMember: (creds: { email: string; password: string }) => Promise<void>;
  logoutMember: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userType, setUserType] = useState<"admin" | "member_account" | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [memberAccount, setMemberAccount] = useState<MemberAccountUser | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check active session on initial load
  const refreshAuth = async () => {
    setLoading(true);
    try {
      // First attempt admin profile check
      const adminRes = await api.getAdminMe().catch(() => null);
      if (adminRes && adminRes.success) {
        setUserType("admin");
        setAdmin(adminRes.admin);
        setMemberAccount(null);
        setMemberProfile(null);
        setLoading(false);
        return;
      }

      // Next attempt member profile check
      const memberRes = await api.getMemberMe().catch(() => null);
      if (memberRes && memberRes.success) {
        setUserType("member_account");
        setMemberAccount(memberRes.account);
        setMemberProfile(memberRes.member);
        setAdmin(null);
        setLoading(false);
        return;
      }

      // No active session
      setUserType(null);
      setAdmin(null);
      setMemberAccount(null);
      setMemberProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const loginAdmin = async (creds: { email: string; password: string }) => {
    const res = await api.adminLogin(creds);
    if (res.success) {
      setUserType("admin");
      setAdmin(res.admin);
      setMemberAccount(null);
      setMemberProfile(null);
    }
  };

  const logoutAdmin = async () => {
    try {
      await api.adminLogout();
    } finally {
      setUserType(null);
      setAdmin(null);
    }
  };

  const loginMember = async (creds: { email: string; password: string }) => {
    const res = await api.memberLogin(creds);
    if (res.success) {
      setUserType("member_account");
      setMemberAccount(res.memberAccount);
      setMemberProfile(res.member);
      setAdmin(null);
    }
  };

  const logoutMember = async () => {
    try {
      await api.memberLogout();
    } finally {
      setUserType(null);
      setMemberAccount(null);
      setMemberProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userType,
        admin,
        memberAccount,
        memberProfile,
        loading,
        loginAdmin,
        logoutAdmin,
        loginMember,
        logoutMember,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
