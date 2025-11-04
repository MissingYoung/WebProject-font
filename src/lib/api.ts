import axios from 'axios';
import type { 
  LoginPayload, 
  RegisterPayload,
  AuthResponseData,
  ApiResponse,
} from '@/types';


const apiClient = axios.create({
  baseURL: 'https://webapi.foofish.work', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 定义通用的成功响应类型
type LoginSuccessResponse = ApiResponse<AuthResponseData>;
type RegisterSuccessResponse = ApiResponse<AuthResponseData>;

//  更新登录请求函数
export const login = async (payload: LoginPayload): Promise<LoginSuccessResponse> => {
  try {
    // 使用API 路径: /auth/login
    const response = await apiClient.post<LoginSuccessResponse>('/auth/login', payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorResponse = error.response.data as ApiResponse<null>;
      throw new Error(errorResponse.message || '登录失败');
    }
    throw new Error('网络连接失败或服务器无响应');
  }
};

//  更新注册请求函数
export const register = async (payload: RegisterPayload): Promise<RegisterSuccessResponse> => {
  try {
    // 使用API 路径: /auth/register
    const response = await apiClient.post<RegisterSuccessResponse>('/auth/register', payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorResponse = error.response.data as ApiResponse<null>;
      throw new Error(errorResponse.message || '注册失败');
    }
    throw new Error('网络连接失败或服务器无响应');
  }
};