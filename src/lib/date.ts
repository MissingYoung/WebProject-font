import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn' //中文语言包
// 设置全局语言为中文
dayjs.locale('zh-cn')

// 后端日期时间类型（支持对象格式或字符串格式）
type BackendDateTime = string | { dateTime: string } | null | undefined

/**
 * 格式化日期时间
 * @param date 后端返回的时间
 * @param template 格式模板
 */
export const formatDate = (date: BackendDateTime, template = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '-'
  if (typeof date === 'object' && date.dateTime) {
    return dayjs(date.dateTime).format(template)
  }
  // 此时 date 是 string 类型
  return dayjs(date as string).format(template)
}
