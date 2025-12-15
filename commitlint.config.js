export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型枚举
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复 bug
        'docs', // 文档变更
        'style', // 代码格式 (不影响代码运行的变动)
        'refactor', // 重构 (既不是新增功能，也不是修复 bug)
        'perf', // 性能优化
        'test', // 测试
        'build', // 构建系统或外部依赖变更
        'ci', // CI 配置
        'chore', // 其他变更
        'revert', // 回滚
      ],
    ],
    // 类型不能为空
    'type-empty': [2, 'never'],
    // 主题不能为空
    'subject-empty': [2, 'never'],
    // 主题大小写不限制
    'subject-case': [0],
    // header 最大长度
    'header-max-length': [2, 'always', 100],
  },
}
