# Dashboard 统计接口 - 后端开发文档

> 版本：v1.0
> 更新日期：2025-12-19
> 项目：教务管理系统
> 技术栈：Spring Boot 3.5.7 + MyBatis Plus + Sa-Token

---

## 1. 概述

本文档定义 Dashboard 统计功能所需的后端接口规范，用于支持前端展示教务系统的核心数据指标和可视化图表。

### 1.1 设计原则

- **性能优先**：使用 Redis 缓存聚合数据，减少实时计算压力
- **权限分级**：管理员看全局数据，教师看所属部门，学生看有限指标
- **统一响应**：所有接口返回 `ApiResponse<T>` 格式
- **可扩展性**：接口支持按学期、部门等维度筛选

---

## 2. 接口清单

### 2.1 概览统计

**接口路径**：`GET /dashboard/overview`

**功能说明**：获取系统核心 KPI 指标

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| semesterId | Integer | 否 | 学期ID，默认当前学期 |

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalStudents": 1200,
    "activeStudents": 1150,
    "disabledStudents": 50,
    "totalTeachers": 85,
    "activeTeachers": 82,
    "disabledTeachers": 3,
    "totalCourses": 200,
    "activeCourses": 150,
    "inactiveCourses": 30,
    "archivedCourses": 20,
    "currentEnrollments": 3450,
    "waitlistCount": 120,
    "totalDepartments": 10,
    "totalMajors": 35
  }
}
```

**数据获取逻辑**：
```sql
-- 学生统计
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN user_status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN user_status = 'DISABLED' THEN 1 ELSE 0 END) as disabled
FROM user u
INNER JOIN student s ON u.id = s.user_id
WHERE u.deleted = 0;

-- 教师统计（同上）

-- 课程统计
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive,
  SUM(CASE WHEN status = 'ARCHIVED' THEN 1 ELSE 0 END) as archived
FROM course
WHERE deleted = 0;

-- 选课统计（需要指定学期）
SELECT
  COUNT(*) as enrollments,
  SUM(CASE WHEN status = 'WAITLISTED' THEN 1 ELSE 0 END) as waitlist
FROM course_enrollment ce
INNER JOIN teaching_class tc ON ce.teaching_class_id = tc.id
INNER JOIN course_offering co ON tc.course_offering_id = co.id
WHERE co.semester_id = ? AND ce.deleted = 0;
```

**缓存策略**：
- Key: `dashboard:overview:{semesterId}`
- TTL: 10 分钟
- 失效时机：学生/教师/课程状态变更时主动清除

---

### 2.2 选课进度

**接口路径**：`GET /dashboard/enrollment/progress`

**功能说明**：获取当前学期各课程开设的选课进度（容量、已选、候补、填充率）

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| semesterId | Integer | 否 | 学期ID，默认当前学期 |
| departmentId | Integer | 否 | 部门ID，用于筛选 |
| fillRateMin | Double | 否 | 最小填充率（0.0-1.0）|
| fillRateMax | Double | 否 | 最大填充率（0.0-1.0）|

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "offeringId": 101,
      "courseId": 50,
      "courseCode": "CS101",
      "courseName": "数据结构",
      "departmentName": "计算机学院",
      "totalCapacity": 200,
      "enrolled": 185,
      "waitlisted": 15,
      "fillRate": 0.925
    },
    {
      "offeringId": 102,
      "courseId": 51,
      "courseCode": "CS102",
      "courseName": "算法设计",
      "departmentName": "计算机学院",
      "totalCapacity": 150,
      "enrolled": 60,
      "waitlisted": 0,
      "fillRate": 0.4
    }
  ]
}
```

