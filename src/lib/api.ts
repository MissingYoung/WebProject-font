import axios from 'axios'
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
  SendEmailBindingCodePayload,
  BindEmailPayload,
  VerifyEmailCodePayload,
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
  CreateSemesterPayload,
  UpdateSemesterPayload,
  SemesterVO,
  SemesterQueryParams,
  CreateMajorPayload,
  UpdateMajorPayload,
  MajorVO,
  MajorQueryParams,
  StudentVO,
  StudentQueryParams,
  UpdateStudentInfoRequest,
  TeacherVO,
  TeacherQueryParams,
  UpdateTeacherInfoRequest,
  FamilyMemberVO,
  FamilyMemberQueryParams,
  CreateFamilyMemberRequest,
  UpdateFamilyMemberRequest,
  PermissionVO,
  PermissionQueryParams,
  RoleVO,
  RoleQueryParams,
  CreateRolePayload,
  UpdateRolePayload,
  AssignPermissionsPayload,
  AssignUserRolePayload,
  MenuVO,
  DashboardOverview,
  EnrollmentProgress,
  EnrollmentTrendPoint,
  PopularCourse,
  OrgDistribution,
  SystemActivity,
} from '@/types'
import { useUserStore } from '@/stores/user'

const apiClient = axios.create({
  baseURL: 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
})

//请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.token

    if (token) {
      config.headers['satoken'] = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

//响应拦截器(用于统一处理业务逻辑和错误)
apiClient.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      console.error('API错误:', res.message || '未知错误')
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res // 如果业务码是 200，只返回 data 部分，简化后续操作
  },
  (error) => {
    console.error('网络错误', error.response?.data?.message || error.message)
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        const userStore = useUserStore()
        userStore.logout()
        window.location.href = '/login'
      }
      return Promise.reject(new Error(error.response.data?.message || '服务器发生错误'))
    }
    return Promise.reject(new Error('网络连接失败或服务器无响应'))
  }
)

// 定义通用的成功响应类型
type LoginSuccessResponse = ApiResponse<AuthResponseData>
type LogoutSuccessResponse = ApiResponse<null>
type RegisterSuccessResponse = ApiResponse<AuthResponseData>
type ChangePasswordSuccessResponse = ApiResponse<null>
type GetUserSuccessResponse = ApiResponse<UserInfo>
type UpdateUserInfoSuccessResponse = ApiResponse<null>
type GetUserInfoSuccessResponse = ApiResponse<UserInfo>
type GetUserProfileSuccessResponse = ApiResponse<UserProfile>
type UpdateUserProfileSuccessResponse = ApiResponse<null>
type SendCodeSuccessResponse = ApiResponse<null>
type ResetPasswordSuccessResponse = ApiResponse<null>
type VerifyEmailCodeSuccessResponse = ApiResponse<null>
type CreateCourseSuccessResponse = ApiResponse<number>
type GetCourseListSuccessResponse = ApiResponse<PageResult<CourseVO>>
type UpdateCourseSuccessResponse = ApiResponse<null>
type DeleteCourseSuccessResponse = ApiResponse<null>
type ActivateCourseSuccessResponse = ApiResponse<null>
type DeactivateCourseSuccessResponse = ApiResponse<null>
type ArchiveCourseSuccessResponse = ApiResponse<null>
type GetCourseDetailSuccessResponse = ApiResponse<CourseVO>
type CreateDepartmentSuccessResponse = ApiResponse<number>
type GetDepartmentSuccessResponse = ApiResponse<PageResult<DepartmentVO>>
type UpdateDepartmentSuccessResponse = ApiResponse<null>
type DeleteDepartmentSuccessResponse = ApiResponse<null>
type GetDepartmentByIdSuccessResponse = ApiResponse<DepartmentVO>
type EnableDepartmentSuccessResponse = ApiResponse<null>
type DisableDepartmentSuccessResponse = ApiResponse<null>

// 更新用户信息请求函数
export const updateUserInfo = async (
  payload: UpdateUserInfoPayload,
  userId: string
): Promise<UpdateUserInfoSuccessResponse> => apiClient.post(`/user/${userId}/info/update`, payload)

// 获取当前用户信息(指定 userId)
export const getUserInfo = async (userId: string): Promise<GetUserInfoSuccessResponse> =>
  apiClient.get(`/user/${userId}/info`)

// 获取用户资料(指定 userId)
export const getUserProfile = async (userId: string): Promise<GetUserProfileSuccessResponse> =>
  apiClient.get(`/user/${userId}/profile`)

// 更新用户资料
export const updateUserProfile = async (
  payload: UpdateProfilePayload,
  userId: string
): Promise<UpdateUserProfileSuccessResponse> =>
  apiClient.post(`/user/${userId}/profile/update`, payload)

//  更新登录请求函数
export const login = async (payload: LoginPayload): Promise<LoginSuccessResponse> =>
  apiClient.post('/auth/login', payload)

//更新登出请求函数
export const logout = async (): Promise<LogoutSuccessResponse> => apiClient.post('auth/logout')

//  更新注册请求函数
export const register = async (payload: RegisterPayload): Promise<RegisterSuccessResponse> =>
  // 使用API 路径: /auth/register
  apiClient.post('/auth/register', payload)

//  更新修改密码请求函数

/**
 * 修改用户密码
 * @param userId - 用户 ID，将作为 URL 的一部分
 * @param payload - 包含新旧密码的对象
 */
export const changePassword = async (
  userId: number,
  payload: ChangePasswordPayload
): Promise<ChangePasswordSuccessResponse> =>
  apiClient.post(`/auth/${userId}/change-password`, payload)

