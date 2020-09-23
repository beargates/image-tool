const axios = require('axios')
const fs = require('fs')
const qiniu = require('qiniu')

import config from '../../config'
const { cdnPrefix, tokenURI } = config

// const tokenURI = 'http://172.16.40.55:3001/api/token'
// const cdnPrefix = 'http://ph3safumb.bkt.clouddn.com/'

export function uploadToQiniu(localFile, remoteFile) {
  return new Promise((resolve, reject) => {
    let config = new qiniu.conf.Config()
    let resumeUploader = new qiniu.resume_up.ResumeUploader(config)
    let putExtra = new qiniu.resume_up.PutExtra()

    axios
      .get(tokenURI)
      .then(ret => {
        // console.log(ret)
        resumeUploader.putFile(ret.data, remoteFile, localFile, putExtra, function(respErr, respBody, respInfo) {
          if (respBody.error) {
            console.dir(respBody)
            respErr = { error: respBody.error }
            reject(respErr)
          } else {
            //   console.log(respErr, respBody, respInfo)
            resolve(cdnPrefix + respBody.key)
            //   callback(respErr, respBody)
          }
        })
      })
      .catch(err => reject(err))
  })
}
