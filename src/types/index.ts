// --- 通用 & 响应类型 ---

// 这是登录和注册成功后，data 字段的类型
export interface AuthResponseData {
  token: string
  userId: number
  username: string
  role: string
  realName: string
}

// 通用的 API 响应体结构

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// --- 登录 (Login) ---

// 登录接口的请求体 (Payload) 类型
export interface LoginPayload {
  sduId?: string
  password?: string
}

// --- 注册 (Register) ---

// 注册接口的请求体类型
export interface RegisterPayload {
  sduId?: string
  password?: string
  realName?: string
  username?: string
  email: string
}

//修改密码接口请求体类型（changePassword)
export interface ChangePasswordPayload {
  oldPassword?: string
  newPassword?: string
}

//---用户信息界面---
// 用户信息更新请求体类型
export interface UpdateUserInfoPayload {
  username?: string
  realName?: string
  gender?: 0 | 1 | 2 // 0=MALE, 1=FEMALE, 2=UNKNOWN
  birthday?: string
  phone?: string
  email?: string
  avatarUrl?: string
  ethnic?: string
  politicalStatus?: string
  description?: string
}

// 用户信息数据类型
export interface UserInfo {
  sduId?: string
  id: number
  username: string
  realName: string
  gender: 0 | 1 | 2 // 0=MALE, 1=FEMALE, 2=UNKNOWN
  birthday: string
  phone: string
  email: string
  avatarUrl: string
  ethnic: string
  politicalStatus: string
  description: string
  role?: string // 新增：可选角色字段，用于权限判断
}

// 用户资料 (User Profile)
export interface UserProfile {
  username: string
  email: string
  verificationCode: string
  newPassword: string
  avatarUrl: string
  description: string
}

// 用户资料更新请求体类型
export interface UpdateProfilePayload {
  username?: string
  email?: string
  avatarUrl?: string
  description?: string
}

//发送验证码
export interface SendCodePayload {
  email: string
}
//邮箱重置密码
export interface ResetPasswordPayload {
  email: string
  verificationCode: string
  newPassword: string
}

//邮箱验证码绑定
export interface SendEmailBindingCodePayload {
  email: string
}

export interface VerifyEmailCodePayload {
  userId: string
  email: string
  verificationCode: string
}

//课程类型
export type CourseType = 'REQUIRED' | 'LIMITED_ELECTIVE' | 'OPEN_ELECTIVE'
//课程创建参数
export interface CreateCoursePayload {
  code: string // 课程编号 (必需)
  name: string // 课程名称 (必需)
  departmentId?: number // 开课学院ID
  defaultCourseType?: CourseType // 课程类型
  credit?: number // 学分
  totalHours?: number // 总学时
  lectureHours?: number // 理论学时
  labHours?: number // 实验学时
  repeatable?: boolean // 是否可重复修读
  description?: string // 简介
}
//课程编辑参数
export interface updateCoursePayload {
  code: string // 课程编号 (必需)
  name: string // 课程名称 (必需)
  departmentId?: number // 开课学院ID
  defaultCourseType?: CourseType // 课程类型
  credit?: number // 学分
  totalHours?: number // 总学时
  lectureHours?: number // 理论学时
  labHours?: number // 实验学时
  repeatable?: boolean // 是否可重复修读
  description?: string // 简介
}

//课程状态
export type CourseStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
//课程视图对象
export interface CourseVO {
  id: number
  code: string
  name: string
  departmentId: number
  departmentName?: string // 后端返回部门名字，如果没有则显示 ID
  defaultCourseType: string
  credit: number
  totalHours: number
  lectureHours: number
  labHours: number
  repeatable: boolean
  description?: string
  status: CourseStatus
  createTime?: string | { dateTime: string }
  updateTime?: string | { dateTime: string }
}
//分页响应通用泛型
export interface PageResult<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
  pages: number
}
//查询参数类型
export interface CourseQueryParams {
  code?: string
  name?: string
  departmentId?: number
  defaultCourseType?: string
  status?: string
  pageNum: number
  pageSize: number
}