**数据获取逻辑**：
```sql
SELECT
  co.id as offering_id,
  c.id as course_id,
  c.code as course_code,
  c.name as course_name,
  d.name as department_name,
  COALESCE(SUM(tc.capacity), 0) as total_capacity,
  COALESCE(COUNT(CASE WHEN ce.status IN ('ENROLLED', 'COMPLETED') THEN 1 END), 0) as enrolled,
  COALESCE(COUNT(CASE WHEN ce.status = 'WAITLISTED' THEN 1 END), 0) as waitlisted,
  CASE
    WHEN COALESCE(SUM(tc.capacity), 0) > 0
    THEN COALESCE(COUNT(CASE WHEN ce.status IN ('ENROLLED', 'COMPLETED') THEN 1 END), 0) * 1.0 / SUM(tc.capacity)
    ELSE 0
  END as fill_rate
FROM course_offering co
INNER JOIN course c ON co.course_id = c.id
LEFT JOIN department d ON c.department_id = d.id
LEFT JOIN teaching_class tc ON tc.course_offering_id = co.id AND tc.deleted = 0
LEFT JOIN course_enrollment ce ON ce.teaching_class_id = tc.id AND ce.deleted = 0
WHERE co.semester_id = ?
  AND co.deleted = 0
  AND (:departmentId IS NULL OR c.department_id = :departmentId)
GROUP BY co.id, c.id, c.code, c.name, d.name
HAVING (:fillRateMin IS NULL OR fill_rate >= :fillRateMin)
   AND (:fillRateMax IS NULL OR fill_rate <= :fillRateMax)
ORDER BY fill_rate DESC;
```

**缓存策略**：
- Key: `dashboard:enrollment:progress:{semesterId}:{departmentId}`
- TTL: 5 分钟
- 失效时机：学生选课/退课时主动清除

---

### 2.3 选课趋势

**接口路径**：`GET /dashboard/enrollment/trend`

**功能说明**：获取指定时间范围内的每日选课/退课趋势数据

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| semesterId | Integer | 否 | 学期ID，默认当前学期 |
| days | Integer | 否 | 查询天数，默认30天 |

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "date": "2025-12-01",
      "enrollCount": 145,
      "dropCount": 12
    },
    {
      "date": "2025-12-02",
      "enrollCount": 230,
      "dropCount": 8
    }
  ]
}
```

**数据获取逻辑**：
```sql
SELECT
  DATE(create_time) as date,
  COUNT(CASE WHEN status IN ('ENROLLED', 'WAITLISTED') THEN 1 END) as enroll_count,
  COUNT(CASE WHEN status = 'DROPPED' THEN 1 END) as drop_count
FROM course_enrollment ce
INNER JOIN teaching_class tc ON ce.teaching_class_id = tc.id
INNER JOIN course_offering co ON tc.course_offering_id = co.id
WHERE co.semester_id = ?
  AND ce.create_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
  AND ce.deleted = 0
GROUP BY DATE(create_time)
ORDER BY date ASC;
```

**缓存策略**：
- Key: `dashboard:enrollment:trend:{semesterId}:{days}`
- TTL: 15 分钟
- 失效时机：每次选课/退课后延迟失效（避免频繁清除）

---

### 2.4 热门课程

**接口路径**：`GET /dashboard/course/popular`

**功能说明**：获取选课人数最多的 Top N 课程

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| semesterId | Integer | 否 | 学期ID，默认当前学期 |
| limit | Integer | 否 | 返回数量，默认10 |
| order | String | 否 | 排序方式：`desc`（降序）或 `asc`（升序），默认 `desc` |

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "courseId": 50,
      "courseCode": "CS101",
      "courseName": "人工智能导论",
      "departmentName": "计算机学院",
      "enrollmentCount": 450,
      "waitlistCount": 80
    },
    {
      "courseId": 51,
      "courseCode": "BUS201",
      "courseName": "市场营销",
      "departmentName": "商学院",
      "enrollmentCount": 380,
      "waitlistCount": 25
    }
  ]
}
```

**数据获取逻辑**：
```sql
SELECT
  c.id as course_id,
  c.code as course_code,
  c.name as course_name,
  d.name as department_name,
  COUNT(CASE WHEN ce.status IN ('ENROLLED', 'COMPLETED') THEN 1 END) as enrollment_count,
  COUNT(CASE WHEN ce.status = 'WAITLISTED' THEN 1 END) as waitlist_count
FROM course c
INNER JOIN course_offering co ON co.course_id = c.id
LEFT JOIN department d ON c.department_id = d.id
INNER JOIN teaching_class tc ON tc.course_offering_id = co.id
LEFT JOIN course_enrollment ce ON ce.teaching_class_id = tc.id AND ce.deleted = 0
WHERE co.semester_id = ?
  AND co.deleted = 0
  AND tc.deleted = 0
GROUP BY c.id, c.code, c.name, d.name
ORDER BY enrollment_count DESC
LIMIT ?;
```