/**
 * 获取当前登录用户的信息
 * 这个请求会自动携带拦截器中设置的 token
 */
export const getCurrentUser = async (userId: number): Promise<GetUserSuccessResponse> =>
  apiClient.get(`/auth/${userId}/info`)

//公共接口，发送重置密码验证码
export const sendPasswordResetCode = async (
  payload: SendCodePayload
): Promise<SendCodeSuccessResponse> => apiClient.post('/auth/password-reset/send-code', payload)

//重置密码
export const resetPassword = async (
  payload: ResetPasswordPayload
): Promise<ResetPasswordSuccessResponse> => apiClient.post('/auth/password-reset/reset', payload)

//发送邮箱绑定验证码
export const sendEmailBindingCode = async (
  payload: SendEmailBindingCodePayload,
  userId: string
): Promise<SendCodeSuccessResponse> => apiClient.post(`/user/${userId}/email/send-code`, payload)

//验证邮箱验证码
export const verifyEmailCode = async (
  payload: VerifyEmailCodePayload,
  userId: string
): Promise<VerifyEmailCodeSuccessResponse> =>
  apiClient.post(`/user/${userId}/email/verify`, payload)

//绑定邮箱
export const bindEmail = async (
  payload: BindEmailPayload,
  userId: string
): Promise<SendCodeSuccessResponse> => apiClient.post(`/user/${userId}/email/bind`, payload)

//创建课程
export const createCourse = async (
  payload: CreateCoursePayload
): Promise<CreateCourseSuccessResponse> => apiClient.post('/course/create', payload)

//获取课程列表
export const getCourseList = async (
  params: CourseQueryParams
): Promise<GetCourseListSuccessResponse> => apiClient.get('/course/list', { params })
//更新课程
export const updateCourse = async (
  id: number,
  payload: updateCoursePayload
): Promise<UpdateCourseSuccessResponse> => apiClient.post(`/course/${id}/update`, payload)
//删除课程
export const deleteCourse = async (id: number): Promise<DeleteCourseSuccessResponse> =>
  apiClient.post(`/course/${id}/delete`)
//启用课程
export const activateCourse = async (id: number): Promise<ActivateCourseSuccessResponse> =>
  apiClient.post(`/course/${id}/activate`)
//弃用课程
export const deactivateCourse = async (id: number): Promise<DeactivateCourseSuccessResponse> =>
  apiClient.post(`/course/${id}/deactivate`)
//归档课程
export const archiveCourse = async (id: number): Promise<ArchiveCourseSuccessResponse> =>
  apiClient.post(`/course/${id}/archive`)
//获取课程详情
export const getCourseDetail = async (id: number): Promise<GetCourseDetailSuccessResponse> => {
  return apiClient.get(`/course/${id}/detail`)
}

//创建部门
export const createDepartment = async (
  payload: CreateDepartmentPayload
): Promise<CreateDepartmentSuccessResponse> => apiClient.post('/department/create', payload)
//获取部门列表
export const getDepartmentList = async (
  params: DepartmentQueryParams
): Promise<GetDepartmentSuccessResponse> => apiClient.get('/department/list', { params })
//更新部门信息
export const updateDepartment = async (
  id: number,
  payload: UpdateDepartmentPayload
): Promise<UpdateDepartmentSuccessResponse> => apiClient.post(`/department/${id}/update`, payload)
//删除部门
export const deleteDepartment = async (id: number): Promise<DeleteDepartmentSuccessResponse> =>
  apiClient.post(`/department/${id}/delete`)
//通过id搜索部门
export const getDepartmentById = async (id: number): Promise<GetDepartmentByIdSuccessResponse> =>
  apiClient.get(`/department/${id}`)
//启用部门
export const enableDepartment = async (id: number): Promise<EnableDepartmentSuccessResponse> =>
  apiClient.post(`/department/${id}/enable`)
//弃用部门
export const disableDepartment = async (id: number): Promise<DisableDepartmentSuccessResponse> =>
  apiClient.post(`/department/${id}/disable`)

// --- 学期 (Semester) API ---

type CreateSemesterSuccessResponse = ApiResponse<number>
type GetSemesterListSuccessResponse = ApiResponse<PageResult<SemesterVO>>
type UpdateSemesterSuccessResponse = ApiResponse<null>
type DeleteSemesterSuccessResponse = ApiResponse<null>
type GetSemesterDetailSuccessResponse = ApiResponse<SemesterVO>
type GetCurrentSemesterSuccessResponse = ApiResponse<SemesterVO>
type SetCurrentSemesterSuccessResponse = ApiResponse<null>

// 创建学期
export const createSemester = async (
  payload: CreateSemesterPayload
): Promise<CreateSemesterSuccessResponse> => apiClient.post('/semester/create', payload)

// 获取学期列表
export const getSemesterList = async (
  params: SemesterQueryParams
): Promise<GetSemesterListSuccessResponse> => apiClient.get('/semester/list', { params })

// 更新学期
export const updateSemester = async (
  id: number,
  payload: UpdateSemesterPayload
): Promise<UpdateSemesterSuccessResponse> => apiClient.post(`/semester/${id}/update`, payload)

// 删除学期
export const deleteSemester = async (id: number): Promise<DeleteSemesterSuccessResponse> =>
  apiClient.post(`/semester/${id}/delete`)

// 获取学期详情
export const getSemesterDetail = async (id: number): Promise<GetSemesterDetailSuccessResponse> =>
  apiClient.get(`/semester/${id}`)

