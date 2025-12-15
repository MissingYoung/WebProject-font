<!--主页侧边导航栏样式-->
<script setup lang="ts">
import { shallowRef } from 'vue'
import {
  Home,
  GraduationCap,
  Command,
  Building2,
  Calendar,
  BookOpen,
  Users,
  Users2,
  Shield,
  UserCog,
  UsersRound,
  BookMarked,
  Clock,
  FileText,
  CalendarRange,
  BookCheck,
} from 'lucide-vue-next'
const menuItems = shallowRef([
  { name: '我的桌面', routeName: 'Dashboard', icon: Home },
  { name: '课程列表', routeName: 'CourseList', icon: GraduationCap },
  { name: '部门管理', routeName: 'DepartmentList', icon: Building2 },
  { name: '学期管理', routeName: 'SemesterList', icon: Calendar },
  { name: '专业管理', routeName: 'MajorList', icon: BookOpen },
  { name: '学生管理', routeName: 'StudentList', icon: GraduationCap },
  { name: '教师管理', routeName: 'TeacherList', icon: Users },
  { name: '家庭成员', routeName: 'FamilyMemberList', icon: Users2 },
  { name: '权限管理', routeName: 'PermissionList', icon: Shield },
  { name: '角色管理', routeName: 'RoleList', icon: UserCog },
  { name: '行政班管理', routeName: 'AdministrativeClassList', icon: UsersRound },
  { name: '开课管理', routeName: 'CourseOfferingList', icon: BookOpen },
  { name: '教学班管理', routeName: 'TeachingClassList', icon: GraduationCap },
  { name: '排课管理', routeName: 'ScheduleList', icon: Clock },
  { name: '选课窗口', routeName: 'SelectionWindowList', icon: CalendarRange },
  { name: '培养计划', routeName: 'ProgramRequirementList', icon: FileText },
  { name: '可选课程', routeName: 'AvailableCourseList', icon: BookMarked },
  { name: '我的选课', routeName: 'MyEnrollments', icon: BookCheck },
])
</script>

<template>
  <div
    class="hidden border-r bg-muted/40 md:block w-[220px] lg:w-[280px] h-screen flex-col flex sticky top-0"
  >
    <!-- 1. 顶部 Logo 区域 -->
    <div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
      <a href="/" class="flex items-center gap-2 font-semibold">
        <Command class="h-6 w-6" />
        <span class="">智慧作业管理平台</span>
      </a>
    </div>

    <!-- 2. 导航菜单区域 -->
    <div class="flex-1">
      <nav class="grid items-start px-2 text-sm font-medium lg:px-4 mt-4 gap-2">
        <!-- 循环渲染菜单项 -->
        <router-link
          v-for="item in menuItems"
          :key="item.routeName"
          v-slot="{ href, navigate, isActive }"
          :to="{ name: item.routeName }"
          custom
        >
          <a
            :href="href"
            :class="[
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
              isActive ? 'bg-muted text-primary' : 'text-muted-foreground',
            ]"
            @click="navigate"
          >
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.name }}
          </a>
        </router-link>
      </nav>
    </div>
  </div>
</template>
