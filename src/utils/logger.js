import {getType, arrayBuffer2hex, dataView2hex, uint8Array2hex} from './type-util'
import {fmtDate} from './other'
import {curry} from './curry'
import {getGlobalObj} from './global-util'

const logLevelMap = {
  debug: 1,
  log: 2,
  info: 3,
  warn: 4,
  error: 5,
  fatal: 6,
}

const logMap = getGlobalObj('lws.logger', {
  loggers: {},
  privates: {},
  cacheList: [],
  currLevel: 'info',
  writeCache: false,
  cutHuge: false,
})

export function setLogLevel(logLevel) {
  if (typeof logLevel !== 'string' || !logLevelMap[logLevel]) throw 'setLevel error: logLevel invalid'
  logMap.currLevel = logLevel
}

export function setExternalLogger(externalLogger) {
  if (externalLogger) logMap.externalLogger = externalLogger
}

export function getLogLevel() {
  return logMap.currLevel
}

function procArray(array) {
  if (array.length > 20) array = [...array.slice(0, 19), '...']
  for (let i = 0; i < array.length; i++) {
    const value = array[i]
    if (Array.isArray(value)) array[i] = procArray([...value])
    if (typeof value === 'object' && !Array.isArray(value)) array[i] = procObj({...value})
    if (typeof value === 'string' && value.length > 500) array[i] = value.slice(0, 499) + '...'
  }
  return array
}

function procObj(obj) {
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (Array.isArray(value)) obj[key] = procArray([...value])
    if (typeof value === 'object' && !Array.isArray(value)) obj[key] = procObj({...value})
    if (typeof value === 'string' && value.length > 500) obj[key] = value.slice(0, 499) + '...'
  }
  return obj
}

const getHugeArray = array => {
  const newArray = [...array]

  return procArray(newArray)
}

const getHugeObject = obj => {
  const newObj = {...obj}

  return procObj(newObj)
}

const cacheLogs = curry(function cacheLogs(owner, name, levelName, ...args) {
  if (logMap.externalLogger) {
    //
  } else {
    if (logMap.privates[owner].localLogLevel) {
      if (logLevelMap[logMap.privates[owner].currLevel] > logLevelMap[levelName]) {
        return
      }
    } else {
      if (logLevelMap[logMap.currLevel] > logLevelMap[levelName]) {
        return
      }
    }
  }

  const currentCache = []
  for (const arg of args) {
    const rawType = getType(arg)
    if (rawType === 'ArrayBuffer') {
      currentCache.push(rawType, arrayBuffer2hex(arg))
    } else if (rawType === 'DataView') {
      currentCache.push(rawType, dataView2hex(arg))
    } else if (rawType === 'Uint8Array') {
      currentCache.push(rawType, uint8Array2hex(arg))
    } else if (rawType === 'Error') {
      currentCache.push(arg.stack)
    } else if (rawType === 'Map' || rawType === 'Set') {
      currentCache.push(rawType, JSON.stringify([...arg], null, 2))
    } else if (rawType === 'Object') {
      try {
        currentCache.push(JSON.stringify(logMap.cutHuge ? getHugeObject(arg) : arg, null, 2))
      } catch (err) {
        currentCache.push(arg)
      }
    } else if (rawType === 'Array') {
      currentCache.push(JSON.stringify(logMap.cutHuge ? getHugeArray(arg) : arg, null, 2))
    } else if (rawType === 'Undefined') {
      currentCache.push('Undefined')
    } else if (rawType === 'Null') {
      // currentCache.push('Null')
    } else {
      currentCache.push(arg)
    }
  }

  const msg =
    currentCache.length === 1 && currentCache[0] === '\n'
      ? ['\n']
      : [`${name} [${fmtDate('yyyy-MM-dd hh:mm:ss', Date.now())}] [${levelName}]`, ...currentCache]

  // const msg = [`${name} [${fmtDate('yyyy-MM-dd hh:mm:ss', Date.now())}] [${levelName}]`, ...currentCache]

  if (logMap.externalLogger) {
    logMap.externalLogger[levelName](...currentCache)
  } else {
    if (console && console.log && msg.length) {
      console.log(...msg)
    }
    if (logMap.writeCache) logMap.cacheList.push(msg.join(' '))
  }
}, 4)

export function getLogger(name, {isCached = false, localLogLevel = false, isCutHuge = false} = {}) {
  if (typeof name !== 'string') throw 'getLogger owner invalid'

  // 每次都不一样
  const owner = Symbol('lws.loggerOwner')

  logMap.loggers[owner] = {}
  for (const levelName of Object.keys(logLevelMap)) {
    logMap.loggers[owner][levelName] = cacheLogs(owner, name, levelName)
  }

  logMap.privates[owner] = {}
  logMap.privates[owner].localLogLevel = localLogLevel
  logMap.privates[owner].currLevel = 'info'

  // 一次设置为 true 全局生效
  if (isCached) logMap.writeCache = true

  logMap.loggers[owner].cacheList = () => logMap.cacheList

  // 一次设置为 true 全局生效
  if (isCutHuge) {
    // logMap.loggers[owner].info('isCutHuge is true')
    logMap.cutHuge = true
  }

  if (localLogLevel) {
    logMap.loggers[owner].setLogLevel = logLevel => {
      if (typeof logLevel !== 'string' || !logLevelMap[logLevel]) throw 'setLevel error: logLevel invalid'
      logMap.privates[owner].currLevel = logLevel
    }
    logMap.loggers[owner].getLogLevel = () => logMap.privates[owner].currLevel
  }

  return logMap.loggers[owner]
}
