const getGlobalThis = () => {
  // eslint-disable-next-line no-undef
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof self !== 'undefined') return self
  if (typeof window !== 'undefined') return window
  if (typeof global !== 'undefined') return global
  // if (typeof this !== 'undefined') return this
  throw new Error('Unable to locate global `this`')
}

// function prefix() {
//   // 多实例共享全局属性
//   const LOGGER = Symbol.for('lws.logger')
//   if (!getGlobalThis()[LOGGER]) {
//     getGlobalThis()[LOGGER] = {
//       loggers: {},
//       privates: {},
//       cacheList: [],
//       currLevel: 'info',
//       writeCache: false,
//       cutHuge: false,
//     }
//   }
//   return getGlobalThis()[LOGGER]
// }

export function getGlobalObj(name, context) {
  const KEY = Symbol.for(name)
  if (!getGlobalThis()[KEY]) {
    getGlobalThis()[KEY] = {...context}
  }
  return getGlobalThis()[KEY]
}
