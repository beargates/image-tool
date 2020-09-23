/**
 * 基于ffmpeg的图片压缩工具
 * 目前支持jpg/png，jpg压缩率较好，png不太理想
 *
 * 支持的feature
 * 1。裁剪成0.5X
 * 2。png转jpg
 * 3。上传至七牛
 */
import React, { Component } from 'react'
import { Upload, Icon, Button, Switch } from 'antd'
import { CloseCircleFilled, CheckCircleFilled } from '@ant-design/icons'
import { uploadToQiniu } from '../utils/upload-qiniu-node'
import config from '../utils/qiniu-config'
import uuid from 'uuid/dist/v4'
import { clipboard } from 'electron'
import compressor from 'imagemin-pngquant'
import { promisify } from 'util'
import fs from 'fs'

const path = require('path')
const ffmpeg = require('fluent-ffmpeg')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const isMac = /Mac OS/i.test(navigator.userAgent)
const unit = isMac ? 1000 : 1024

/**
 * 格式化文件大小
 * @param {*} size
 */
function fileSizePrettier(size) {
  let value = Number(size)
  if (size && !isNaN(value)) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB', 'BB']
    let index = 0
    let k = value
    if (value >= unit) {
      while (k > unit) {
        k = k / unit
        index++
      }
    }
    return `${(k).toFixed(2)}${units[index]}`
  }
  return '-'
}

/**
 * 获取文件信息，如大小,尺寸
 */
function getFileInfo(src) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(src, (err, metadata) => {
      if (!err) {
        return resolve(metadata)
      }
      return reject(err)
    })
  })
}

class List extends Array {
  constructor(arr, listener) {
    super(arr)
    this._listener = listener
    return this
  }

  push(...args) {
    const pushed = Array.prototype.push.call(this, ...args)
    this._listener && this._listener()
    return pushed
  }
}

const STATUS = {
  WAITING: 0,
  PENDING: 1,
  RESOLVING: 2,
  SUCCESS: 8,
  FAILED: 9
}

class Compress extends Component {
  qualityInput = React.createRef()
  state = {
    replace: false,
    clip: false,
    toJPG: false,
    quality: 0.8
  }

  constructor(props) {
    super(props)
    this.list = new List(0, this.listener)
    this.listMapper = {}
    this.stateMapper = {}
    this.beforeSize = {}
  }

  /**
   * 适用ffmpeg处理图片
   * @param src
   * @param opts
   * @returns {Promise<String>}
   */
  ffmpegResolve = (src, opts) => {
    return new Promise(async (resolve, reject) => {
      const { clip = 1, extname, quality } = opts
      const { dir, name, ext } = path.parse(src)
      // png无法直接输出到源位置
      let output = dir + '/' + name + '_optimized'
      if (quality) {
        output += `_${quality}`
      }
      if (clip !== 1) {
        output += `_@${clip}x`
      }
      output += (extname ? extname : ext)
      const options = []
      const { streams } = await getFileInfo(src)
      const { width, height } = streams[0]
      if (clip !== 1) {
        options.push(`-vf scale=${width * clip}:${height * clip}`)
      }
      ffmpeg({ logger: 'debug' })
        .input(src)
        .addOptions(options)
        .output(output)
        .on('start', commandLine => {
          console.log(commandLine)
        })
        .on('stderr', function() {
        })
        .on('error', err => {
          reject(err)
        })
        .on('end', () => {
          resolve(output)
        })
        .run()
    })
  }

  async proc(src, opts) {
    return new Promise(async (resolve, reject) => {
      src = path.normalize(src)

      const { quality } = opts
      // 倍数缩小，转jpg等
      const output = await this.ffmpegResolve(src, opts)
      // const info = await getFileInfo(output)
      try {
        const buffer = await readFile(output)
        const data = await compressor({
          // speed: 10,
          quality: [quality === 1 ? 0.8 : quality, quality],
          strip: true
        })(buffer)
        resolve({ tmp: output, data })
      } catch (e) {
        console.error('Error when optimize')
        fs.unlink(output, () => {
        })
        reject(e)
      }
    })
  }

  listener = () => {
    this.checkIt()
  }

  checkIt = () => {
    this.list
      .filter(uid => this.stateMapper[uid] === STATUS.WAITING)
      .forEach(uid => {
        const { clip, toJPG, quality, replace } = this.state
        this.stateMapper[uid] = STATUS.PENDING
        // getFileInfo(this.listMapper[uid].path).then(console.log)
        const opts = {
          clip: clip ? 0.5 : 1,
          extname: toJPG ? '.jpg' : null,
          quality: +quality
        }
        const src = this.listMapper[uid].path
        this.proc(src, opts)
          .then(async ({ tmp, data }) => {
            let output = src
            if (data.length < this.beforeSize[uid]) {
              if (!replace) {
                output = tmp
              } else {
                fs.unlink(tmp, () => {
                })
              }
              await writeFile(output, data)
            } else {
              // 没有达到预期，删除临时文件
              fs.unlink(tmp, () => {
              })
            }

            this.stateMapper[uid] = STATUS.SUCCESS
            return getFileInfo(output)
          })
          .then((metadata) => {
            this.listMapper[uid].outputMetaData = metadata
          })
          .catch((err) => {
            this.stateMapper[uid] = STATUS.FAILED
            console.error(err)
          })
          .finally(() => {
            this.setState({})
          })
      })
  }

