import axios from 'axios';
import type { 
  LoginPayload, 
  RegisterPayload,
  AuthResponseData,
  ApiResponse,
  ChangePasswordPayload,
  UserInfo,
  SendCodePayload,
  ResetPasswordPayload,
} from '@/types';
import { useUserStore } from '@/stores/user';



const apiClient = axios.create({
  baseURL: 'http://localhost:8081', 
  headers: {
    'Content-Type': 'application/json',
  },
});

//请求拦截器
apiClient.interceptors.request.use(
  (config)=>{
    const userStore =useUserStore();
    const token =userStore.token;

    if(token){
      config.headers['satoken']=token;
    }
    return config;
  },
  ( error)=>{
    return Promise.reject(error);
  }
)

//响应拦截器(用于统一处理业务逻辑和错误)
apiClient.interceptors.response.use(
  (response)=>{
    const res =response.data;
    if(res.code!==200){
      console.error('API错误:',res.message||'未知错误');
      return Promise.reject(new Error(res.message||'Error'));
    }
    return res; // 如果业务码是 200，只返回 data 部分，简化后续操作
  },
  (error)=>{
    console.error('网络错误',error.response?.data?.message||error.message);
    if(axios.isAxiosError(error)&&error.response){
      if(error.response.status===401){
        const userStore=useUserStore();
        userStore.logout();
        window.location.href='/login';
      }
      return Promise.reject(new Error(error.response.data?.message||"服务器发生错误"));

    }
    return Promise.reject(new Error('网络连接失败或服务器无响应'));
  }
)

// 定义通用的成功响应类型
type LoginSuccessResponse = ApiResponse<AuthResponseData>;
type RegisterSuccessResponse = ApiResponse<AuthResponseData>;
type ChangePasswordSuccessResponse =ApiResponse<null>;
type GetUserSuccessResponse =ApiResponse<UserInfo>;
type SendCodeSuccessResponse =ApiResponse<null>;
type ResetPasswordSuccessResponse =ApiResponse<null>;

//  更新登录请求函数
export const login = async (payload: LoginPayload): Promise<LoginSuccessResponse> => 
  
    // 使用API 路径: /auth/login
     apiClient.post('/auth/login', payload);
   
    


//  更新注册请求函数
export const register = async (payload: RegisterPayload): Promise<RegisterSuccessResponse> => 
 
    // 使用API 路径: /auth/register
    apiClient.post('/auth/register', payload);


//  更新修改密码请求函数

/**
 * 修改用户密码 
 * @param userId - 用户 ID，将作为 URL 的一部分
 * @param payload - 包含新旧密码的对象
 */
export const changePassword = async (
  userId:number,
  payload: ChangePasswordPayload
): Promise<ChangePasswordSuccessResponse> => 
    apiClient.post(`/auth/${userId}/change-password`, payload);
  


/**
 * 获取当前登录用户的信息
 * 这个请求会自动携带拦截器中设置的 token
 */
export const getCurrentUser=async(
  userId:number,

):Promise<GetUserSuccessResponse>=>
  
   apiClient.get(`/auth/${userId}/info`);

//公共接口，发送重置密码验证码
export const sendPasswordResetCode =async(
  payload:SendCodePayload
):Promise<SendCodeSuccessResponse>=>
  apiClient.post('/auth/password-reset/send-code',payload);
  //重置密码
export const resetPassword =async(
  payload:ResetPasswordPayload
):Promise<ResetPasswordSuccessResponse>=>
  apiClient.post('/auth/password-reset/reset',payload);  
  

