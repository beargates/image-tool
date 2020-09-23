export function curry(fn, arity = fn.length) {
  function nextCurried(prevArgs) {
    const transition = function curried(...nextArgs) {
      const args = prevArgs.concat(nextArgs)
      if (args.length >= arity) {
        return fn(...args)
      } else {
        return nextCurried(args)
      }
    }
    Object.defineProperty(transition, 'fnname', {get: () => fn.name})
    return transition
  }

  return nextCurried([])
}

export function promiseToCallback(func) {
  return function(...args) {
    // console.log('args', args)
    // 返回封装后的函数.
    const callback = args[args.length - 1] // 如果是callback模式, 最后一个参数需要是callback函数.

    // If legacy callback mode
    if (args.length >= 1 && typeof callback === 'function') {
      return func(...args.slice(0, args.length - 1)) // 调用实际的功能函数.
        .then(res => {
          callback(null, res) // 成功
        })
        .catch(err => {
          callback(err) // 失败
        })
    }
    // Promise mode
    else return func(...args) // Promise模式, 直接return.
  }
}
