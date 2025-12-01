import axios from 'axios';
import type { 
  LoginPayload, 
  RegisterPayload,
  AuthResponseData,
  ApiResponse,
  ChangePasswordPayload,
  UpdateUserInfoPayload,
  UserInfo,
  SendCodePayload,
  ResetPasswordPayload,
  UserProfile,
  UpdateProfilePayload,
  CreateCoursePayload,
  updateCoursePayload,
  PageResult,
  CourseQueryParams,
  CourseVO,
  CreateDepartmentPayload,
  DepartmentVO,
  DepartmentQueryParams,
  UpdateDepartmentPayload,
 


} from '@/types';
import { useUserStore } from '@/stores/user';



const apiClient = axios.create({
  baseURL: 'https://webapi.foofish.work', 
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
type LogoutSuccessResponse =ApiResponse<null>
type RegisterSuccessResponse = ApiResponse<AuthResponseData>;
type ChangePasswordSuccessResponse =ApiResponse<null>;
type GetUserSuccessResponse =ApiResponse<UserInfo>;
type UpdateUserInfoSuccessResponse = ApiResponse<null>;
type GetUserInfoSuccessResponse = ApiResponse<UserInfo>;
type GetUserProfileSuccessResponse = ApiResponse<UserProfile>;
type UpdateUserProfileSuccessResponse = ApiResponse<null>;
type SendCodeSuccessResponse =ApiResponse<null>;
type ResetPasswordSuccessResponse =ApiResponse<null>;
type CreateCourseSuccessResponse =ApiResponse<number>;
type GetCourseListSuccessResponse =ApiResponse<PageResult<CourseVO>>;
type UpdateCourseSuccessResponse =ApiResponse<null>;
type DeleteCourseSuccessResponse =ApiResponse<null>;
type ActivateCourseSuccessResponse =ApiResponse<null>;
type DeactivateCourseSuccessResponse =ApiResponse<null>;
type ArchiveCourseSuccessResponse =ApiResponse<null>;
type GetCourseDetailSuccessResponse =ApiResponse<CourseVO>;
type CreateDepartmentSuccessResponse =ApiResponse<number>;
type GetDepartmentSuccessResponse =ApiResponse<PageResult<DepartmentVO>>
type UpdateDepartmentSuccessResponse =ApiResponse<null>;
type DeleteDepartmentSuccessResponse =ApiResponse<null>;
type GetDepartmentByIdSuccessResponse =ApiResponse<DepartmentVO>;
type EnableDepartmentSuccessResponse =ApiResponse<null>
type DisableDepartmentSuccessResponse =ApiResponse<null>




// 更新用户信息请求函数
export const updateUserInfo = async (
    payload: UpdateUserInfoPayload,
    userId: string): Promise<UpdateUserInfoSuccessResponse> =>
     apiClient.post(`/user/${userId}/update-info`, payload);


// 获取当前用户信息(指定 userId)
export const getUserInfo = async (
    userId: string): Promise<GetUserInfoSuccessResponse> =>
 apiClient.get(`/user/${userId}/info`,);


// 获取用户资料(指定 userId)
export const getUserProfile = async (
    userId: string): Promise<GetUserProfileSuccessResponse > =>
    apiClient.get(`/user/${userId}/profile`)


// 更新用户资料
export const updateUserProfile = async (
    payload: UpdateProfilePayload,
    userId: string): Promise<UpdateUserProfileSuccessResponse> =>
    apiClient.post(`/user/${userId}/update-profile`, payload)

//  更新登录请求函数
export const login = async (payload: LoginPayload): Promise<LoginSuccessResponse> => 
  
     apiClient.post('/auth/login', payload);

//更新登出请求函数
export const logout =async():Promise<LogoutSuccessResponse>=>
  apiClient.post('auth/logout');

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

 
//创建课程
export const createCourse=async(
  payload:CreateCoursePayload
):Promise<CreateCourseSuccessResponse>=>
  apiClient.post('/course/create', payload);  

//获取课程列表
export const getCourseList=async(
  params:CourseQueryParams
):Promise<GetCourseListSuccessResponse>=>
  apiClient.get('/course/list',{params});
//更新课程
export const updateCourse=async(
  id:number,
  payload:updateCoursePayload
):Promise<UpdateCourseSuccessResponse>=>
  apiClient.post(`/course/${id}/update`, payload); 
//删除课程
export const deleteCourse =async(
  id:number,
):Promise<DeleteCourseSuccessResponse>=>
  apiClient.post(`/course/${id}/delete`) 
//启用课程
export const activateCourse =async(
  id:number,
):Promise<ActivateCourseSuccessResponse>=>
  apiClient.post(`/course/${id}/activate`);
//弃用课程
export const deactivateCourse =async(
  id:number
):Promise<DeactivateCourseSuccessResponse>=>
  apiClient.post(`/course/${id}/deactivate`);
//归档课程
export const archiveCourse =async(
  id:number
):Promise<ArchiveCourseSuccessResponse>=>
  apiClient.post(`/course/${id}/archive`);
//获取课程详情
export const getCourseDetail = async (id: number): Promise<GetCourseDetailSuccessResponse> => {
  return apiClient.get(`/course/${id}/detail`);
}; 

//创建部门
export const createDepartment =async(
  payload:CreateDepartmentPayload,
):Promise<CreateDepartmentSuccessResponse>=>
  apiClient.post('/department/create', payload);
//获取部门列表
export const getDepartmentList =async(
  params:DepartmentQueryParams
):Promise<GetDepartmentSuccessResponse>=>
  apiClient.get('/department/list', { params });
//更新部门信息
export const updateDepartment = async (
  id: number, 
  payload: UpdateDepartmentPayload
): Promise<UpdateDepartmentSuccessResponse>=>
   apiClient.post(`/department/${id}/update`, payload);
 //删除部门
 export const deleteDepartment =async(
  id:number,
 ):Promise<DeleteDepartmentSuccessResponse>=>
  apiClient.post(`/department/${id}/delete`); 
//通过id搜索部门
export const getDepartmentById=async(
  id:number,
):Promise<GetDepartmentByIdSuccessResponse>=>
  apiClient.get(`/department/${id}`);
 //启用部门
export const enableDepartment=async(
  id:number,
):Promise<EnableDepartmentSuccessResponse>=>
  apiClient.post(`/department/${id}/enable`);   
//弃用部门
export const disableDepartment=async(
  id:number,
):Promise<DisableDepartmentSuccessResponse>=>
  apiClient.post(`/department/${id}/disable`); 
  