//创建部门参数
export interface CreateDepartmentPayload {
  parentId?: number // 上级部门ID (可选，0或空表示顶级)
  code: string // 部门编码 (必需)
  name: string // 部门名称 (必需)
  shortName?: string // 简称
  description?: string // 描述
}
//部门状态枚举
export type DepartmentStatus = 'ACTIVE' | 'DISABLED'
//部门视图对象
export interface DepartmentVO {
  id: number
  parentId: number
  code: string
  name: string
  shortName?: string
  description?: string
  status: DepartmentStatus
  createTime?: string | { dateTime: string }
  updateTime?: string | { dateTime: string }
}
//部门查询参数
export interface DepartmentQueryParams {
  pageNum: number
  pageSize: number
  code?: string
  name?: string
  parentId?: number
  status?: string // ACTIVE or DISABLE
}
//更新部门参数
export interface UpdateDepartmentPayload {
  parentId?: number
  code?: string
  name?: string
  shortName?: string
  description?: string
}

// --- 学期 (Semester) ---

// 创建学期请求参数
export interface CreateSemesterPayload {
  academicYear: string // 学年描述，例如 2023-2024
  termOrder: number // 学期序号，1=秋季，2=春季
  name: string // 学期名称
  startDate: string // 开始日期 YYYY-MM-DD
  endDate: string // 结束日期 YYYY-MM-DD
  weekCount?: number // 周数
}

// 更新学期请求参数
export type UpdateSemesterPayload = Partial<CreateSemesterPayload>

// 学期视图对象
export interface SemesterVO {
  id: number
  academicYear: string
  termOrder: number
  name: string
  startDate: string
  endDate: string
  weekCount?: number
  currentTerm: boolean // 是否为当前学期
  createTime?: string
  updateTime?: string
}

// 学期查询参数
export interface SemesterQueryParams {
  pageNum: number
  pageSize: number
  academicYear?: string
  termOrder?: number
  name?: string
}

// --- 通用用户状态 ---
export type UserStatus = 'ACTIVE' | 'DISABLED'

// --- 性别枚举 ---
export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN'

// --- 学生 (Student) ---

// 学生状态枚举
export type StudentStatus = 'ACTIVE' | 'DISABLED'

// 学生视图对象
export interface StudentVO {
  userId: number
  username?: string
  realName?: string
  gender?: Gender
  birthday?: string
  phone?: string
  email?: string
  avatarUrl?: string
  ethnic?: string
  politicalStatus?: string
  sduId?: string
  userStatus?: UserStatus
  description?: string
  studentId: number
  departmentId?: number
  majorId?: number
  administrativeClassId?: number
  entryYear?: number
  gradeLevel?: number
  studentStatus?: StudentStatus
}

// 学生查询参数
export interface StudentQueryParams {
  pageNum: number
  pageSize: number
  sduId?: string
  realName?: string
  username?: string
  status?: UserStatus
  departmentId?: number
  majorId?: number
  administrativeClassId?: number
  entryYear?: number
  gradeLevel?: number
}

// 更新学生学业信息请求
export interface UpdateStudentInfoRequest {
  departmentId: number
  majorId: number
  administrativeClassId?: number
  entryYear?: number
  gradeLevel?: number
}

// --- 教师 (Teacher) ---

// 教师状态枚举
export type TeacherStatus = 'ACTIVE' | 'DISABLED'

// 教师视图对象
export interface TeacherVO {
  userId: number
  username?: string
  realName?: string
  gender?: Gender
  birthday?: string
  phone?: string
  email?: string
  avatarUrl?: string
  ethnic?: string
  politicalStatus?: string
  sduId?: string
  userStatus?: UserStatus
  description?: string
  teacherId: number
  departmentId?: number
  title?: string
  teacherStatus?: TeacherStatus
}

// 教师查询参数
export interface TeacherQueryParams {
  pageNum: number
  pageSize: number
  sduId?: string
  realName?: string
  username?: string
  status?: UserStatus
  departmentId?: number
  title?: string
}

// 更新教师工作信息请求
export interface UpdateTeacherInfoRequest {
  departmentId: number
  title?: string
}

// --- 家庭成员 (FamilyMember) ---

// 家庭成员关系枚举
export type FamilyRelationship =
  | 'FATHER'
  | 'MOTHER'
  | 'SPOUSE'
  | 'SON'
  | 'DAUGHTER'
  | 'BROTHER'
  | 'SISTER'
  | 'GRANDFATHER'
  | 'GRANDMOTHER'
  | 'OTHER'

