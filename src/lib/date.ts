import dayjs from "dayjs";
import 'dayjs/locale/zh-cn'//中文语言包
// 设置全局语言为中文
dayjs.locale('zh-cn')

/**
 * 格式化日期时间
 * @param date 后端返回的时间 
 * @param template 格式模板
 */
export const formatDate = (date: any, template = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-'
  if (typeof date === 'object' && date.dateTime) {
    return dayjs(date.dateTime).format(template)
  }

  return dayjs(date).format(template)
}