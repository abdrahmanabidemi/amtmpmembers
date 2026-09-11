/**
 * AMTMP API Client
 * Centralized service for secure HTTP calls to the backend API.
 */

const API_BASE = "/api";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config: RequestInit = {
    ...options,
    credentials: "include", // Essential for session cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({
    success: false,
    error: "Unable to parse server response. Please try again.",
  }));

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}.`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Health
  getHealth: () => request<any>("/health"),

  // Public Member Search
  searchMembers: (query: string) =>
    request<{
      success: boolean;
      query: string;
      count: number;
      members: Array<{
        fullName: string;
        registrationNumber: string;
        memberStatus: string;
      }>;
    }>(`/members/search?q=${encodeURIComponent(query)}`),

  // Member Registration & Authentication
  registerMember: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) =>
    request<{
      success: boolean;
      message: string;
      account: {
        id: number;
        fullName: string;
        email: string;
        phone: string;
        membershipStatus: string;
      };
    }>("/member/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  memberLogin: (credentials: { email: string; password: string }) =>
    request<{
      success: boolean;
      memberAccount: {
        id: number;
        fullName: string;
        email: string;
        phone: string;
        membershipStatus: string;
        rejectionReason?: string | null;
      };
      member: {
        id: number;
        fullName: string;
        registrationNumber: string;
        memberStatus: string;
        approvalDate?: string | null;
      } | null;
      message: string;
    }>("/member/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  memberLogout: () =>
    request<{ success: boolean; message: string }>("/member/auth/logout", {
      method: "POST",
    }),

  getMemberMe: () =>
    request<{
      success: boolean;
      account: {
        id: number;
        fullName: string;
        email: string;
        phone: string;
        membershipStatus: string;
        rejectionReason?: string | null;
        userType: string;
      };
      member: {
        id: number;
        fullName: string;
        registrationNumber: string;
        memberStatus: string;
        approvalDate?: string | null;
        passportPhotoRef?: string | null;
      } | null;
    }>("/member/auth/me"),

  updateMemberProfile: (data: { email?: string; phone?: string }) =>
    request<{
      success: boolean;
      message: string;
      account: {
        id: number;
        fullName: string;
        email: string;
        phone: string;
        membershipStatus: string;
      };
    }>("/member/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  uploadMemberSelfPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await fetch(`${API_BASE}/member/auth/photo`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json().catch(() => ({
      success: false,
      error: "Unable to parse server response.",
    }));

    if (!response.ok) {
      throw new Error(data?.error || `Upload failed with status ${response.status}`);
    }

    return data as { success: boolean; message: string; passportPhotoRef: string };
  },

  // Admin Authentication
  adminLogin: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; admin: any; message: string }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  adminLogout: () =>
    request<{ success: boolean; message: string }>("/admin/auth/logout", {
      method: "POST",
    }),

  getAdminMe: () =>
    request<{ success: boolean; admin: any }>("/admin/auth/me"),

  getAdminDashboardSummary: () =>
    request<{ success: boolean; stats: any }>("/admin/auth/dashboard-summary"),
  getDashboardSummary: () =>
    request<{ success: boolean; stats: any }>("/admin/auth/dashboard-summary"),

  // --- Step 3: Admin Application Management ---
  getApplications: (status: "pending" | "rejected" = "pending") =>
    request<{ success: boolean; count: number; applications: any[] }>(
      `/admin/applications?status=${status}`
    ),

  approveApplication: (id: number) =>
    request<{ success: boolean; message: string; member: any }>(
      `/admin/applications/${id}/approve`,
      { method: "POST" }
    ),

  rejectApplication: (id: number, reason: string) =>
    request<{ success: boolean; message: string }>(
      `/admin/applications/${id}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    ),

  // --- Step 3: Admin Member Registry ---
  getMembers: (params?: { q?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    return request<{
      success: boolean;
      members: any[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/admin/members?${query.toString()}`);
  },

  getMemberDetail: (id: number) =>
    request<{ success: boolean; member: any; cards: any[] }>(`/admin/members/${id}`),

  createMemberManually: (data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
  }) =>
    request<{ success: boolean; message: string; member: any }>("/admin/members", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateMember: (
    id: number,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
    }
  ) =>
    request<{ success: boolean; message: string; member: any }>(`/admin/members/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deactivateMember: (id: number) =>
    request<{ success: boolean; message: string; member: any }>(
      `/admin/members/${id}/deactivate`,
      { method: "POST" }
    ),

  uploadMemberPhoto: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await fetch(`${API_BASE}/admin/members/${id}/photo`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json().catch(() => ({
      success: false,
      error: "Unable to parse server response.",
    }));

    if (!response.ok) {
      throw new Error(data?.error || `Upload failed with status ${response.status}`);
    }

    return data as { success: boolean; message: string; passportPhotoRef: string };
  },

  // --- Step 3: Admin ID Cards ---
  getIdCards: (params?: { memberId?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.memberId) query.set("memberId", String(params.memberId));
    if (params?.status) query.set("status", params.status);
    return request<{ success: boolean; cards: any[] }>(`/admin/cards?${query.toString()}`);
  },

  getEligibleCardMembers: () =>
    request<{
      success: boolean;
      members: Array<{
        id: number;
        fullName: string;
        registrationNumber: string;
        passportPhotoRef?: string | null;
        memberStatus: string;
      }>;
    }>("/admin/cards/eligible"),

  issueIdCard: (memberId: number) =>
    request<{ success: boolean; message: string; card: any; qrCodeDataUrl: string }>(
      `/admin/cards/issue/${memberId}`,
      { method: "POST" }
    ),

  revokeIdCard: (cardId: number) =>
    request<{ success: boolean; message: string; card: any }>(
      `/admin/cards/${cardId}/revoke`,
      { method: "POST" }
    ),

  // --- Step 3: Admin Monthly Dues ---
  getDues: (params?: { memberId?: number; month?: number; year?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.memberId) query.set("memberId", String(params.memberId));
    if (params?.month) query.set("month", String(params.month));
    if (params?.year) query.set("year", String(params.year));
    if (params?.status) query.set("status", params.status);
    return request<{ success: boolean; dues: any[] }>(`/admin/dues?${query.toString()}`);
  },

  recordDuesPayment: (data: {
    memberId: number;
    month: number;
    year: number;
    amount?: number;
    paymentStatus: "paid" | "unpaid" | "waived";
    paymentDate?: string;
    notes?: string;
  }) =>
    request<{ success: boolean; message: string; duesRecord: any }>("/admin/dues/record", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  recordDues: (data: {
    memberId: number;
    month: number;
    year: number;
    amount?: number;
    paymentStatus: "paid" | "unpaid" | "waived";
    paymentDate?: string;
    notes?: string;
  }) =>
    request<{ success: boolean; message: string; duesRecord: any }>("/admin/dues/record", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDuesSummary: (year?: number) => {
    const query = year ? `?year=${year}` : "";
    return request<{ success: boolean; year: number; summary: any }>(
      `/admin/dues/summary${query}`
    );
  },

  // --- Step 3: Import & Export ---
  getExportUrl: (type: "members" | "applications" | "dues", extraQuery: string = "") => {
    return `${API_BASE}/admin/export/${type}${extraQuery ? "?" + extraQuery : ""}`;
  },

  importMembersCsv: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/admin/import/members`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json().catch(() => ({
      success: false,
      error: "Unable to parse server response.",
    }));

    if (!response.ok) {
      throw new Error(data?.error || `Import failed with status ${response.status}`);
    }

    return data as {
      success: boolean;
      message: string;
      totalProcessed: number;
      importedCount: number;
      skippedCount: number;
      errors: Array<{ row: number; reason: string }>;
    };
  },

  // --- Step 3: Member Portal ID Card Retrieval ---
  getMyIdCard: () =>
    request<{
      success: boolean;
      hasCard: boolean;
      card?: any;
      qrCodeDataUrl?: string;
      member?: any;
      message?: string;
    }>("/member/card"),

  // --- Step 3: Public Verification ---
  verifyByToken: (token: string) =>
    request<{
      success: boolean;
      verified: boolean;
      cardStatus: string;
      verificationType: string;
      member: {
        fullName: string;
        registrationNumber: string;
        memberStatus: string;
        approvalDate?: string | null;
        passportPhotoRef?: string | null;
      };
      card: {
        verificationCode: string;
        issuedAt: string;
        revokedAt?: string | null;
      };
    }>(`/verify/${encodeURIComponent(token)}`),

  verifyByCode: (code: string) =>
    request<{
      success: boolean;
      verified: boolean;
      cardStatus: string;
      verificationType: string;
      member: {
        fullName: string;
        registrationNumber: string;
        memberStatus: string;
        approvalDate?: string | null;
        passportPhotoRef?: string | null;
      };
      card: {
        verificationCode: string;
        issuedAt: string;
        revokedAt?: string | null;
      };
    }>(`/verify/code/${encodeURIComponent(code)}`),
};