// 家庭成员视图对象
export interface FamilyMemberVO {
  id: number
  userId: number
  userRealName?: string
  name: string
  relationship: FamilyRelationship
  gender: Gender
  phone: string
  createTime?: string
  updateTime?: string
}

// 家庭成员查询参数
export interface FamilyMemberQueryParams {
  pageNum: number
  pageSize: number
  userId?: number
  name?: string
}

// 创建家庭成员请求
export interface CreateFamilyMemberRequest {
  userId: number
  name: string
  relationship: FamilyRelationship
  gender: Gender
  phone: string
}

// 更新家庭成员请求
export interface UpdateFamilyMemberRequest {
  name?: string
  relationship?: FamilyRelationship
  gender?: Gender
  phone?: string
}

// --- 专业 (Major) ---

// 学位等级枚举
export type DegreeLevel = 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTOR'

// 专业状态枚举
export type MajorStatus = 'ACTIVE' | 'DISABLED'

// 创建专业请求参数
export interface CreateMajorPayload {
  departmentId: number // 所属学院/部门 ID
  code: string // 专业编码
  name: string // 专业名称
  degreeLevel: DegreeLevel // 学位等级
  durationYears?: number // 学制（年）
  remark?: string // 备注
}

// 更新专业请求参数
export type UpdateMajorPayload = Partial<CreateMajorPayload>

// 专业视图对象
export interface MajorVO {
  id: number
  departmentId: number
  departmentName?: string // 所属学院/部门名称
  code: string
  name: string
  degreeLevel: DegreeLevel
  durationYears?: number
  status: MajorStatus
  remark?: string
  createTime?: string
  updateTime?: string
}

// 专业查询参数
export interface MajorQueryParams {
  pageNum: number
  pageSize: number
  departmentId?: number
  code?: string
  name?: string
  degreeLevel?: DegreeLevel
  status?: MajorStatus
}

// --- 权限 (Permission) ---

// 权限类型枚举
export type PermissionType = 'DIRECTORY' | 'MENU'

// 权限状态枚举
export type PermissionStatus = 'ACTIVE' | 'DISABLED'

// 权限视图对象
export interface PermissionVO {
  id: number
  parentId: number
  name: string
  key: string
  type: PermissionType
  menuUrl: string
  status: PermissionStatus
  createTime?: string
  updateTime?: string
}

// 权限查询参数
export interface PermissionQueryParams {
  pageNum: number
  pageSize: number
  name?: string
  key?: string
  type?: PermissionType
  status?: PermissionStatus
}

// --- 角色 (Role) ---

// 角色状态枚举
export type RoleStatus = 'ACTIVE' | 'DISABLED'

// 角色视图对象
export interface RoleVO {
  id: number
  name: string
  key: string
  status: RoleStatus
  description: string
  createTime?: string
  updateTime?: string
}

// 角色查询参数
export interface RoleQueryParams {
  pageNum: number
  pageSize: number
  name?: string
  key?: string
  status?: RoleStatus
}

// 创建角色请求
export interface CreateRolePayload {
  name: string // 角色名称 (必需，最大 50 字符)
  key: string // 角色标识 (必需，最大 50 字符)
  description?: string // 角色描述 (最大 200 字符)
}

// 更新角色请求
export type UpdateRolePayload = Partial<CreateRolePayload>

// 分配权限请求
export interface AssignPermissionsPayload {
  permissionIds: number[] // 权限 ID 列表
}

// 分配用户角色请求
export interface AssignUserRolePayload {
  roleId: number // 角色 ID (必需)
}

// --- 行政班 (AdministrativeClass) ---

// 行政班状态枚举
export type AdministrativeClassStatus = 'ACTIVE' | 'DISABLED'

// 行政班视图对象
export interface AdministrativeClassVO {
  id: number
  majorId?: number
  majorName?: string
  code: string
  name: string
  entryYear?: number
  counselorTeacherId?: number
  counselorName?: string
  studentCount?: number
  status: AdministrativeClassStatus
  createTime?: string
  updateTime?: string
}