**缓存策略**：
- Key: `dashboard:course:popular:{semesterId}:{limit}:{order}`
- TTL: 10 分钟

---

### 2.5 组织分布

**接口路径**：`GET /dashboard/org/distribution`

**功能说明**：按指定维度（部门/专业/年级）统计学生和教师分布

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dimension | String | 是 | 统计维度：`department`（部门）、`major`（专业）、`grade`（年级）|

**响应示例（按部门）**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "label": "计算机学院",
      "studentCount": 450,
      "teacherCount": 25
    },
    {
      "id": 2,
      "label": "商学院",
      "studentCount": 380,
      "teacherCount": 20
    }
  ]
}
```

**响应示例（按年级）**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "label": "一年级",
      "studentCount": 350,
      "teacherCount": null
    },
    {
      "id": 2,
      "label": "二年级",
      "studentCount": 320,
      "teacherCount": null
    }
  ]
}
```

**数据获取逻辑**：

```sql
-- 按部门统计
SELECT
  d.id,
  d.name as label,
  COUNT(DISTINCT s.student_id) as student_count,
  COUNT(DISTINCT t.teacher_id) as teacher_count
FROM department d
LEFT JOIN student s ON s.department_id = d.id
  INNER JOIN user su ON su.id = s.user_id AND su.deleted = 0
LEFT JOIN teacher t ON t.department_id = d.id
  INNER JOIN user tu ON tu.id = t.user_id AND tu.deleted = 0
WHERE d.deleted = 0
GROUP BY d.id, d.name
ORDER BY student_count DESC;

-- 按专业统计
SELECT
  m.id,
  m.name as label,
  COUNT(DISTINCT s.student_id) as student_count,
  NULL as teacher_count
FROM major m
LEFT JOIN student s ON s.major_id = m.id
  INNER JOIN user u ON u.id = s.user_id AND u.deleted = 0
WHERE m.deleted = 0
GROUP BY m.id, m.name
ORDER BY student_count DESC;

-- 按年级统计
SELECT
  s.grade_level as id,
  CONCAT(s.grade_level, '年级') as label,
  COUNT(*) as student_count,
  NULL as teacher_count
FROM student s
INNER JOIN user u ON u.id = s.user_id
WHERE u.deleted = 0 AND s.grade_level IS NOT NULL
GROUP BY s.grade_level
ORDER BY s.grade_level ASC;
```

**缓存策略**：
- Key: `dashboard:org:distribution:{dimension}`
- TTL: 30 分钟（组织结构变动较少）

---

### 2.6 系统活动

**接口路径**：`GET /dashboard/activity/recent`

**功能说明**：获取最近 N 天的系统活动数据（新注册用户、活跃选课窗口）

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| days | Integer | 否 | 查询天数，默认7天 |

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "date": "2025-12-13",
      "newUsers": 15,
      "activeWindows": 2
    },
    {
      "date": "2025-12-14",
      "newUsers": 20,
      "activeWindows": 3
    }
  ]
}
```

**数据获取逻辑**：
```sql
-- 新注册用户
SELECT
  DATE(create_time) as date,
  COUNT(*) as new_users
FROM user
WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
  AND deleted = 0
GROUP BY DATE(create_time);

-- 活跃选课窗口（按天统计有多少个窗口处于开放状态）
SELECT
  dates.date,
  COUNT(DISTINCT csw.id) as active_windows
FROM (
  -- 生成日期序列
  SELECT DATE_SUB(CURDATE(), INTERVAL seq DAY) as date
  FROM (SELECT 0 as seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
        UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) as sequence
  WHERE seq < ?
) dates
LEFT JOIN course_selection_window csw
  ON csw.start_time <= dates.date
  AND csw.end_time >= dates.date
  AND csw.status = 'ACTIVE'
  AND csw.deleted = 0
