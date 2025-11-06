// --- 通用 & 响应类型 ---

// 这是登录和注册成功后，data 字段的类型
export interface AuthResponseData {
  token: string;
  userId: number;
  username: string;
  role: string; 
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