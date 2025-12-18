# 邮箱验证功能完善说明

## 功能概述

已完成对前端邮箱验证功能的完善实现，包括：

1. **API接口集成**
   - `POST /user/{userId}/email/send-code` - 发送邮箱绑定验证码
   - `POST /user/{userId}/email/verify` - 验证邮箱验证码

2. **邮箱验证对话框组件** (`EmailVerificationDialog.vue`)
   - 分两步验证流程（输入邮箱 → 输入验证码）
   - 60秒倒计时功能
   - 重新发送验证码
   - 邮箱格式校验
   - 重复邮箱防护

3. **个人中心集成** (`UserProfileView.vue`)
   - 邮箱字段显示
   - "验证邮箱"按钮快速打开验证对话框
   - 验证成功后自动更新邮箱信息

## 文件变更

### 新增文件
- `src/components/EmailVerificationDialog.vue` - 邮箱验证对话框组件（完整实现）

### 修改文件
- `src/views/UserProfileView.vue` - 集成邮箱验证功能
- `src/lib/api.ts` - 添加邮箱验证API函数
- `src/types/index.ts` - 添加邮箱验证类型定义

## 使用流程

### 用户视角
1. 在个人中心页面，点击邮箱字段旁的"验证邮箱"按钮
2. 输入新的邮箱地址，点击"发送验证码"
3. 验证码发送成功后，进入验证阶段
4. 输入收到的验证码，点击"确认验证"
5. 验证成功，邮箱自动更新

### 技术实现

#### 第一步：发送验证码
```typescript
// 调用API
const res = await sendEmailBindingCode(
  { email: newEmail },
  userId
)

// 后端处理
POST /user/{userId}/email/send-code
Body: { email: "user@example.com" }
Response: { code: 0, message: "验证码已发送", data: null }
```

#### 第二步：验证验证码
```typescript
// 调用API
const res = await verifyEmailCode(
  {
    userId: userId,
    email: newEmail,
    verificationCode: code
  },
  userId
)

// 后端处理
POST /user/{userId}/email/verify
Body: { 
  userId: "123",
  email: "user@example.com",
  verificationCode: "123456"
}
Response: { code: 0, message: "验证成功", data: null }
```

## 功能特性

### 1. 双步验证流程
- **输入邮箱阶段** - 用户输入要绑定的邮箱地址
- **验证码阶段** - 用户输入收到的验证码

### 2. 倒计时管理
- 发送验证码后启动60秒倒计时
- 倒计时期间显示剩余时间
- 倒计时结束前无法提交验证
- 支持重新发送（需倒计时结束）

### 3. 数据校验
```typescript
// 邮箱格式校验
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!validateEmail(email)) {
  error = '请输入有效的邮箱地址'
}

// 重复邮箱防护
if (newEmail === currentEmail) {
  error = '新邮箱不能与当前邮箱相同'
}

// 验证码长度校验
if (code.length < 4) {
  error = '验证码长度不正确'
}
```

### 4. 错误处理
- 网络错误提示
- 表单验证错误提示
- 后端业务错误提示
- 所有错误通过 Alert 组件和 Toast 提示

### 5. 用户体验
- 加载状态禁用操作
- 按钮禁用状态提示
- Loading 动画反馈
- 成功/失败 Toast 提示

## 与忘记密码功能的区别

| 功能 | 邮箱验证 | 忘记密码 |
|------|--------|--------|
| **目的** | 绑定/更新用户邮箱 | 重置忘记的密码 |
| **API端点** | `/user/{userId}/email/send-code` | `/auth/password-reset/send-code` |
| **验证步骤** | 2步（邮箱+验证码） | 2步（邮箱+验证码+新密码） |
| **使用场景** | 个人中心，修改邮箱 | 登录页面，忘记密码 |
| **权限要求** | 需登录（userId）| 无需登录 |
| **验证码用途** | 仅验证邮箱 | 用于重置密码 |

## 后端需求清单

后端需要实现以下接口：

### 1. 发送邮箱绑定验证码
```
POST /user/{userId}/email/send-code
```
- 参数：
  - Path: `userId` (string)
  - Body: `{ email: string }`
  - Cookie: `satoken` (token)
- 功能：
  - 生成6位数字验证码
  - 发送到指定邮箱
  - 设置5分钟过期时间
  - 存储在 Redis/数据库
- 返回：`{ code: 0, message: "验证码已发送", data: null }`

### 2. 验证邮箱验证码
```
POST /user/{userId}/email/verify
```
- 参数：
  - Path: `userId` (string)
  - Body: `{ userId: string, email: string, verificationCode: string }`
  - Cookie: `satoken` (token)
- 功能：
  - 验证验证码有效性和正确性
  - 检查验证码是否过期
  - 更新用户的 email 字段
  - 清除已使用的验证码
- 返回：`{ code: 0, message: "验证成功", data: null }`

## 前端代码结构

### EmailVerificationDialog.vue 组件
```
├── 数据管理
│   ├── step (input | verify) - 当前步骤
│   ├── formData - 表单数据
│   └── countdown - 倒计时
├── 主要函数
│   ├── handleSendCode() - 发送验证码
│   ├── handleVerify() - 验证验证码
│   ├── handleBack() - 返回上一步
│   └── handleResendCode() - 重新发送
└── UI组件
    ├── 对话框标题和描述
    ├── 错误提示
    ├── 邮箱输入区
    ├── 验证码输入区
    └── 操作按钮
```

### UserProfileView.vue 集成
```
├── 导入 EmailVerificationDialog 组件
├── 添加 isEmailDialogOpen 状态
├── 添加 originalEmail 用于邮箱验证功能
├── 邮箱字段显示 + 验证按钮
├── 验证对话框组件
└── 验证完成事件处理
```

## 测试检查清单

- [ ] 能否正常打开邮箱验证对话框
- [ ] 邮箱格式校验是否正确
- [ ] 能否发送验证码
- [ ] 倒计时是否正常工作
- [ ] 能否正确输入验证码
- [ ] 验证成功后是否更新邮箱
- [ ] 能否重新发送验证码
- [ ] 错误提示是否清晰
- [ ] Loading 状态是否正常
- [ ] 输入重复邮箱时是否提示

## 集成说明

该功能已完整集成到个人中心页面，用户可以：
1. 在个人中心查看当前邮箱
2. 点击"验证邮箱"按钮修改邮箱
3. 通过邮箱验证流程完成邮箱绑定

所有API调用、数据验证、错误处理都已实现，后端只需实现对应的API接口即可。