GROUP BY dates.date
ORDER BY dates.date ASC;
```

**缓存策略**：
- Key: `dashboard:activity:recent:{days}`
- TTL: 1 小时

---

## 3. 响应类型定义（Java DTO）

```java
package com.example.dto.dashboard;

import lombok.Data;

/**
 * Dashboard 概览统计 DTO
 */
@Data
public class DashboardOverviewDTO {
    private Integer totalStudents;
    private Integer activeStudents;
    private Integer disabledStudents;
    private Integer totalTeachers;
    private Integer activeTeachers;
    private Integer disabledTeachers;
    private Integer totalCourses;
    private Integer activeCourses;
    private Integer inactiveCourses;
    private Integer archivedCourses;
    private Integer currentEnrollments;
    private Integer waitlistCount;
    private Integer totalDepartments;
    private Integer totalMajors;
}

/**
 * 选课进度 DTO
 */
@Data
public class EnrollmentProgressDTO {
    private Integer offeringId;
    private Integer courseId;
    private String courseCode;
    private String courseName;
    private String departmentName;
    private Integer totalCapacity;
    private Integer enrolled;
    private Integer waitlisted;
    private Double fillRate;
}

/**
 * 选课趋势 DTO
 */
@Data
public class EnrollmentTrendDTO {
    private String date;  // YYYY-MM-DD
    private Integer enrollCount;
    private Integer dropCount;
}

/**
 * 热门课程 DTO
 */
@Data
public class PopularCourseDTO {
    private Integer courseId;
    private String courseCode;
    private String courseName;
    private String departmentName;
    private Integer enrollmentCount;
    private Integer waitlistCount;
}

/**
 * 组织分布 DTO
 */
@Data
public class OrgDistributionDTO {
    private Integer id;
    private String label;
    private Integer studentCount;
    private Integer teacherCount;  // 年级维度时为 null
}

/**
 * 系统活动 DTO
 */
@Data
public class SystemActivityDTO {
    private String date;  // YYYY-MM-DD
    private Integer newUsers;
    private Integer activeWindows;
}
```

---

## 4. 权限控制

所有 Dashboard 接口需要进行身份认证和权限控制：

### 4.1 认证要求
- 所有接口需要 Sa-Token 认证
- 请求头携带 `satoken` Header

### 4.2 权限分级

| 接口 | 管理员 | 教师 | 学生 |
|------|--------|------|------|
| `/dashboard/overview` | ✅ 全局数据 | ✅ 所属部门数据 | ❌ 禁止访问 |
| `/dashboard/enrollment/progress` | ✅ 全部 | ✅ 限制 `departmentId` | ❌ 禁止访问 |
| `/dashboard/enrollment/trend` | ✅ 全部 | ✅ 所属部门 | ❌ 禁止访问 |
| `/dashboard/course/popular` | ✅ 全部 | ✅ 所属部门 | ✅ 仅查看 |
| `/dashboard/org/distribution` | ✅ 全部 | ✅ 所属部门 | ❌ 禁止访问 |
| `/dashboard/activity/recent` | ✅ 全部 | ❌ 禁止访问 | ❌ 禁止访问 |

**实现方式**：
```java
@GetMapping("/dashboard/overview")
@SaCheckRole("admin")  // 仅管理员
public ApiResponse<DashboardOverviewDTO> getOverview(
    @RequestParam(required = false) Integer semesterId
) {
    // ...
}

@GetMapping("/dashboard/enrollment/progress")
@SaCheckLogin  // 需要登录
public ApiResponse<List<EnrollmentProgressDTO>> getEnrollmentProgress(
    @RequestParam(required = false) Integer semesterId,
    @RequestParam(required = false) Integer departmentId
) {
    String role = StpUtil.getRoleList().get(0);

    // 教师只能查看所属部门
    if ("teacher".equals(role)) {
        Integer teacherDeptId = getCurrentTeacherDepartmentId();
        if (departmentId != null && !departmentId.equals(teacherDeptId)) {
            throw new PermissionException("无权查看其他部门数据");
        }
        departmentId = teacherDeptId;
    }

    // ...
}
```

---

## 5. 缓存实现

### 5.1 Redis 配置

```java
@Configuration
public class DashboardCacheConfig {
    public static final String CACHE_PREFIX = "dashboard:";