// 获取当前学期
export const getCurrentSemester = async (): Promise<GetCurrentSemesterSuccessResponse> =>
  apiClient.get('/semester/current')

// 设置当前学期
export const setCurrentSemester = async (id: number): Promise<SetCurrentSemesterSuccessResponse> =>
  apiClient.post(`/semester/${id}/set-current`)

// --- 专业 (Major) API ---

type CreateMajorSuccessResponse = ApiResponse<number>
type GetMajorListSuccessResponse = ApiResponse<PageResult<MajorVO>>
type UpdateMajorSuccessResponse = ApiResponse<null>
type DeleteMajorSuccessResponse = ApiResponse<null>
type GetMajorDetailSuccessResponse = ApiResponse<MajorVO>
type EnableMajorSuccessResponse = ApiResponse<null>
type DisableMajorSuccessResponse = ApiResponse<null>

// 创建专业
export const createMajor = async (
  payload: CreateMajorPayload
): Promise<CreateMajorSuccessResponse> => apiClient.post('/major/create', payload)

// 获取专业列表
export const getMajorList = async (
  params: MajorQueryParams
): Promise<GetMajorListSuccessResponse> => apiClient.get('/major/list', { params })

// 更新专业
export const updateMajor = async (
  id: number,
  payload: UpdateMajorPayload
): Promise<UpdateMajorSuccessResponse> => apiClient.post(`/major/${id}/update`, payload)

// 删除专业
export const deleteMajor = async (id: number): Promise<DeleteMajorSuccessResponse> =>
  apiClient.post(`/major/${id}/delete`)

// 获取专业详情
export const getMajorDetail = async (id: number): Promise<GetMajorDetailSuccessResponse> =>
  apiClient.get(`/major/${id}`)

// 启用专业
export const enableMajor = async (id: number): Promise<EnableMajorSuccessResponse> =>
  apiClient.post(`/major/${id}/enable`)

// 禁用专业
export const disableMajor = async (id: number): Promise<DisableMajorSuccessResponse> =>
  apiClient.post(`/major/${id}/disable`)

// --- 学生 (Student) API ---

type GetStudentListSuccessResponse = ApiResponse<PageResult<StudentVO>>
type GetStudentInfoSuccessResponse = ApiResponse<StudentVO>
type UpdateStudentInfoSuccessResponse = ApiResponse<null>

// 获取学生列表
export const getStudentList = async (
  params: StudentQueryParams
): Promise<GetStudentListSuccessResponse> => apiClient.get('/student/list', { params })

// 获取学生信息
export const getStudentInfo = async (userId: number): Promise<GetStudentInfoSuccessResponse> =>
  apiClient.get(`/student/${userId}/info`)

// 更新学生学业信息
export const updateStudentInfo = async (
  userId: number,
  payload: UpdateStudentInfoRequest
): Promise<UpdateStudentInfoSuccessResponse> =>
  apiClient.post(`/student/${userId}/info/update`, payload)

// --- 教师 (Teacher) API ---

type GetTeacherListSuccessResponse = ApiResponse<PageResult<TeacherVO>>
type GetTeacherInfoSuccessResponse = ApiResponse<TeacherVO>
type UpdateTeacherInfoSuccessResponse = ApiResponse<null>

// 获取教师列表
export const getTeacherList = async (
  params: TeacherQueryParams
): Promise<GetTeacherListSuccessResponse> => apiClient.get('/teacher/list', { params })

// 获取教师信息
export const getTeacherInfo = async (userId: number): Promise<GetTeacherInfoSuccessResponse> =>
  apiClient.get(`/teacher/${userId}/info`)

// 更新教师工作信息
export const updateTeacherInfo = async (
  userId: number,
  payload: UpdateTeacherInfoRequest
): Promise<UpdateTeacherInfoSuccessResponse> =>
  apiClient.post(`/teacher/${userId}/info/update`, payload)

// --- 家庭成员 (FamilyMember) API ---

type CreateFamilyMemberSuccessResponse = ApiResponse<number>
type UpdateFamilyMemberSuccessResponse = ApiResponse<null>
type DeleteFamilyMemberSuccessResponse = ApiResponse<null>
type GetFamilyMemberSuccessResponse = ApiResponse<FamilyMemberVO>
type GetFamilyMemberListSuccessResponse = ApiResponse<PageResult<FamilyMemberVO>>

// 创建家庭成员
export const createFamilyMember = async (
  payload: CreateFamilyMemberRequest
): Promise<CreateFamilyMemberSuccessResponse> => apiClient.post('/family-member/create', payload)

// 更新家庭成员信息
export const updateFamilyMember = async (
  id: number,
  payload: UpdateFamilyMemberRequest
): Promise<UpdateFamilyMemberSuccessResponse> =>
  apiClient.post(`/family-member/${id}/update`, payload)

// 删除家庭成员
export const deleteFamilyMember = async (id: number): Promise<DeleteFamilyMemberSuccessResponse> =>
  apiClient.post(`/family-member/${id}/delete`)

// 获取家庭成员详情
export const getFamilyMember = async (id: number): Promise<GetFamilyMemberSuccessResponse> =>
  apiClient.get(`/family-member/${id}`)

// 获取家庭成员列表
export const getFamilyMemberList = async (
  params: FamilyMemberQueryParams
): Promise<GetFamilyMemberListSuccessResponse> => apiClient.get('/family-member/list', { params })

// --- 权限 (Permission) API ---

type GetPermissionListSuccessResponse = ApiResponse<PageResult<PermissionVO>>
type GetAllPermissionsSuccessResponse = ApiResponse<PermissionVO[]>
type GetPermissionSuccessResponse = ApiResponse<PermissionVO>
type GetCurrentUserPermissionsSuccessResponse = ApiResponse<PermissionVO[]>