// 行政班查询参数
export interface AdministrativeClassQueryParams {
  pageNum: number
  pageSize: number
  majorId?: number
  code?: string
  name?: string
  entryYear?: number
  counselorTeacherId?: number
  status?: AdministrativeClassStatus
}

// 创建行政班请求
export interface CreateAdministrativeClassPayload {
  majorId: number // 所属专业 ID（必填）
  code: string // 班级编码（必填）
  name: string // 班级名称（必填）
  entryYear?: number // 入学年份
  counselorTeacherId?: number // 班主任/辅导员教师 ID
}

// 更新行政班请求
export type UpdateAdministrativeClassPayload = Partial<CreateAdministrativeClassPayload>

// 批量分班请求
export interface AssignStudentsPayload {
  administrativeClassId: number // 目标行政班 ID
  studentIds: number[] // 学生 ID 列表
}

// 批量分班结果
export interface AssignStudentsResultVO {
  successCount: number
  failureCount: number
  failedStudentIds?: number[]
}

// 随机分班请求
export interface RandomAssignStudentsPayload {
  administrativeClassIds: number[] // 目标行政班 ID 列表
  majorId?: number // 专业 ID（可选，用于筛选学生）
  entryYear?: number // 入学年份（可选，用于筛选学生）
  gradeLevel?: number // 年级（可选，用于筛选学生）
}

// --- 开课 (CourseOffering) ---

// 开课状态枚举
export type CourseOfferingStatus =
  | 'DRAFT'
  | 'SCHEDULING'
  | 'ENROLLMENT_OPEN'
  | 'ENROLLMENT_CLOSED'
  | 'ARCHIVED'

// 教师信息
export interface TeacherInfo {
  teacherId: number
  teacherName?: string
  employeeId?: string
  role?: string
}

// 开课视图对象
export interface CourseOfferingVO {
  id: number
  courseId: number
  courseCode?: string
  courseName?: string
  credit?: number
  totalHours?: number
  lectureHours?: number
  labHours?: number
  semesterId: number
  semesterName?: string
  academicYear?: string
  termOrder?: number
  courseType: CourseType
  capacity?: number
  status: CourseOfferingStatus
  targetGradeLevel?: number
  allowRetake?: boolean
  remark?: string
  teachers?: TeacherInfo[]
  createTime?: string
  updateTime?: string
}

// 开课查询参数
export interface CourseOfferingQueryParams {
  pageNum: number
  pageSize: number
  courseId?: number
  semesterId?: number
  courseType?: CourseType
  status?: CourseOfferingStatus
  courseName?: string
  courseCode?: string
}

// 创建开课请求
export interface CreateCourseOfferingPayload {
  courseId: number // 课程 ID（必填）
  semesterId: number // 学期 ID（必填）
  courseType: CourseType // 课程类型（必填）
  capacity?: number // 容量
  targetGradeLevel?: number // 面向年级
  allowRetake?: boolean // 是否允许重修
  remark?: string // 备注
}

// 更新开课请求
export type UpdateCourseOfferingPayload = Partial<CreateCourseOfferingPayload>

// 教师分配
export interface TeacherAssignment {
  teacherId: number
  role?: string
}

// --- 教学班 (TeachingClass) ---

// 教学班状态枚举
export type TeachingClassStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'

// 教学班视图对象
export interface TeachingClassVO {
  id: number
  courseOfferingId: number
  code: string
  name: string
  teacherId?: number
  teacherName?: string
  teacherEmployeeId?: string
  location?: string
  capacity?: number
  enrolledCount?: number
  allowOverload?: boolean
  status: TeachingClassStatus
  courseId?: number
  courseCode?: string
  courseName?: string
  credit?: number
  semesterId?: number
  semesterName?: string
  academicYear?: string
  termOrder?: number
  createTime?: string
  updateTime?: string
}

// 教学班查询参数
export interface TeachingClassQueryParams {
  pageNum: number
  pageSize: number
  courseOfferingId?: number
  semesterId?: number
  courseId?: number
  teacherId?: number
  status?: TeachingClassStatus
  code?: string
  name?: string
}

// 创建教学班请求
export interface CreateTeachingClassPayload {
  courseOfferingId: number // 课程开设 ID（必填）
  code: string // 教学班编号（必填）
  name: string // 教学班名称（必填）
  teacherId?: number // 任课教师 ID
  location?: string // 上课地点
  capacity?: number // 容量
  allowOverload?: boolean // 是否允许超员
}