    public static final int OVERVIEW_TTL = 10 * 60;      // 10分钟
    public static final int PROGRESS_TTL = 5 * 60;       // 5分钟
    public static final int TREND_TTL = 15 * 60;         // 15分钟
    public static final int POPULAR_TTL = 10 * 60;       // 10分钟
    public static final int DISTRIBUTION_TTL = 30 * 60;  // 30分钟
    public static final int ACTIVITY_TTL = 60 * 60;      // 1小时
}
```

### 5.2 缓存工具类示例

```java
@Service
public class DashboardService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public DashboardOverviewDTO getOverview(Integer semesterId) {
        if (semesterId == null) {
            semesterId = getCurrentSemesterId();
        }

        String cacheKey = "dashboard:overview:" + semesterId;

        // 尝试从缓存获取
        DashboardOverviewDTO cached = (DashboardOverviewDTO) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        // 查询数据库
        DashboardOverviewDTO data = queryOverviewFromDatabase(semesterId);

        // 写入缓存
        redisTemplate.opsForValue().set(cacheKey, data, OVERVIEW_TTL, TimeUnit.SECONDS);

        return data;
    }

    /**
     * 清除指定学期的概览缓存
     */
    public void invalidateOverviewCache(Integer semesterId) {
        String cacheKey = "dashboard:overview:" + semesterId;
        redisTemplate.delete(cacheKey);
    }
}
```

### 5.3 缓存失效策略

在以下操作后需要主动清除相关缓存：

| 操作 | 需清除的缓存 |
|------|-------------|
| 学生选课/退课 | `dashboard:enrollment:progress:*`<br>`dashboard:enrollment:trend:*` |
| 用户注册 | `dashboard:overview:*`<br>`dashboard:activity:*` |
| 课程状态变更 | `dashboard:overview:*` |
| 部门/专业变更 | `dashboard:org:distribution:*` |

**实现示例**：
```java
@Service
public class CourseEnrollmentService {

    @Autowired
    private DashboardCacheService dashboardCacheService;

    @Transactional
    public void enrollCourse(EnrollCoursePayload payload) {
        // 执行选课逻辑
        // ...

        // 清除相关缓存
        Integer semesterId = getSemesterIdFromTeachingClass(payload.getTeachingClassId());
        dashboardCacheService.invalidateEnrollmentCache(semesterId);
    }
}
```

---

## 6. 性能优化建议

### 6.1 数据库索引

确保以下字段有索引以提升查询性能：

```sql
-- course_offering 表
CREATE INDEX idx_semester_id ON course_offering(semester_id);
CREATE INDEX idx_course_id ON course_offering(course_id);

-- course_enrollment 表
CREATE INDEX idx_teaching_class_id ON course_enrollment(teaching_class_id);
CREATE INDEX idx_status ON course_enrollment(status);
CREATE INDEX idx_create_time ON course_enrollment(create_time);

-- teaching_class 表
CREATE INDEX idx_offering_id ON teaching_class(course_offering_id);

-- student 表
CREATE INDEX idx_department_id ON student(department_id);
CREATE INDEX idx_major_id ON student(major_id);
CREATE INDEX idx_grade_level ON student(grade_level);