// 获取权限列表 (分页)
export const getPermissionList = async (
  params: PermissionQueryParams
): Promise<GetPermissionListSuccessResponse> => apiClient.get('/permission/list', { params })

// 获取所有权限
export const getAllPermissions = async (): Promise<GetAllPermissionsSuccessResponse> =>
  apiClient.get('/permission/all')

// 获取权限详情
export const getPermissionDetail = async (id: number): Promise<GetPermissionSuccessResponse> =>
  apiClient.get(`/permission/${id}/detail`)

// 获取指定角色的权限列表
export const getRolePermissions = async (
  roleId: number
): Promise<GetAllPermissionsSuccessResponse> => apiClient.get(`/permission/role/${roleId}`)

// 获取当前用户的权限列表
export const getCurrentUserPermissions =
  async (): Promise<GetCurrentUserPermissionsSuccessResponse> =>
    apiClient.get('/auth/me/permissions')

// --- 角色 (Role) API ---

type CreateRoleSuccessResponse = ApiResponse<number>
type UpdateRoleSuccessResponse = ApiResponse<null>
type DeleteRoleSuccessResponse = ApiResponse<null>
type GetRoleListSuccessResponse = ApiResponse<PageResult<RoleVO>>
type GetRoleSuccessResponse = ApiResponse<RoleVO>
type ActivateRoleSuccessResponse = ApiResponse<null>
type DeactivateRoleSuccessResponse = ApiResponse<null>
type AssignPermissionsSuccessResponse = ApiResponse<null>
type GetUserRolesSuccessResponse = ApiResponse<PageResult<RoleVO>>
type AssignUserRoleSuccessResponse = ApiResponse<null>

// 创建角色
export const createRole = async (payload: CreateRolePayload): Promise<CreateRoleSuccessResponse> =>
  apiClient.post('/role/create', payload)

// 更新角色
export const updateRole = async (
  id: number,
  payload: UpdateRolePayload
): Promise<UpdateRoleSuccessResponse> => apiClient.post(`/role/${id}/update`, payload)

// 删除角色
export const deleteRole = async (id: number): Promise<DeleteRoleSuccessResponse> =>
  apiClient.post(`/role/${id}/delete`)

// 获取角色列表 (分页)
export const getRoleList = async (params: RoleQueryParams): Promise<GetRoleListSuccessResponse> =>
  apiClient.get('/role/list', { params })

// 获取角色详情
export const getRoleDetail = async (id: number): Promise<GetRoleSuccessResponse> =>
  apiClient.get(`/role/${id}/detail`)

// 启用角色
export const activateRole = async (id: number): Promise<ActivateRoleSuccessResponse> =>
  apiClient.post(`/role/${id}/activate`)

// 禁用角色
export const deactivateRole = async (id: number): Promise<DeactivateRoleSuccessResponse> =>
  apiClient.post(`/role/${id}/deactivate`)

// 为角色分配权限 (批量)
export const assignRolePermissions = async (
  roleId: number,
  payload: AssignPermissionsPayload
): Promise<AssignPermissionsSuccessResponse> =>
  apiClient.post(`/role/${roleId}/permissions/assign`, payload)

// 为角色添加单个权限
export const addRolePermission = async (
  roleId: number,
  permissionId: number
): Promise<AssignPermissionsSuccessResponse> =>
  apiClient.post(`/role/${roleId}/permissions/${permissionId}/add`)

// 从角色移除单个权限
export const removeRolePermission = async (
  roleId: number,
  permissionId: number
): Promise<AssignPermissionsSuccessResponse> =>
  apiClient.post(`/role/${roleId}/permissions/${permissionId}/remove`)

// 获取用户的角色列表
export const getUserRoles = async (
  userId: number,
  params?: { pageNum?: number; pageSize?: number }
): Promise<GetUserRolesSuccessResponse> =>
  apiClient.get(`/user/${userId}/roles`, { params: params || { pageNum: 1, pageSize: 100 } })

// 为用户分配角色
export const assignUserRole = async (
  userId: number,
  payload: AssignUserRolePayload
): Promise<AssignUserRoleSuccessResponse> => apiClient.post(`/user/${userId}/roles/assign`, payload)

// --- 行政班 (AdministrativeClass) API ---

import type {
  AdministrativeClassVO,
  AdministrativeClassQueryParams,
  CreateAdministrativeClassPayload,
  UpdateAdministrativeClassPayload,
  AssignStudentsPayload,
  AssignStudentsResultVO,
  RandomAssignStudentsPayload,
  CourseOfferingVO,
  CourseOfferingQueryParams,
  CreateCourseOfferingPayload,
  UpdateCourseOfferingPayload,
  TeacherAssignment,
  TeachingClassVO,
  TeachingClassQueryParams,
  CreateTeachingClassPayload,
  UpdateTeachingClassPayload,
  TeachingClassScheduleVO,
  TeachingClassScheduleQueryParams,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  AutoScheduleResultVO,
  CourseSelectionWindowVO,
  CourseSelectionWindowQueryParams,
  CreateSelectionWindowPayload,
  UpdateSelectionWindowPayload,
  CourseEnrollmentVO,
  CourseEnrollmentQueryParams,
  AvailableTeachingClassVO,
  AvailableTeachingClassQueryParams,
  EnrollCoursePayload,
  ProgramCourseRequirementVO,
  ProgramCourseRequirementQueryParams,
  CreateProgramCourseRequirementPayload,
  UpdateProgramCourseRequirementPayload,
} from '@/types'