// 更新教学班请求
export type UpdateTeachingClassPayload = Partial<
  Omit<CreateTeachingClassPayload, 'courseOfferingId'>
>

// --- 排课 (TeachingClassSchedule) ---

// 排课视图对象
export interface TeachingClassScheduleVO {
  id: number
  teachingClassId: number
  weekDay: number // 星期（1-7）
  startWeek: number // 起始周
  endWeek: number // 结束周
  startSection: number // 起始节次
  endSection: number // 结束节次
  classroom?: string // 上课教室
  remark?: string // 备注
  createTime?: string
  updateTime?: string
}

// 排课查询参数
export interface TeachingClassScheduleQueryParams {
  pageNum: number
  pageSize: number
  teachingClassId?: number
  weekDay?: number
  classroom?: string
}

// 创建排课请求
export interface CreateSchedulePayload {
  weekDay: number // 星期（1-7，必填）
  startWeek: number // 起始周（必填）
  endWeek: number // 结束周（必填）
  startSection: number // 起始节次（必填）
  endSection: number // 结束节次（必填）
  classroom?: string // 上课教室
  remark?: string // 备注
}

// 更新排课请求
export type UpdateSchedulePayload = Partial<CreateSchedulePayload>

// 自动排课结果
export interface AutoScheduleResultVO {
  successCount: number
  failureCount: number
  scheduledClasses?: ScheduledClassInfo[]
  failures?: FailureInfo[]
}

export interface ScheduledClassInfo {
  teachingClassId: number
  teachingClassName?: string
  courseName?: string
  teacherName?: string
  schedules?: TeachingClassScheduleVO[]
}

export interface FailureInfo {
  teachingClassId: number
  teachingClassName?: string
  courseName?: string
  teacherName?: string
  reason?: string
}

// --- 选课窗口 (CourseSelectionWindow) ---

// 选课窗口状态枚举
export type CourseSelectionWindowStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED'

// 专业信息（选课窗口用）
export interface MajorInfo {
  majorId: number
  majorName?: string
}

// 行政班信息（选课窗口用）
export interface AdminClassInfo {
  administrativeClassId: number
  administrativeClassName?: string
}

// 选课窗口视图对象
export interface CourseSelectionWindowVO {
  id: number
  semesterId: number
  semesterName?: string
  academicYear?: string
  termOrder?: number
  name: string
  courseType?: CourseType
  startTime: string
  endTime: string
  allowAdminAssignment?: boolean
  status: CourseSelectionWindowStatus
  publishedBy?: number
  publishedByName?: string
  remark?: string
  majors?: MajorInfo[]
  administrativeClasses?: AdminClassInfo[]
  createTime?: string
  updateTime?: string
}

// 选课窗口查询参数
export interface CourseSelectionWindowQueryParams {
  pageNum: number
  pageSize: number
  semesterId?: number
  name?: string
  courseType?: CourseType
  status?: CourseSelectionWindowStatus
}

// 创建选课窗口请求
export interface CreateSelectionWindowPayload {
  semesterId: number // 学期 ID（必填）
  name: string // 窗口名称（必填）
  courseType?: CourseType // 面向课程类型
  startTime: string // 开始时间（必填）
  endTime: string // 结束时间（必填）
  allowAdminAssignment?: boolean // 是否允许教务预选
  remark?: string // 备注
  majorIds?: number[] // 限定专业 ID 列表
  administrativeClassIds?: number[] // 限定行政班 ID 列表
}

// 更新选课窗口请求
export type UpdateSelectionWindowPayload = Partial<CreateSelectionWindowPayload>

// --- 选课 (CourseEnrollment) ---

// 选课状态枚举
export type CourseEnrollmentStatus = 'SELECTED' | 'WAITLISTED' | 'DROPPED' | 'COMPLETED'

