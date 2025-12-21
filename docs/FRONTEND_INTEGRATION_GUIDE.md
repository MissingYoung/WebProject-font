# 前端对接指南（选课闭环 + 课程表）

本文档面向前端：按 `docs/CORE_BUSINESS_LOGIC.md` 的链路，说明需要调用哪些后端接口、如何渲染与如何做“不可选/错误处理”，避免前端本地拼规则。

## 0. 通用约定

### 0.1 鉴权

所有需要登录的接口都需要在 Header 中携带：

`Authorization: Bearer {token}`

### 0.2 统一响应结构（Result）

```ts
type Result<T> = {
  code: number;        // 200 成功；非 200 表示业务/鉴权错误
  message: string;     // 人类可读提示
  data: T | null;
  bizCode?: string;    // 稳定业务错误码（失败时可能有；前端不要依赖 message 文本做逻辑）
}
```

> 前端建议：用 `bizCode` 做分支判断；`message` 只用于 toast/提示。

---

## 1. 登录 & 获取“学业画像”（必需）

### 1.1 登录

`POST /auth/login`

成功返回 `token`。

### 1.2 当前用户（学业画像）

`GET /auth/me`

返回结构（示意）：

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "role": "student",
    "user": { "id": 160, "username": "xx", "realName": "张三", "sduId": "2024xxxx", "status": "ACTIVE" },
    "student": { "id": 1, "administrativeClassId": 4, "majorId": 21, "gradeLevel": 1, "departmentId": 13 },
    "teacher": null
  }
}
```

用途：
- 选课窗口判定需要：`student.administrativeClassId + student.majorId`
- 培养计划优先级需要：`student.administrativeClassId + student.majorId + student.gradeLevel`

> 兼容说明：原 `GET /auth/me` 的个人资料接口迁移到 `GET /auth/me/profile`。

---

## 2. 选课页面（学生端）链路（推荐顺序）

### 2.1 获取当前学期（推荐）

`GET /semester/current`

拿到 `semesterId`（同时可用于页面顶部展示学期名/学年/周数）。

### 2.2 判断“对我是否开放选课窗口”（必需）

`GET /course-selection-window/me/active?semesterId={id}&courseType={REQUIRED|LIMITED_ELECTIVE|OPEN_ELECTIVE}`

返回：

```json
{
  "code": 200,
  "data": { "open": true, "reason": null, "windows": [ { "id": 2, "name": "...", "startTime": "...", "endTime": "..."} ] }
}
```

规则：
- 行政班优先命中窗口（仅当窗口配置了行政班关联时才会命中）
- 若行政班没有命中，则专业兜底（但**不会**命中“带行政班限制”的窗口）
- 若仍没命中，则使用“全体开放窗口”（既无行政班限制、也无专业限制）

前端建议：
- `open=false` 时：直接提示并禁用“选课/提交”入口；也可仍展示课程列表但 `canEnroll=false`。

### 2.3 获取可选课程（教学班列表）

`GET /course-enrollment/available`

查询参数（均可选）：
- `semesterId`
- `courseType`
- `courseName`
- `courseCode`
- `teacherName`
- `departmentId`
- `onlyAvailable`
- `pageNum/pageSize`

返回的 `records[]`（关键字段）：
- 基本字段：`id/code/name/location/capacity/enrolledCount/allowOverload/isFull/isEnrolled`
- **业务标记（后端已计算，前端直接用）**
  - 培养计划：`isRecommended/isMandatory/planSource(ADMIN_CLASS|MAJOR|GLOBAL)`
  - 行政班限制（可见但不可选）：`adminClassRestricted/forMyAdministrativeClass`
  - 选课窗口：`inSelectionWindow/selectionWindowId`
  - 交互控制：`canEnroll/blockReason(WINDOW_CLOSED|FULL|NOT_ELIGIBLE|ALREADY_SELECTED|TIME_CONFLICT)`

前端渲染建议：
- 标签/排序：`isMandatory`、`isRecommended`、`forMyAdministrativeClass` 可作为标签/排序优先级。
- 选课按钮：直接使用 `canEnroll` 决定 enable/disable；禁用时用 `blockReason` 显示原因。

> 说明：行政班限制在学生侧是“可见但不可选”，所以列表不会过滤掉不符合的教学班，只会把 `canEnroll=false`。

### 2.4 提交选课

`POST /course-enrollment/enroll`

请求：
```json
{ "teachingClassId": 123 }
```

失败时请用 `bizCode` 分支处理（典型）：
- `ENROLLMENT_WINDOW_CLOSED`：窗口不开放
- `ENROLLMENT_NOT_ELIGIBLE`：行政班不符合（可见但不可选）
- `ENROLLMENT_FULL`：满员且不允许超额
- `ENROLLMENT_ALREADY_SELECTED`：已选该教学班
- `ENROLLMENT_COURSE_DUPLICATE`：同一学期同一课程已选其它班
- `ENROLLMENT_TIME_CONFLICT`：与当前课程表时间冲突

---

## 3. 退课（学生端）

`POST /course-enrollment/{enrollmentId}/drop`

失败时 `bizCode`（典型）：
- `ENROLLMENT_MANDATORY_CANNOT_DROP`：培养计划必修课不可退

> 注意：是否“必修不可退”来自培养计划（行政班优先、专业兜底），不再依赖 `assignedByAdmin`。

---

## 4. 我的选课（含排课明细）

### 4.1 我的选课列表（分页）

`GET /course-enrollment/my?includeSchedules=true&semesterId={id}&status={SELECTED|...}`

当 `includeSchedules=true` 时，每条 `CourseEnrollmentVO` 附带：
- `schedules: TeachingClassScheduleVO[]`

适用场景：
- “我的选课”页面：同时展示授课信息 + 时间段（无需额外查排课）

---

## 5. 课程表（学生/教师都需要，强推荐）

### 5.1 统一课程表接口（推荐使用）

`GET /timetable/me?semesterId={id}`

返回：
- 学期信息：`semesterId/semesterName/academicYear/termOrder/weekCount`
- 课表项列表：`items: ScheduleItemVO[]`（已按排课展开）

适用场景：
- 学生/教师课程表页：直接画周视图/日视图
- 与选课冲突提示：前端一般无需再算冲突（后端选课接口已校验并返回 `ENROLLMENT_TIME_CONFLICT`）

### 5.2 兼容接口（仍可用）

- 学生：`GET /student/me/schedule?semesterId={id}`
- 教师：`GET /teacher/me/schedule?semesterId={id}`

> 这两个接口返回 `ScheduleItemVO[]`，结构与 `/timetable/me` 的 items 一致，但不包含学期元数据。

---

## 6. 培养计划 → 推荐课表 / 必修完成进度

`GET /program-course-requirement/me/progress?semesterId={id}`

返回（示意）：
- `mandatoryTotal/mandatorySelected/mandatoryCompleted`
- `items[]`：每门课的
  - `isMandatory/isRecommended/planSource`
  - `enrollmentStatus`（SELECTED/COMPLETED/空）
  - `teachingClassId`（若已选/已修）

前端渲染建议：
- 推荐课表：筛 `isRecommended=true` 或按 `recommended` 排序展示
- 必修进度：基于 `mandatoryTotal/mandatorySelected/mandatoryCompleted` 渲染进度条；列表展示每门课当前状态

---

## 7. 管理端补充说明（行政班限制维护）

教学班“行政班限制”维护接口：
- `POST /teaching-class/{id}/admin-classes/assign`
- `GET /teaching-class/{id}/admin-classes`

> 学生侧逻辑是“可见但不可选”，因此管理员侧配置后，学生能看到该教学班，但若 `forMyAdministrativeClass=false` 则按钮会禁用。