  beforeUpload = (file) => {
    this.listMapper[file.uid] = file
    this.stateMapper[file.uid] = STATUS.WAITING
    this.beforeSize[file.uid] = file.size
    this.list.push(file.uid)
    this.setState({})
  }

  onQualityChange = (e) => {
    this.setState({ quality: e.target.value })
  }
  toggleReplace = () => {
    this.setState({ replace: !this.state.replace })
  }
  toggleClip = () => {
    this.setState({ clip: !this.state.clip })
  }
  toggleToJPG = () => {
    this.setState({ toJPG: !this.state.toJPG })
  }

  upload = (_path) => {
    const title = path.basename(_path)
    const ext = title.replace(/.+(\.[^.]+)$/, '$1')
    const key = 'assets/' + uuid() + ext
    return uploadToQiniu({ ...config, key, localFile: _path })
  }

  uploadToQiNiu = async (uid) => {
    const file = this.listMapper[uid]
    const compressed = file.outputMetaData.format.filename
    this.listMapper[uid].uploadedUrl = await this.upload(compressed)
    this.setState({})
  }

  render() {
    return <>
      <div style={flexBox}>
        <div style={globalActionBox}>
          <div style={globalActionItemBox}>
            <span>直接替换源文件<b>(请做好备份)</b></span>
            <Switch checked={this.state.replace} onChange={this.toggleReplace}/>
          </div>
          <div style={globalActionItemBox}>
            <span>裁剪至0.5x</span>
            <Switch checked={this.state.clip} onChange={this.toggleClip}/>
          </div>
          <div style={globalActionItemBox}>
            <span>转JPG</span>
            <Switch checked={this.state.toJPG} onChange={this.toggleToJPG}/>
          </div>
          <div style={globalActionItemBox}>
            <span>压缩质量(0~1, 1=best)</span>
            <input ref={this.qualityInput} value={this.state.quality} onChange={this.onQualityChange}
                   style={{ width: '80px' }}/>
          </div>
        </div>
        <div style={extensibleBox}>
          <Upload.Dragger
            name='file'
            accept='image/*'
            action='/'
            multiple
            showUploadList={false}
            beforeUpload={this.beforeUpload}
          >
            <p className="ant-upload-drag-icon">
              <Icon type="inbox"/>
            </p>
            <p className="ant-upload-text">点击或者拖拽素材文件到这个区域</p>
          </Upload.Dragger>
        </div>
      </div>
      <div>
        {this.list.map(uid => {
          const { path: _path, outputMetaData = { format: {} }, uploadedUrl } = this.listMapper[uid]
          const status = this.stateMapper[uid]
          const beforeSize = this.beforeSize[uid]

          let StatusIcon = ''
          let color
          switch (status) {
            case STATUS.WAITING:
              break
            case STATUS.PENDING:
              StatusIcon = 'ellipsis'
              break
            case STATUS.RESOLVING:
              StatusIcon = 'loading'
              break
            case STATUS.SUCCESS:
              StatusIcon = CheckCircleFilled
              color = 'green'
              break
            case STATUS.FAILED:
              StatusIcon = CloseCircleFilled
              color = 'red'
              break
          }
          return <div style={detailsBox}>
            <div style={extensibleBox}>{path.basename(_path)}</div>
            <div style={statusBox}>{fileSizePrettier(beforeSize)}</div>
            <div style={statusBox}>{fileSizePrettier(outputMetaData.format.size)}</div>
            <div style={statusBox}><StatusIcon style={{ color }}/></div>
            <div style={actionsBox}>
              <Button onClick={() => this.uploadToQiNiu(uid)}>上传至七牛</Button>
              {uploadedUrl ? <Button onClick={() => clipboard.writeText(uploadedUrl)}>复制到剪切板</Button> : null}
            </div>
          </div>
        })}
      </div>
    </>
  }
}

const flexBox = { display: 'flex' }
const extensibleBox = { flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }
const statusBox = { width: '100px', flexShrink: 0, padding: '0 20px', boxSizing: 'border-box', textAlign: 'center' }
const globalActionBox = { display: 'flex', flexDirection: 'column', width: '330px', flexShrink: 0 }
const globalActionItemBox = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px' }
const detailsBox = { display: 'flex', height: '50px', lineHeight: '50px' }
const actionsBox = { width: '300px', flexShrink: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }

export default Compress
