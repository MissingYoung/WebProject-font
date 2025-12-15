//检查字符串是否为纯数字字符串
export function isNumericString(str: string): boolean {
  if (typeof str !== 'string' || str === '') {
    return false
  }
  for (const char of str) {
    if (char < '0' || char > '9') {
      return false
    }
  }
  return true
}

// 保留旧函数名以保持向后兼容
/** @deprecated 使用 isNumericString 代替 */
export const isPureString = isNumericString