type CreateAdministrativeClassSuccessResponse = ApiResponse<number>
type GetAdministrativeClassListSuccessResponse = ApiResponse<PageResult<AdministrativeClassVO>>
type GetAdministrativeClassSuccessResponse = ApiResponse<AdministrativeClassVO>
type UpdateAdministrativeClassSuccessResponse = ApiResponse<null>
type DeleteAdministrativeClassSuccessResponse = ApiResponse<null>
type EnableAdministrativeClassSuccessResponse = ApiResponse<null>
type DisableAdministrativeClassSuccessResponse = ApiResponse<null>
type AssignStudentsSuccessResponse = ApiResponse<AssignStudentsResultVO>

// 创建行政班
export const createAdministrativeClass = async (
  payload: CreateAdministrativeClassPayload
): Promise<CreateAdministrativeClassSuccessResponse> =>
  apiClient.post('/administrative-class/create', payload)

// 获取行政班列表
export const getAdministrativeClassList = async (
  params: AdministrativeClassQueryParams
): Promise<GetAdministrativeClassListSuccessResponse> =>
  apiClient.get('/administrative-class/list', { params })

// 获取行政班详情
export const getAdministrativeClassDetail = async (
  id: number
): Promise<GetAdministrativeClassSuccessResponse> => apiClient.get(`/administrative-class/${id}`)

// 更新行政班
export const updateAdministrativeClass = async (
  id: number,
  payload: UpdateAdministrativeClassPayload
): Promise<UpdateAdministrativeClassSuccessResponse> =>
  apiClient.post(`/administrative-class/${id}/update`, payload)

// 删除行政班
export const deleteAdministrativeClass = async (
  id: number
): Promise<DeleteAdministrativeClassSuccessResponse> =>
  apiClient.post(`/administrative-class/${id}/delete`)

// 启用行政班
export const enableAdministrativeClass = async (
  id: number
): Promise<EnableAdministrativeClassSuccessResponse> =>
  apiClient.post(`/administrative-class/${id}/enable`)

// 禁用行政班
export const disableAdministrativeClass = async (
  id: number
): Promise<DisableAdministrativeClassSuccessResponse> =>
  apiClient.post(`/administrative-class/${id}/disable`)

// 批量分班
export const assignStudentsToClass = async (
  payload: AssignStudentsPayload
): Promise<AssignStudentsSuccessResponse> =>
  apiClient.post('/administrative-class/assign-students', payload)

// 随机分班
export const randomAssignStudents = async (
  payload: RandomAssignStudentsPayload
): Promise<AssignStudentsSuccessResponse> =>
  apiClient.post('/administrative-class/random-assign', payload)

// --- 开课 (CourseOffering) API ---

type CreateCourseOfferingSuccessResponse = ApiResponse<number>
type GetCourseOfferingListSuccessResponse = ApiResponse<PageResult<CourseOfferingVO>>
type GetCourseOfferingSuccessResponse = ApiResponse<CourseOfferingVO>
type UpdateCourseOfferingSuccessResponse = ApiResponse<null>
type DeleteCourseOfferingSuccessResponse = ApiResponse<null>
type CourseOfferingStatusSuccessResponse = ApiResponse<null>
type AssignTeachersSuccessResponse = ApiResponse<null>

// 创建开课
export const createCourseOffering = async (
  payload: CreateCourseOfferingPayload
): Promise<CreateCourseOfferingSuccessResponse> =>
  apiClient.post('/course-offering/create', payload)

// 获取开课列表
export const getCourseOfferingList = async (
  params: CourseOfferingQueryParams
): Promise<GetCourseOfferingListSuccessResponse> =>
  apiClient.get('/course-offering/list', { params })

// 获取开课详情
export const getCourseOfferingDetail = async (
  id: number
): Promise<GetCourseOfferingSuccessResponse> => apiClient.get(`/course-offering/${id}/detail`)

// 获取开课基本信息
export const getCourseOfferingById = async (
  id: number
): Promise<GetCourseOfferingSuccessResponse> => apiClient.get(`/course-offering/${id}`)

// 更新开课
export const updateCourseOffering = async (
  id: number,
  payload: UpdateCourseOfferingPayload
): Promise<UpdateCourseOfferingSuccessResponse> =>
  apiClient.post(`/course-offering/${id}/update`, payload)

// 删除开课
export const deleteCourseOffering = async (
  id: number
): Promise<DeleteCourseOfferingSuccessResponse> => apiClient.post(`/course-offering/${id}/delete`)

// 更新开课状态为草稿
export const setCourseOfferingDraft = async (
  id: number
): Promise<CourseOfferingStatusSuccessResponse> =>
  apiClient.post(`/course-offering/${id}/status/draft`)

// 更新开课状态为排课中
export const setCourseOfferingScheduling = async (
  id: number
): Promise<CourseOfferingStatusSuccessResponse> =>
  apiClient.post(`/course-offering/${id}/status/scheduling`)

// 更新开课状态为选课开放
export const setCourseOfferingEnrollmentOpen = async (
  id: number
): Promise<CourseOfferingStatusSuccessResponse> =>
  apiClient.post(`/course-offering/${id}/status/enrollment-open`)

// 更新开课状态为选课关闭
export const setCourseOfferingEnrollmentClosed = async (
  id: number
): Promise<CourseOfferingStatusSuccessResponse> =>
  apiClient.post(`/course-offering/${id}/status/enrollment-closed`)

// 更新开课状态为已归档
export const setCourseOfferingArchived = async (
  id: number
): Promise<CourseOfferingStatusSuccessResponse> =>
  apiClient.post(`/course-offering/${id}/status/archived`)

