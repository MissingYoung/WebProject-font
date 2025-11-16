
// --- 通用 & 响应类型 ---

// 这是登录和注册成功后，data 字段的类型
export interface AuthResponseData {
  token: string;
  userId: number;
  username: string;
  role: string; 
  realName:string;
  
}

// 通用的 API 响应体结构

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}



// --- 登录 (Login) ---

// 登录接口的请求体 (Payload) 类型
export interface LoginPayload {
  sduId?: string; 
  password?: string;
}


// --- 注册 (Register) ---

// 注册接口的请求体类型
export interface RegisterPayload {
  sduId?: string;
  password?: string;
  realName?: string;
  username?: string;
}

//修改密码接口请求体类型（changePassword)
export interface ChangePasswordPayload{
 oldPassword?:string;
 newPassword?:string;
}

//---用户信息界面---
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
  role?: string; // 新增：可选角色字段，用于权限判断
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
