
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

//登出
export interface LogoutPayload{
  
}


// --- 注册 (Register) ---

// 注册接口的请求体类型
export interface RegisterPayload {
  sduId?: string;
  password?: string;
  realName?: string;
  username?: string;
  email:string;
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
  sduId?: string;
  id:number;
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
  verificationCode: string;
  newPassword: string;
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

//发送验证码
export interface SendCodePayload{
  email:string;
}
//邮箱重置密码
export interface ResetPasswordPayload{
  email:string;
  verificationCode:string;
  newPassword:string;
}


//课程类型
export type CourseType ='REQUIRED' | 'LIMITED_ELECTIVE' | 'OPEN_ELECTIVE';
//课程创建参数
export interface CreateCoursePayload{
  code: string;           // 课程编号 (必需)
  name: string;           // 课程名称 (必需)
  departmentId?: number;  // 开课学院ID
  defaultCourseType?: CourseType; // 课程类型
  credit?: number;        // 学分
  totalHours?: number;    // 总学时
  lectureHours?: number;  // 理论学时
  labHours?: number;      // 实验学时
  repeatable?: boolean;   // 是否可重复修读
  description?: string;   // 简介
}
//课程编辑参数
export interface updateCoursePayload{
  code: string;           // 课程编号 (必需)
  name: string;           // 课程名称 (必需)
  departmentId?: number;  // 开课学院ID
  defaultCourseType?: CourseType; // 课程类型
  credit?: number;        // 学分
  totalHours?: number;    // 总学时
  lectureHours?: number;  // 理论学时
  labHours?: number;      // 实验学时
  repeatable?: boolean;   // 是否可重复修读
  description?: string;   // 简介
}

//课程状态
export type CourseStatus='DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
//课程视图对象
export interface CourseVO {
  id: number;
  code: string;
  name: string;
  departmentId: number;
  departmentName?: string; // 后端返回部门名字，如果没有则显示 ID
  defaultCourseType: string;
  credit: number;
  totalHours: number;
  lectureHours: number;
  labHours: number;
  repeatable: boolean;
  description?: string;
  status: CourseStatus;
  createTime?: string | { dateTime: string }; 
  updateTime?: string | { dateTime: string };
}
//分页响应通用泛型
export interface PageResult<T>{
  records:T[];
  total:number;
  pageNum:number;
  pageSize:number;
  pages:number;
}
//查询参数类型
export interface CourseQueryParams{
  code?:string;
  name?:string;
  departmentId?:number;
  defaultCourseType?:string;
  status?:string;
  pageNum:number;
  pageSize:number;
}