// 为开课分配教师（覆盖）
export const assignCourseOfferingTeachers = async (
  id: number,
  teachers: TeacherAssignment[]
): Promise<AssignTeachersSuccessResponse> =>
  apiClient.post(`/course-offering/${id}/teachers/assign`, { teachers })

// 为开课添加教师
export const addCourseOfferingTeacher = async (
  id: number,
  teacherId: number
): Promise<AssignTeachersSuccessResponse> =>
  apiClient.post(`/course-offering/${id}/teachers/${teacherId}/add`)

// 移除开课教师
export const removeCourseOfferingTeacher = async (
  id: number,
  teacherId: number
): Promise<AssignTeachersSuccessResponse> =>
  apiClient.post(`/course-offering/${id}/teachers/${teacherId}/remove`)

// 获取开课教师列表
export const getCourseOfferingTeachers = async (id: number): Promise<ApiResponse<TeacherInfo[]>> =>
  apiClient.get(`/course-offering/${id}/teachers`)

import type { TeacherInfo } from '@/types'

// --- 教学班 (TeachingClass) API ---

type CreateTeachingClassSuccessResponse = ApiResponse<number>
type GetTeachingClassListSuccessResponse = ApiResponse<PageResult<TeachingClassVO>>
type GetTeachingClassSuccessResponse = ApiResponse<TeachingClassVO>
type UpdateTeachingClassSuccessResponse = ApiResponse<null>
type DeleteTeachingClassSuccessResponse = ApiResponse<null>
type TeachingClassStatusSuccessResponse = ApiResponse<null>

// 创建教学班
export const createTeachingClass = async (
  payload: CreateTeachingClassPayload
): Promise<CreateTeachingClassSuccessResponse> => apiClient.post('/teaching-class/create', payload)

// 获取教学班列表
export const getTeachingClassList = async (
  params: TeachingClassQueryParams
): Promise<GetTeachingClassListSuccessResponse> => apiClient.get('/teaching-class/list', { params })

// 获取教学班详情
export const getTeachingClassDetail = async (
  id: number
): Promise<GetTeachingClassSuccessResponse> => apiClient.get(`/teaching-class/${id}/detail`)

// 更新教学班
export const updateTeachingClass = async (
  id: number,
  payload: UpdateTeachingClassPayload
): Promise<UpdateTeachingClassSuccessResponse> =>
  apiClient.post(`/teaching-class/${id}/update`, payload)

// 删除教学班
export const deleteTeachingClass = async (
  id: number
): Promise<DeleteTeachingClassSuccessResponse> => apiClient.post(`/teaching-class/${id}/delete`)

// 发布教学班
export const publishTeachingClass = async (
  id: number
): Promise<TeachingClassStatusSuccessResponse> => apiClient.post(`/teaching-class/${id}/publish`)

// 关闭教学班
export const closeTeachingClass = async (id: number): Promise<TeachingClassStatusSuccessResponse> =>
  apiClient.post(`/teaching-class/${id}/close`)

// 设置教学班专业范围
export const assignTeachingClassMajorRange = async (
  id: number,
  majorRanges: { majorId: number; minGradeLevel?: number; maxGradeLevel?: number }[]
): Promise<ApiResponse<null>> =>
  apiClient.post(`/teaching-class/${id}/major-range/assign`, { majorRanges })

// 获取教学班专业范围
export const getTeachingClassMajorRange = async (
  id: number
): Promise<
  ApiResponse<
    { majorId: number; majorName?: string; minGradeLevel?: number; maxGradeLevel?: number }[]
  >
> => apiClient.get(`/teaching-class/${id}/major-range`)

// 设置教学班行政班关联
export const assignTeachingClassAdminClasses = async (
  id: number,
  adminClasses: { administrativeClassId: number; autoEnroll?: boolean }[]
): Promise<ApiResponse<null>> =>
  apiClient.post(`/teaching-class/${id}/admin-classes/assign`, { adminClasses })

// 获取教学班行政班关联
export const getTeachingClassAdminClasses = async (
  id: number
): Promise<
  ApiResponse<
    { administrativeClassId: number; administrativeClassName?: string; autoEnroll?: boolean }[]
  >
> => apiClient.get(`/teaching-class/${id}/admin-classes`)

// 按行政班创建教学班
export const createTeachingClassesByAdminClasses = async (
  courseOfferingId: number,
  administrativeClassIds: number[],
  autoEnroll?: boolean
): Promise<ApiResponse<TeachingClassVO[]>> =>
  apiClient.post(`/course-offering/${courseOfferingId}/teaching-classes/by-admin-classes`, {
    administrativeClassIds,
    autoEnroll,
  })

// 按人数随机分班创建教学班
export const createTeachingClassesRandomSplit = async (
  courseOfferingId: number,
  classCount: number,
  capacity?: number
): Promise<ApiResponse<TeachingClassVO[]>> =>
  apiClient.post(`/course-offering/${courseOfferingId}/teaching-classes/random-split`, {
    classCount,
    capacity,
  })

// --- 排课 (TeachingClassSchedule) API ---

type CreateScheduleSuccessResponse = ApiResponse<number>
type GetScheduleListSuccessResponse = ApiResponse<PageResult<TeachingClassScheduleVO>>
type GetScheduleSuccessResponse = ApiResponse<TeachingClassScheduleVO>
type UpdateScheduleSuccessResponse = ApiResponse<null>
type DeleteScheduleSuccessResponse = ApiResponse<null>
type AutoScheduleSuccessResponse = ApiResponse<AutoScheduleResultVO>

