import axios from 'axios';
import type {
  ApiResponse,
  UpdateUserInfoPayload,
  UserInfo,
  UserProfile,
  UpdateProfilePayload,
} from '@/types';

const apiClient = axios.create({
  baseURL: 'https://webapi.foofish.work', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 更新用户信息请求函数
export const updateUserInfo = async (payload: UpdateUserInfoPayload, userId: string): Promise<ApiResponse<null>> => {
  try {
    if (!userId) throw new Error('缺少用户ID')
    const token = localStorage.getItem('token')
    const response = await apiClient.post<ApiResponse<null>>(`/user/${userId}/update-info`, payload, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorResponse = error.response.data as ApiResponse<null>;
      throw new Error(errorResponse.message || '更新用户信息失败啦！');
    }
    throw new Error('网络连接失败或服务器无响应');
  }
}

// 获取当前用户信息(指定 userId)
export const getUserInfo = async (userId: string): Promise<ApiResponse<UserInfo>> => {
  try {
    if (!userId) throw new Error('缺少用户ID')
    const token = localStorage.getItem('token')
    const response = await apiClient.get<ApiResponse<UserInfo>>(`/user/${userId}/info`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorResponse = error.response.data as ApiResponse<null>;
      throw new Error(errorResponse.message || '获取用户信息失败啦！');
    }
    throw new Error('网络连接失败或服务器无响应');
  }
}

// 获取用户资料(指定 userId)
export const getUserProfile = async (userId: string): Promise<ApiResponse<UserProfile>> => {
  try {
    if (!userId) throw new Error('缺少用户ID')
    const token = localStorage.getItem('token')
    const response = await apiClient.get<ApiResponse<UserProfile>>(`/user/${userId}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorResponse = error.response.data as ApiResponse<null>;
      throw new Error(errorResponse.message || '获取用户资料失败');
    }
    throw new Error('网络连接失败或服务器无响应');
  }
}

// 更新用户资料
export const updateUserProfile = async (payload: UpdateProfilePayload, userId: string): Promise<ApiResponse<null>> => {
  try {
    if (!userId) throw new Error('缺少用户ID')
    const token = localStorage.getItem('token')
    const response = await apiClient.post<ApiResponse<null>>(`/user/${userId}/update-profile`, payload, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorResponse = error.response.data as ApiResponse<null>;
      throw new Error(errorResponse.message || '更新用户资料失败');
    }
    throw new Error('网络连接失败或服务器无响应');
  }
}
