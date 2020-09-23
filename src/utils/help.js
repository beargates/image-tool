export const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0
    const v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

export const randomId = () => Math.floor(Math.random() * 1000).toString(36)

export function toPromise(fn) {
  return function promiseFunc(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, data) => {
        // 大部分函数符合这种调用方式
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
}

export function toPromiseOne(fn) {
  return function promiseFunc(...args) {
    return new Promise(resolve => {
      fn(...args, data => {
        // fs.exists只有一个返回值
        resolve(data)
      })
    })
  }
}

export function fmtDate(fmt, _date) {
  const date = new Date(_date)
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds() // 毫秒
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }

  for (const k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    }
  }

  return fmt
}

export function _setItem(self, key, value) {
  self[key] = value
}

export function _setArray(self, key, value) {
  self[key].replace(value)
}

export function getSHA256(value) {
  const crypto = require('crypto')
  const secret = 'huohua-asm'
  return crypto
    .createHmac('sha256', secret)
    .update('value')
    .digest('hex')
}