// 为教学班添加单条排课
export const addTeachingClassSchedule = async (
  teachingClassId: number,
  payload: CreateSchedulePayload
): Promise<CreateScheduleSuccessResponse> =>
  apiClient.post(`/teaching-class-schedule/teaching-class/${teachingClassId}/add`, payload)

// 为教学班批量添加排课
export const batchAddTeachingClassSchedules = async (
  teachingClassId: number,
  schedules: CreateSchedulePayload[]
): Promise<ApiResponse<number[]>> =>
  apiClient.post(`/teaching-class-schedule/teaching-class/${teachingClassId}/batch-add`, {
    schedules,
  })

// 更新排课
export const updateTeachingClassSchedule = async (
  id: number,
  payload: UpdateSchedulePayload
): Promise<UpdateScheduleSuccessResponse> =>
  apiClient.post(`/teaching-class-schedule/${id}/update`, payload)

// 删除排课
export const deleteTeachingClassSchedule = async (
  id: number
): Promise<DeleteScheduleSuccessResponse> => apiClient.post(`/teaching-class-schedule/${id}/delete`)

// 删除教学班所有排课
export const deleteAllTeachingClassSchedules = async (
  teachingClassId: number
): Promise<DeleteScheduleSuccessResponse> =>
  apiClient.post(`/teaching-class-schedule/teaching-class/${teachingClassId}/delete-all`)

// 获取排课详情
export const getTeachingClassScheduleDetail = async (
  id: number
): Promise<GetScheduleSuccessResponse> => apiClient.get(`/teaching-class-schedule/${id}`)

// 分页查询排课列表
export const getTeachingClassScheduleList = async (
  params: TeachingClassScheduleQueryParams
): Promise<GetScheduleListSuccessResponse> =>
  apiClient.get('/teaching-class-schedule/list', { params })

// 查询教学班的所有排课
export const getTeachingClassSchedules = async (
  teachingClassId: number,
  params?: { pageNum?: number; pageSize?: number }
): Promise<GetScheduleListSuccessResponse> =>
  apiClient.get(`/teaching-class/${teachingClassId}/schedules`, { params })

// 自动排课
export const autoSchedule = async (payload: {
  semesterId?: number
  courseOfferingId?: number
  teachingClassIds?: number[]
}): Promise<AutoScheduleSuccessResponse> =>
  apiClient.post('/teaching-class-schedule/auto-schedule', payload)

// --- 选课窗口 (CourseSelectionWindow) API ---

type CreateSelectionWindowSuccessResponse = ApiResponse<number>
type GetSelectionWindowListSuccessResponse = ApiResponse<PageResult<CourseSelectionWindowVO>>
type GetSelectionWindowSuccessResponse = ApiResponse<CourseSelectionWindowVO>
type UpdateSelectionWindowSuccessResponse = ApiResponse<null>
type DeleteSelectionWindowSuccessResponse = ApiResponse<null>
type SelectionWindowStatusSuccessResponse = ApiResponse<null>

// 创建选课窗口
export const createSelectionWindow = async (
  payload: CreateSelectionWindowPayload
): Promise<CreateSelectionWindowSuccessResponse> =>
  apiClient.post('/course-selection-window/create', payload)

// 获取选课窗口列表
export const getSelectionWindowList = async (
  params: CourseSelectionWindowQueryParams
): Promise<GetSelectionWindowListSuccessResponse> =>
  apiClient.get('/course-selection-window/list', { params })

// 获取选课窗口详情
export const getSelectionWindowDetail = async (
  id: number
): Promise<GetSelectionWindowSuccessResponse> => apiClient.get(`/course-selection-window/${id}`)

// 更新选课窗口
export const updateSelectionWindow = async (
  id: number,
  payload: UpdateSelectionWindowPayload
): Promise<UpdateSelectionWindowSuccessResponse> =>
  apiClient.post(`/course-selection-window/${id}/update`, payload)

// 删除选课窗口
export const deleteSelectionWindow = async (
  id: number
): Promise<DeleteSelectionWindowSuccessResponse> =>
  apiClient.post(`/course-selection-window/${id}/delete`)

// 发布选课窗口
export const publishSelectionWindow = async (
  id: number
): Promise<SelectionWindowStatusSuccessResponse> =>
  apiClient.post(`/course-selection-window/${id}/publish`)

// 激活选课窗口
export const activateSelectionWindow = async (
  id: number
): Promise<SelectionWindowStatusSuccessResponse> =>
  apiClient.post(`/course-selection-window/${id}/activate`)

// 关闭选课窗口
export const closeSelectionWindow = async (
  id: number
): Promise<SelectionWindowStatusSuccessResponse> =>
  apiClient.post(`/course-selection-window/${id}/close`)

// 获取当前进行中的选课窗口
export const getActiveSelectionWindows = async (): Promise<
  ApiResponse<CourseSelectionWindowVO[]>
> => apiClient.get('/course-selection-window/active')

// --- 选课 (CourseEnrollment) API ---

type EnrollCourseSuccessResponse = ApiResponse<number>
type DropCourseSuccessResponse = ApiResponse<null>
type GetEnrollmentListSuccessResponse = ApiResponse<PageResult<CourseEnrollmentVO>>
type GetEnrollmentSuccessResponse = ApiResponse<CourseEnrollmentVO>
type GetAvailableTeachingClassListSuccessResponse = ApiResponse<
  PageResult<AvailableTeachingClassVO>
>

// 学生选课
export const enrollCourse = async (
  payload: EnrollCoursePayload
): Promise<EnrollCourseSuccessResponse> => apiClient.post('/course-enrollment/enroll', payload)

