export function toPromise(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, data) => {
        // 大部分函数符合这种调用方式
        if (err) {
          return reject(err)
        } else {
          return resolve(data)
        }
      })
    })
  }
}

export function toPromiseOne(fn) {
  return function(...args) {
    return new Promise(resolve => {
      fn(...args, data => {
        // fs.exists只有一个返回值
        return resolve(data)
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
    S: date.getMilliseconds(), // 毫秒
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

export function getBreadcrumbs(pathName) {
  if (pathName === '/') return [[], '/']
  const linkList = pathName
    .split('/')
    .slice(1)
    .reduce((sum, curr) => [...sum, sum[sum.length - 1].concat(`/${curr}`).replace(/\/+/, '/')], ['/'])

  return [linkList.slice(0, -1), linkList.slice(-1).join('')]
}

export function completeAssign(target, ...sources) {
  sources.forEach(source => {
    const descriptors = Object.keys(source).reduce((descriptors, key) => {
      descriptors[key] = Object.getOwnPropertyDescriptor(source, key)
      return descriptors
    }, {})

    // Object.assign 默认也会拷贝可枚举的Symbols
    Object.getOwnPropertySymbols(source).forEach(sym => {
      const descriptor = Object.getOwnPropertyDescriptor(source, sym)
      if (descriptor.enumerable) {
        descriptors[sym] = descriptor
      }
    })
    Object.defineProperties(target, descriptors)
  })
  return target
}

export function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16)
  })
}

export function encodeRFC5987ValueChars(str) {
  return (
    encodeURIComponent(str)
      // 注意，仅管 RFC3986 保留 "!"，但 RFC5987 并没有
      // 所以我们并不需要过滤它
      .replace(/['()]/g, escape) // i.e., %27 %28 %29
      .replace(/\*/g, '%2A')
      // 下面的并不是 RFC5987 中 URI 编码必须的
      // 所以对于 |`^ 这3个字符我们可以稍稍提高一点可读性
      .replace(/%(?:7C|60|5E)/g, unescape)
  )
}

export const getFunByType = (funType, funMap) =>
  async function funByType(context) {
    const fun = funMap[context[funType]]
    if (!fun) return Promise.reject(`invalid funType:${funType}`)
    return await fun(context)
  }

export function sleepReject(time) {
  return new Promise((resolve, reject) => setTimeout(reject, time))
}

export function sleepResolve(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export function getURLPrefix() {
  console.log(document.location)
  return `${document.location.protocol}//${document.location.host}`
}