// 选课记录视图对象
export interface CourseEnrollmentVO {
  id: number
  teachingClassId: number
  studentId: number
  status: CourseEnrollmentStatus
  selectedAt?: string
  droppedAt?: string
  assignedByAdmin?: boolean
  createTime?: string
  updateTime?: string
  teachingClassCode?: string
  teachingClassName?: string
  location?: string
  courseId?: number
  courseCode?: string
  courseName?: string
  credit?: number
  semesterId?: number
  semesterName?: string
  academicYear?: string
  termOrder?: number
  teacherId?: number
  teacherName?: string
  teacherEmployeeId?: string
  studentName?: string
  studentNumber?: string
}

// 选课查询参数
export interface CourseEnrollmentQueryParams {
  pageNum: number
  pageSize: number
  teachingClassId?: number
  studentId?: number
  courseId?: number
  semesterId?: number
  status?: CourseEnrollmentStatus
}

// 可选教学班视图对象
export interface AvailableTeachingClassVO {
  id: number
  code: string
  name: string
  location?: string
  capacity?: number
  enrolledCount?: number
  allowOverload?: boolean
  status: TeachingClassStatus
  courseId: number
  courseCode?: string
  courseName?: string
  credit?: number
  totalHours?: number
  lectureHours?: number
  labHours?: number
  courseType: CourseType
  description?: string
  semesterId: number
  semesterName?: string
  academicYear?: string
  termOrder?: number
  teacherId?: number
  teacherName?: string
  teacherEmployeeId?: string
  schedules?: ScheduleInfo[]
}

// 排课信息（用于可选教学班展示）
export interface ScheduleInfo {
  weekDay: number
  startWeek: number
  endWeek: number
  startSection: number
  endSection: number
  classroom?: string
  remark?: string
}

// 可选教学班查询参数
export interface AvailableTeachingClassQueryParams {
  pageNum: number
  pageSize: number
  semesterId?: number
  courseId?: number
  courseName?: string
  courseType?: CourseType
  teacherName?: string
  onlyAvailable?: boolean
}

// 选课请求
export interface EnrollCoursePayload {
  teachingClassId: number // 教学班 ID（必填）
}

// --- 培养计划 (ProgramCourseRequirement) ---

// 培养计划视图对象
export interface ProgramCourseRequirementVO {
  id: number
  courseId: number
  courseName?: string
  majorId?: number
  majorName?: string
  administrativeClassId?: number
  administrativeClassName?: string
  gradeLevel?: number
  recommendedSemesterId?: number
  recommendedSemesterName?: string
  courseType: CourseType
  mandatory?: boolean
  autoAssignTeachingClass?: boolean
  remark?: string
  createTime?: string
  updateTime?: string
}

// 培养计划查询参数
export interface ProgramCourseRequirementQueryParams {
  pageNum: number
  pageSize: number
  courseId?: number
  majorId?: number
  administrativeClassId?: number
  gradeLevel?: number
  courseType?: CourseType
  mandatory?: boolean
}

// 创建培养计划请求
export interface CreateProgramCourseRequirementPayload {
  courseId: number // 课程 ID（必填）
  majorId?: number // 面向专业 ID
  administrativeClassId?: number // 行政班 ID
  gradeLevel?: number // 面向年级（1-10）
  recommendedSemesterId?: number // 推荐修读学期 ID
  courseType: CourseType // 课程类型（必填）
  mandatory?: boolean // 是否强制选课
  autoAssignTeachingClass?: boolean // 是否自动生成教学班
  remark?: string // 备注
}

// 更新培养计划请求
export type UpdateProgramCourseRequirementPayload = Partial<CreateProgramCourseRequirementPayload>

// --- 文件上传 (File) ---

// 文件上传响应
export interface FileUploadResponse {
  id: number // 文件上传记录 ID
  fileName: string // 原始文件名
  fileKey: string // 存储在 R2 的文件键（路径）
  fileSize: number // 文件大小（字节）
  contentType: string // 文件 MIME 类型
  fileUrl: string // 文件访问 URL
  uploadTime: string // 上传时间（ISO 8601 格式）
}

// --- 菜单 (Menu) ---

// 菜单类型枚举（复用 PermissionType）
export type MenuType = PermissionType // 'DIRECTORY' | 'MENU'

// 菜单项视图对象
export interface MenuVO {
  id: number
  parentId: number | null
  name: string
  key: string
  type: MenuType
  menuUrl: string | null
  icon: string
  sort: number
  children: MenuVO[]
}
