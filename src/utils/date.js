/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期
 * @param {Date} date 日期对象
 * @param {String} fmt 格式字符串，例如：'yyyy-MM-dd HH:mm:ss'
 * @returns {String} 格式化后的日期字符串
 */
export function formatDate(date, fmt = 'yyyy-MM-dd HH:mm:ss') {
  if (!date) return '';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // 检查是否为有效日期
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'H+': date.getHours(), // 小时
    'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, // 12小时制
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    'S': date.getMilliseconds() // 毫秒
  };
  
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1, 
        RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      );
    }
  }
  
  return fmt;
}

/**
 * 格式化UTC时间戳为本地时间
 * @param {String|Date} timestamp UTC时间戳或日期对象
 * @param {String} fmt 格式字符串，默认 'yyyy-MM-dd HH:mm:ss'
 * @returns {String} 格式化后的本地时间字符串
 */
export function formatUTCToLocal(timestamp, fmt = 'yyyy-MM-dd HH:mm:ss') {
  if (!timestamp) return '';
  
  let date;
  if (typeof timestamp === 'string') {
    // 如果是ISO格式字符串，直接解析（会自动处理时区）
    if (timestamp.includes('T') || timestamp.includes('Z')) {
      date = new Date(timestamp);
    } else {
      // 如果是简单的日期时间字符串，当作本地时间处理
      date = new Date(timestamp);
    }
  } else {
    date = new Date(timestamp);
  }
  
  // 检查是否为有效日期
  if (isNaN(date.getTime())) {
    console.warn('无效的时间戳:', timestamp);
    return '';
  }
  
  // 使用formatDate格式化
  return formatDate(date, fmt);
}

/**
 * 使用浏览器本地化格式化时间
 * @param {String|Date} timestamp 时间戳
 * @returns {String} 本地化时间字符串
 */
export function formatLocalTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai' // 明确指定中国时区
  });
}

/**
 * 获取相对时间描述
 * @param {Date|String} date 日期对象或日期字符串
 * @returns {String} 相对时间描述，例如：刚刚、5分钟前、1小时前、昨天、2天前、1周前等
 */
export function getRelativeTime(date) {
  if (!date) return '';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const now = new Date();
  const diff = now - date;
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return Math.floor(diff / (60 * 1000)) + '分钟前';
  }
  
  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
  }
  
  // 小于2天
  if (diff < 2 * 24 * 60 * 60 * 1000) {
    return '昨天';
  }
  
  // 小于1周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
  }
  
  // 小于1个月
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + '周前';
  }
  
  // 小于1年
  if (diff < 12 * 30 * 24 * 60 * 60 * 1000) {
    return Math.floor(diff / (30 * 24 * 60 * 60 * 1000)) + '个月前';
  }
  
  // 大于1年
  return Math.floor(diff / (12 * 30 * 24 * 60 * 60 * 1000)) + '年前';
}

/**
 * 获取日期范围
 * @param {String} type 范围类型：today, yesterday, thisWeek, lastWeek, thisMonth, lastMonth, thisYear, lastYear
 * @returns {Array} 日期范围数组，包含开始日期和结束日期
 */
export function getDateRange(type) {
  const now = new Date();
  const start = new Date();
  const end = new Date();
  
  switch (type) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'thisWeek':
      // 周一为一周的开始
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + (7 - day));
      end.setHours(23, 59, 59, 999);
      break;
    case 'lastWeek':
      const lastDay = start.getDay() || 7;
      start.setDate(start.getDate() - lastDay - 6);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - lastDay);
      end.setHours(23, 59, 59, 999);
      break;
    case 'thisMonth':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'lastMonth':
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'thisYear':
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11);
      end.setDate(31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'lastYear':
      start.setFullYear(start.getFullYear() - 1);
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(end.getFullYear() - 1);
      end.setMonth(11);
      end.setDate(31);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      break;
  }
  
  return [start, end];
}