// --- 用户信息更新 (Update User Info) ---

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
// 用户信息更新请求体类型
export interface UpdateUserInfoPayload {
  username?: string;
  realName?: string;
  gender?: 0 | 1 | 2; // 0=MALE, 1=FEMALE, 2=UNKNOWN
  birthday?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  ethnic?: string;
  politicalStatus?: string;
  description?: string;
}

// 用户信息数据类型
export interface UserInfo {
  username: string;
  realName: string;
  gender: 0 | 1 | 2; // 0=MALE, 1=FEMALE, 2=UNKNOWN
  birthday: string;
  phone: string;
  email: string;
  avatarUrl: string;
  ethnic: string;
  politicalStatus: string;
  description: string;
}

// 用户资料 (User Profile)
export interface UserProfile {
  username: string;
  email: string;
  avatarUrl: string;
  description: string;
}

// 用户资料更新请求体类型
export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  avatarUrl?: string;
  description?: string;
}