// 学生退课
export const dropCourse = async (id: number): Promise<DropCourseSuccessResponse> =>
  apiClient.post(`/course-enrollment/${id}/drop`)

// 查询可选教学班列表（学生视角）
export const getAvailableTeachingClasses = async (
  params: AvailableTeachingClassQueryParams
): Promise<GetAvailableTeachingClassListSuccessResponse> =>
  apiClient.get('/course-enrollment/available', { params })

// 查询我的选课记录（学生视角）
export const getMyEnrollments = async (
  params: CourseEnrollmentQueryParams
): Promise<GetEnrollmentListSuccessResponse> => apiClient.get('/course-enrollment/my', { params })

// 分页查询选课记录（管理员视角）
export const getEnrollmentList = async (
  params: CourseEnrollmentQueryParams
): Promise<GetEnrollmentListSuccessResponse> => apiClient.get('/course-enrollment/list', { params })

// 获取选课记录详情
export const getEnrollmentDetail = async (id: number): Promise<GetEnrollmentSuccessResponse> =>
  apiClient.get(`/course-enrollment/${id}/detail`)

// --- 培养计划 (ProgramCourseRequirement) API ---

type CreateProgramRequirementSuccessResponse = ApiResponse<number>
type GetProgramRequirementListSuccessResponse = ApiResponse<PageResult<ProgramCourseRequirementVO>>
type GetProgramRequirementSuccessResponse = ApiResponse<ProgramCourseRequirementVO>
type UpdateProgramRequirementSuccessResponse = ApiResponse<null>
type DeleteProgramRequirementSuccessResponse = ApiResponse<null>

// 创建培养计划
export const createProgramCourseRequirement = async (
  payload: CreateProgramCourseRequirementPayload
): Promise<CreateProgramRequirementSuccessResponse> =>
  apiClient.post('/program-course-requirement/create', payload)

// 获取培养计划列表
export const getProgramCourseRequirementList = async (
  params: ProgramCourseRequirementQueryParams
): Promise<GetProgramRequirementListSuccessResponse> =>
  apiClient.get('/program-course-requirement/list', { params })

// 获取培养计划详情
export const getProgramCourseRequirementDetail = async (
  id: number
): Promise<GetProgramRequirementSuccessResponse> =>
  apiClient.get(`/program-course-requirement/${id}/detail`)

// 更新培养计划
export const updateProgramCourseRequirement = async (
  id: number,
  payload: UpdateProgramCourseRequirementPayload
): Promise<UpdateProgramRequirementSuccessResponse> =>
  apiClient.post(`/program-course-requirement/${id}/update`, payload)

// 删除培养计划
export const deleteProgramCourseRequirement = async (
  id: number
): Promise<DeleteProgramRequirementSuccessResponse> =>
  apiClient.post(`/program-course-requirement/${id}/delete`)

// --- 文件上传 (File) API ---

import type { FileUploadResponse } from '@/types'

type UploadFileSuccessResponse = ApiResponse<FileUploadResponse>

// 上传文件
export const uploadFile = async (file: File): Promise<UploadFileSuccessResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  return apiClient.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// --- 菜单 (Menu) API ---

type GetCurrentUserMenuSuccessResponse = ApiResponse<MenuVO[]>

// 获取当前用户的菜单树
export const getCurrentUserMenu = async (): Promise<GetCurrentUserMenuSuccessResponse> =>
  apiClient.get('/menu/current')

// --- Dashboard 统计 (Dashboard Statistics) API ---

type GetDashboardOverviewSuccessResponse = ApiResponse<DashboardOverview>
type GetEnrollmentProgressSuccessResponse = ApiResponse<EnrollmentProgress[]>
type GetEnrollmentTrendSuccessResponse = ApiResponse<EnrollmentTrendPoint[]>
type GetPopularCoursesSuccessResponse = ApiResponse<PopularCourse[]>
type GetOrgDistributionSuccessResponse = ApiResponse<OrgDistribution[]>
type GetSystemActivitySuccessResponse = ApiResponse<SystemActivity[]>

// 获取 Dashboard 概览统计
export const getDashboardOverview = async (params?: {
  semesterId?: number
}): Promise<GetDashboardOverviewSuccessResponse> => apiClient.get('/dashboard/overview', { params })

// 获取选课进度
export const getEnrollmentProgress = async (params?: {
  semesterId?: number
  departmentId?: number
  fillRateMin?: number
  fillRateMax?: number
}): Promise<GetEnrollmentProgressSuccessResponse> =>
  apiClient.get('/dashboard/enrollment/progress', { params })

// 获取选课趋势
export const getEnrollmentTrend = async (params?: {
  semesterId?: number
  days?: number
}): Promise<GetEnrollmentTrendSuccessResponse> =>
  apiClient.get('/dashboard/enrollment/trend', { params })

// 获取热门课程
export const getPopularCourses = async (params?: {
  semesterId?: number
  limit?: number
  order?: 'desc' | 'asc'
}): Promise<GetPopularCoursesSuccessResponse> =>
  apiClient.get('/dashboard/course/popular', { params })

// 获取组织分布
export const getOrgDistribution = async (params: {
  dimension: 'department' | 'major' | 'grade'
}): Promise<GetOrgDistributionSuccessResponse> =>
  apiClient.get('/dashboard/org/distribution', { params })

// 获取系统活动
export const getSystemActivity = async (params?: {
  days?: number
}): Promise<GetSystemActivitySuccessResponse> =>
  apiClient.get('/dashboard/activity/recent', { params })