-- teacher 表
CREATE INDEX idx_department_id ON teacher(department_id);
```

### 6.2 查询优化

- 使用 `COUNT(1)` 代替 `COUNT(*)`
- 避免 `SELECT *`，只查询需要的字段
- 合理使用 `LEFT JOIN` 和 `INNER JOIN`
- 利用 MyBatis Plus 的 `selectMaps()` 直接获取 Map 结果

### 6.3 分页处理

对于数据量较大的接口（如选课进度），考虑添加分页：

```java
@GetMapping("/dashboard/enrollment/progress")
public ApiResponse<PageResult<EnrollmentProgressDTO>> getEnrollmentProgress(
    @RequestParam(required = false) Integer semesterId,
    @RequestParam(defaultValue = "1") Integer pageNum,
    @RequestParam(defaultValue = "20") Integer pageSize
) {
    // ...
}
```

---

## 7. 实施步骤

### 阶段一：基础接口开发（优先级：高）
1. 创建 `DashboardController`
2. 实现 `/dashboard/overview` 接口
3. 配置 Redis 缓存
4. 编写单元测试

### 阶段二：选课相关接口（优先级：高）
5. 实现 `/dashboard/enrollment/progress`
6. 实现 `/dashboard/enrollment/trend`
7. 实现 `/dashboard/course/popular`
8. 添加权限控制

### 阶段三：组织与活动接口（优先级：中）
9. 实现 `/dashboard/org/distribution`
10. 实现 `/dashboard/activity/recent`
11. 优化数据库查询性能
12. 完善缓存失效逻辑

### 阶段四：测试与优化（优先级：中）
13. 集成测试
14. 压力测试
15. 监控慢查询日志
16. 更新 API 文档（OpenAPI）

---

## 8. 测试用例参考

### 8.1 单元测试

```java
@SpringBootTest
public class DashboardServiceTest {

    @Autowired
    private DashboardService dashboardService;

    @Test
    public void testGetOverview() {
        DashboardOverviewDTO overview = dashboardService.getOverview(1);

        assertNotNull(overview);
        assertTrue(overview.getTotalStudents() > 0);
        assertTrue(overview.getTotalTeachers() > 0);
    }

    @Test
    public void testGetEnrollmentProgress() {
        List<EnrollmentProgressDTO> progress = dashboardService.getEnrollmentProgress(1, null);

        assertNotNull(progress);
        assertFalse(progress.isEmpty());

        EnrollmentProgressDTO first = progress.get(0);
        assertTrue(first.getFillRate() >= 0 && first.getFillRate() <= 1);
    }
}
```

### 8.2 接口测试

使用 Postman 或 curl 测试：

```bash
# 获取概览数据
curl -H "satoken: YOUR_TOKEN" \
  "http://localhost:8081/dashboard/overview?semesterId=1"

# 获取选课进度
curl -H "satoken: YOUR_TOKEN" \
  "http://localhost:8081/dashboard/enrollment/progress?semesterId=1&departmentId=5"

# 获取热门课程
curl -H "satoken: YOUR_TOKEN" \
  "http://localhost:8081/dashboard/course/popular?semesterId=1&limit=5"
```

---

## 9. 常见问题

### Q1: 如何处理当前学期为空的情况？
A: 调用 `/semester/current` 接口获取当前学期，如果返回 null，则返回空数据或提示"未设置当前学期"。

### Q2: 填充率如何计算？
A: `fillRate = enrolled / totalCapacity`，其中 `totalCapacity` 是该课程开设下所有教学班的容量总和。

### Q3: 教师权限如何限制查询范围？
A: 在 Service 层根据教师的 `departmentId` 自动添加过滤条件，前端传入的 `departmentId` 参数需验证是否与教师所属部门一致。

### Q4: 缓存失效是否会影响性能？
A: 缓存失效后首次请求会查询数据库，后续请求从缓存读取。可以考虑使用"延迟失效"策略，避免频繁清除。

---

## 10. 附录

### 10.1 相关数据库表

- `user` - 用户表
- `student` - 学生表
- `teacher` - 教师表
- `course` - 课程表
- `course_offering` - 课程开设表
- `teaching_class` - 教学班表
- `course_enrollment` - 选课记录表
- `department` - 部门表
- `major` - 专业表
- `semester` - 学期表
- `course_selection_window` - 选课窗口表

### 10.2 技术参考

- MyBatis Plus 文档：https://baomidou.com/
- Sa-Token 文档：https://sa-token.cc/
- Spring Data Redis：https://spring.io/projects/spring-data-redis

---

**文档维护**：本文档应随接口变更及时更新，并同步到 OpenAPI 规范文件。
