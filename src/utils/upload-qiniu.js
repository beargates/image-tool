const qiniu = require('qiniu-js')
import uuid from 'uuid/v4'

import {fmtDate} from './other'
import {request} from './request'
import {getLogger} from './logger'
const logger = getLogger('qiniu-upload')

function qiniuWarp({file, key, token, cdnPrefix}) {
  return new Promise((resolve, reject) => {
    const config = {
      useCdnDomain: true,
    }
    const putExtra = {
      // fname: file.name,
      params: {},
    }

    // if (file.name === '4_5_jiqi.png') return reject({name: file.name, error: 'upload err'})
      console.log(file, key, token, putExtra, config);
    const observable = qiniu.upload(file, key, token, putExtra, config)
    observable.subscribe({
      next: res => {
        // 主要用来展示进度
        const total = res.total
        console.log(total)
        logger.debug('进度：' + parseInt(total.percent) + '% ')
      },
      error: err => {
        // 失败报错信息
        logger.error(err)
        console.log(err)
        return reject({name: file.name, error: err})
      },
      complete: res => {
        // 接收成功后返回的信息
        logger.log(res)
        console.log(res)

        return resolve({hash: res.hash, name: file.name, url: cdnPrefix + res.key})
      },
    })
  })
}

export function uploadToQiniu(
  fileList,
  {
    cdnPrefix = 'https://im-assets.qn.huohua.cn/',
    prefix = '',
    tokenApiURI = 'https://api.huohua.cn/api/upload/token?bucket=im-assets',
  } = {}
) {
  console.log([...arguments])
  return new Promise((resolve, reject) => {
    request(tokenApiURI, {method: 'GET'}).then(ret => {
      // logger.log(ret)
      const token = ret.data.data
      const uploadList = [...fileList].map(item => {
        const ext = item.name.replace(/.+(\.[^.]+)$/, '$1')
        const key = prefix ? `${prefix}/${uuid()}${ext}` : `${fmtDate('yyyyMMdd', Date.now())}/${uuid()}${ext}`
        return qiniuWarp({
          cdnPrefix,
          file: item,
          key,
          prefix,
          token,
        })
      })
      return Promise.all(uploadList)
        .then(retList => {
          logger.log('uploadToQiniu succ', retList)
          return resolve(retList)
        })
        .catch(err => {
          logger.error('uploadToQiniu fail', err)
          reject(err)
        })
    })
  })
}
